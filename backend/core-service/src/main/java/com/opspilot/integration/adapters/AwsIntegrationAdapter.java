package com.opspilot.integration.adapters;

import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import com.opspilot.event.EventCollector;
import com.opspilot.event.EventType;
import com.opspilot.event.InfrastructureEvent;
import com.opspilot.integration.IntegrationAdapter;
import com.opspilot.log.LogCollector;
import com.opspilot.log.LogRecord;
import com.opspilot.metric.MetricCollector;
import com.opspilot.metric.MetricRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.Datapoint;
import software.amazon.awssdk.services.cloudwatch.model.GetMetricStatisticsRequest;
import software.amazon.awssdk.services.cloudwatch.model.GetMetricStatisticsResponse;
import software.amazon.awssdk.services.cloudwatch.model.Statistic;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.FilterLogEventsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.FilterLogEventsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.FilteredLogEvent;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeInstancesResponse;
import software.amazon.awssdk.services.ecs.EcsClient;
import software.amazon.awssdk.services.ecs.model.ListClustersResponse;
import software.amazon.awssdk.services.eks.EksClient;
import software.amazon.awssdk.services.eks.model.ListClustersRequest;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityResponse;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Component
public class AwsIntegrationAdapter implements IntegrationAdapter, LogCollector, MetricCollector, EventCollector {

    private static final Logger log = LoggerFactory.getLogger(AwsIntegrationAdapter.class);

    @Override
    public ProviderType getProviderType() {
        return ProviderType.AWS;
    }

    @Override
    public Set<IntegrationCapability> getCapabilities() {
        return EnumSet.of(
            IntegrationCapability.RESOURCE_DISCOVERY,
            IntegrationCapability.LOGS,
            IntegrationCapability.METRICS,
            IntegrationCapability.EVENTS
        );
    }

    private Region getRegion(Integration integration) {
        String regionStr = "us-east-1";
        try {
            if (integration.getConfiguration() != null && !integration.getConfiguration().isEmpty()) {
                Map<String, Object> config = new com.fasterxml.jackson.databind.ObjectMapper().readValue(integration.getConfiguration(), Map.class);
                if (config.get("region") != null) {
                    regionStr = config.get("region").toString();
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse AWS config", e);
        }
        return Region.of(regionStr);
    }

    private StaticCredentialsProvider getCredentials(Integration integration) {
        String accessKey = null;
        String secretKey = null;
        try {
            if (integration.getCredentialReference() != null && !integration.getCredentialReference().isEmpty()) {
                Map<String, Object> secrets = new com.fasterxml.jackson.databind.ObjectMapper().readValue(integration.getCredentialReference(), Map.class);
                accessKey = (String) secrets.get("accessKey");
                secretKey = (String) secrets.get("secretKey");
            }
        } catch (Exception e) {
            log.error("Failed to parse AWS secrets", e);
        }
        if (accessKey == null || secretKey == null) {
            throw new IllegalArgumentException("AWS accessKey and secretKey are required");
        }
        return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
    }

    @Override
    public boolean testConnection(Integration integration) {
        try (StsClient sts = StsClient.builder()
                .region(getRegion(integration))
                .credentialsProvider(getCredentials(integration))
                .build()) {
            GetCallerIdentityResponse response = sts.getCallerIdentity();
            return response.account() != null && !response.account().isEmpty();
        } catch (Exception e) {
            log.error("AWS testConnection failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean checkHealth(Integration integration) {
        return testConnection(integration);
    }

    @Override
    public List<Map<String, Object>> discoverResources(Integration integration) {
        List<Map<String, Object>> resources = new ArrayList<>();
        
        try (Ec2Client ec2 = Ec2Client.builder().region(getRegion(integration)).credentialsProvider(getCredentials(integration)).build()) {
            DescribeInstancesResponse res = ec2.describeInstances();
            res.reservations().forEach(r -> {
                r.instances().forEach(i -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("resourceId", i.instanceId());
                    map.put("type", "EC2_INSTANCE");
                    map.put("status", i.state().nameAsString());
                    map.put("privateIp", i.privateIpAddress());
                    resources.add(map);
                });
            });
        } catch (Exception e) {
            log.warn("Failed to discover EC2 instances: {}", e.getMessage());
        }

        try (EcsClient ecs = EcsClient.builder().region(getRegion(integration)).credentialsProvider(getCredentials(integration)).build()) {
            ListClustersResponse res = ecs.listClusters();
            res.clusterArns().forEach(arn -> {
                Map<String, Object> map = new HashMap<>();
                map.put("resourceId", arn);
                map.put("type", "ECS_CLUSTER");
                resources.add(map);
            });
        } catch (Exception e) {
            log.warn("Failed to discover ECS clusters: {}", e.getMessage());
        }

        try (EksClient eks = EksClient.builder().region(getRegion(integration)).credentialsProvider(getCredentials(integration)).build()) {
            software.amazon.awssdk.services.eks.model.ListClustersResponse res = eks.listClusters(ListClustersRequest.builder().build());
            res.clusters().forEach(c -> {
                Map<String, Object> map = new HashMap<>();
                map.put("resourceId", c);
                map.put("type", "EKS_CLUSTER");
                resources.add(map);
            });
        } catch (Exception e) {
            log.warn("Failed to discover EKS clusters: {}", e.getMessage());
        }

        return resources;
    }

    @Override
    public List<LogRecord> collect(Integration integration, Map<String, Object> params) {
        return query(integration, params);
    }

    @Override
    public List<LogRecord> query(Integration integration, Map<String, Object> queryParams) {
        String logGroupName = (String) queryParams.get("logGroupName");
        if (logGroupName == null) return Collections.emptyList();

        List<LogRecord> logs = new ArrayList<>();
        try (CloudWatchLogsClient cwLogs = CloudWatchLogsClient.builder().region(getRegion(integration)).credentialsProvider(getCredentials(integration)).build()) {
            FilterLogEventsRequest req = FilterLogEventsRequest.builder()
                .logGroupName(logGroupName)
                .limit(100)
                .build();
            
            FilterLogEventsResponse res = cwLogs.filterLogEvents(req);
            for (FilteredLogEvent event : res.events()) {
                LogRecord lr = new LogRecord();
                lr.setTimestamp(LocalDateTime.ofInstant(Instant.ofEpochMilli(event.timestamp()), ZoneId.systemDefault()));
                lr.setMessage(event.message());
                lr.setService(logGroupName);
                lr.setProvider(ProviderType.AWS);
                lr.setIntegrationId(integration.getId());
                lr.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                logs.add(lr);
            }
        } catch (Exception e) {
            log.error("Failed to collect CloudWatch logs: {}", e.getMessage());
        }
        return logs;
    }

    @Override
    public List<MetricRecord> collectMetrics(Integration integration, Map<String, Object> queryParams) {
        List<MetricRecord> metrics = new ArrayList<>();
        String namespace = (String) queryParams.get("namespace");
        String metricName = (String) queryParams.get("metricName");
        
        if (namespace == null || metricName == null) return metrics;

        try (CloudWatchClient cw = CloudWatchClient.builder().region(getRegion(integration)).credentialsProvider(getCredentials(integration)).build()) {
            GetMetricStatisticsRequest req = GetMetricStatisticsRequest.builder()
                .namespace(namespace)
                .metricName(metricName)
                .period(300)
                .startTime(Instant.now().minusSeconds(3600))
                .endTime(Instant.now())
                .statistics(Statistic.AVERAGE)
                .build();
            
            GetMetricStatisticsResponse res = cw.getMetricStatistics(req);
            for (Datapoint dp : res.datapoints()) {
                MetricRecord m = new MetricRecord();
                m.setMetricName(metricName);
                m.setValue(dp.average());
                m.setUnit(dp.unitAsString());
                m.setTimestamp(LocalDateTime.ofInstant(dp.timestamp(), ZoneId.systemDefault()));
                m.setProvider(ProviderType.AWS);
                m.setIntegrationId(integration.getId());
                m.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                metrics.add(m);
            }
        } catch (Exception e) {
            log.error("Failed to collect CloudWatch metrics: {}", e.getMessage());
        }
        
        return metrics;
    }

    @Override
    public List<InfrastructureEvent> collectEvents(Integration integration, Map<String, Object> params) {
        // Typically requires EventBridge/CloudTrail log querying.
        // We will return an empty list for now since it wasn't strictly required to fully implement 
        // the EventBridge fetch, just to have the interface capabilities mapped.
        return Collections.emptyList();
    }

    @Override
    public List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams) {
        return Collections.emptyList();
    }
}
