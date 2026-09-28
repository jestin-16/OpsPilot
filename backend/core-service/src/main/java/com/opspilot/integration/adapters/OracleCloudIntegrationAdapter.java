package com.opspilot.integration.adapters;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import com.opspilot.event.EventCollector;
import com.opspilot.event.InfrastructureEvent;
import com.opspilot.integration.IntegrationAdapter;
import com.opspilot.log.LogCollector;
import com.opspilot.log.LogRecord;
import com.opspilot.metric.MetricCollector;
import com.opspilot.metric.MetricRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

// OCI SDK Imports
import com.oracle.bmc.auth.SimpleAuthenticationDetailsProvider;
import com.oracle.bmc.auth.StringPrivateKeySupplier;
import com.oracle.bmc.core.ComputeClient;
import com.oracle.bmc.core.requests.ListInstancesRequest;
import com.oracle.bmc.core.responses.ListInstancesResponse;
import com.oracle.bmc.identity.IdentityClient;
import com.oracle.bmc.identity.requests.GetUserRequest;
import com.oracle.bmc.identity.responses.GetUserResponse;
import com.oracle.bmc.loggingsearch.LogSearchClient;
import com.oracle.bmc.loggingsearch.model.SearchLogsDetails;
import com.oracle.bmc.loggingsearch.requests.SearchLogsRequest;
import com.oracle.bmc.loggingsearch.responses.SearchLogsResponse;
import com.oracle.bmc.monitoring.MonitoringClient;
import com.oracle.bmc.monitoring.model.SummarizeMetricsDataDetails;
import com.oracle.bmc.monitoring.requests.SummarizeMetricsDataRequest;
import com.oracle.bmc.monitoring.responses.SummarizeMetricsDataResponse;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Component
public class OracleCloudIntegrationAdapter implements IntegrationAdapter, LogCollector, MetricCollector, EventCollector {

    private static final Logger log = LoggerFactory.getLogger(OracleCloudIntegrationAdapter.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ProviderType getProviderType() {
        return ProviderType.ORACLE_CLOUD;
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

    private SimpleAuthenticationDetailsProvider getAuthProvider(Integration integration) {
        String tenantId = null;
        String userId = null;
        String fingerprint = null;
        String privateKey = null;
        String region = "us-ashburn-1";

        try {
            if (integration.getConfiguration() != null && !integration.getConfiguration().isEmpty()) {
                Map<String, Object> config = objectMapper.readValue(integration.getConfiguration(), Map.class);
                if (config.get("region") != null) {
                    region = config.get("region").toString();
                }
            }

            if (integration.getCredentialReference() != null && !integration.getCredentialReference().isEmpty()) {
                Map<String, Object> secrets = objectMapper.readValue(integration.getCredentialReference(), Map.class);
                tenantId = (String) secrets.get("tenantId");
                userId = (String) secrets.get("userId");
                fingerprint = (String) secrets.get("fingerprint");
                privateKey = (String) secrets.get("privateKey");
            }
        } catch (Exception e) {
            log.error("Failed to parse Oracle Cloud configuration/secrets", e);
        }

        if (tenantId == null || userId == null || fingerprint == null || privateKey == null) {
            throw new IllegalArgumentException("Oracle Cloud credentials (tenantId, userId, fingerprint, privateKey) are required");
        }

        return SimpleAuthenticationDetailsProvider.builder()
                .tenantId(tenantId)
                .userId(userId)
                .fingerprint(fingerprint)
                .privateKeySupplier(new StringPrivateKeySupplier(privateKey))
                .region(com.oracle.bmc.Region.valueOf(region))
                .build();
    }

    @Override
    public boolean testConnection(Integration integration) {
        try (IdentityClient client = new IdentityClient(getAuthProvider(integration))) {
            GetUserRequest req = GetUserRequest.builder()
                    .userId(getAuthProvider(integration).getUserId())
                    .build();
            GetUserResponse res = client.getUser(req);
            return res.getUser() != null;
        } catch (Exception e) {
            log.error("Oracle Cloud testConnection failed: {}", e.getMessage());
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
        try (ComputeClient client = new ComputeClient(getAuthProvider(integration))) {
            String compartmentId = getAuthProvider(integration).getTenantId(); // Default to root compartment
            
            // Allow override via config
            if (integration.getConfiguration() != null && !integration.getConfiguration().isEmpty()) {
                Map<String, Object> config = objectMapper.readValue(integration.getConfiguration(), Map.class);
                if (config.get("compartmentId") != null) {
                    compartmentId = config.get("compartmentId").toString();
                }
            }

            ListInstancesRequest req = ListInstancesRequest.builder()
                    .compartmentId(compartmentId)
                    .build();
            
            ListInstancesResponse res = client.listInstances(req);
            res.getItems().forEach(instance -> {
                Map<String, Object> map = new HashMap<>();
                map.put("resourceId", instance.getId());
                map.put("type", "OCI_COMPUTE_INSTANCE");
                map.put("name", instance.getDisplayName());
                map.put("status", instance.getLifecycleState().getValue());
                map.put("region", instance.getRegion());
                resources.add(map);
            });
        } catch (Exception e) {
            log.error("Failed to discover Oracle Cloud resources: {}", e.getMessage());
        }
        return resources;
    }

    @Override
    public List<LogRecord> collect(Integration integration, Map<String, Object> params) {
        return query(integration, params);
    }

    @Override
    public List<LogRecord> query(Integration integration, Map<String, Object> queryParams) {
        List<LogRecord> logs = new ArrayList<>();
        String searchQuery = (String) queryParams.get("searchQuery");
        
        if (searchQuery == null) {
            return logs; // Realistically requires a query for OCI logging search
        }

        try (LogSearchClient client = new LogSearchClient(getAuthProvider(integration))) {
            Date now = new Date();
            Date oneHourAgo = new Date(now.getTime() - 3600 * 1000);

            SearchLogsDetails details = SearchLogsDetails.builder()
                    .searchQuery(searchQuery)
                    .timeStart(oneHourAgo)
                    .timeEnd(now)
                    .isReturnFieldInfo(false)
                    .build();

            SearchLogsRequest req = SearchLogsRequest.builder()
                    .searchLogsDetails(details)
                    .limit(100)
                    .build();
            
            SearchLogsResponse res = client.searchLogs(req);
            if (res.getSearchResponse() != null && res.getSearchResponse().getResults() != null) {
                res.getSearchResponse().getResults().forEach(result -> {
                    LogRecord lr = new LogRecord();
                    lr.setId(UUID.randomUUID().toString());
                    lr.setTimestamp(LocalDateTime.now()); // Simplify timestamp mapping for mock
                    if (result.getData() != null) {
                        Map<String, Object> data = (Map<String, Object>) result.getData();
                        lr.setMessage(data.containsKey("message") ? data.get("message").toString() : data.toString());
                        Object timeObj = data.get("time");
                        if (timeObj != null) {
                            try {
                                Instant instant = Instant.parse(timeObj.toString());
                                lr.setTimestamp(LocalDateTime.ofInstant(instant, ZoneId.systemDefault()));
                            } catch (Exception ignored) {}
                        }
                    }
                    lr.setService("oracle-cloud-logging");
                    lr.setProvider(ProviderType.ORACLE_CLOUD);
                    lr.setIntegrationId(integration.getId());
                    lr.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                    logs.add(lr);
                });
            }
        } catch (Exception e) {
            log.error("Failed to collect Oracle Cloud logs: {}", e.getMessage());
        }
        return logs;
    }

    @Override
    public List<MetricRecord> collectMetrics(Integration integration, Map<String, Object> queryParams) {
        List<MetricRecord> metrics = new ArrayList<>();
        String compartmentId = getAuthProvider(integration).getTenantId();
        String namespace = (String) queryParams.get("namespace");
        String metricQuery = (String) queryParams.get("query");

        if (namespace == null || metricQuery == null) {
            return metrics;
        }

        try (MonitoringClient client = new MonitoringClient(getAuthProvider(integration))) {
            Date now = new Date();
            Date oneHourAgo = new Date(now.getTime() - 3600 * 1000);

            SummarizeMetricsDataDetails details = SummarizeMetricsDataDetails.builder()
                    .namespace(namespace)
                    .query(metricQuery)
                    .startTime(oneHourAgo)
                    .endTime(now)
                    .build();

            SummarizeMetricsDataRequest req = SummarizeMetricsDataRequest.builder()
                    .compartmentId(compartmentId)
                    .summarizeMetricsDataDetails(details)
                    .build();
            
            SummarizeMetricsDataResponse res = client.summarizeMetricsData(req);
            res.getItems().forEach(summary -> {
                summary.getAggregatedDatapoints().forEach(dp -> {
                    MetricRecord m = new MetricRecord();
                    m.setMetricName(summary.getName());
                    m.setValue(dp.getValue());
                    m.setTimestamp(LocalDateTime.ofInstant(dp.getTimestamp().toInstant(), ZoneId.systemDefault()));
                    m.setProvider(ProviderType.ORACLE_CLOUD);
                    m.setIntegrationId(integration.getId());
                    m.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                    m.setDimensions(summary.getDimensions());
                    metrics.add(m);
                });
            });
        } catch (Exception e) {
            log.error("Failed to collect Oracle Cloud metrics: {}", e.getMessage());
        }
        return metrics;
    }

    @Override
    public List<InfrastructureEvent> collectEvents(Integration integration, Map<String, Object> params) {
        // Oracle Cloud Events service usually routes to Streaming or Notifications.
        // Returning empty list similar to AWS EventBridge scope.
        return Collections.emptyList();
    }

    @Override
    public List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams) {
        return Collections.emptyList();
    }
}
