package com.opspilot.integration.adapters;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.core.command.LogContainerResultCallback;
import com.github.dockerjava.transport.DockerHttpClient;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import com.opspilot.integration.IntegrationAdapter;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

import com.opspilot.log.LogCollector;
import com.opspilot.log.LogRecord;
import com.opspilot.metric.MetricCollector;
import com.opspilot.metric.MetricRecord;
import com.opspilot.event.EventCollector;
import com.opspilot.event.InfrastructureEvent;
import com.opspilot.event.EventType;
import java.time.LocalDateTime;

@Component
public class DockerIntegrationAdapter implements IntegrationAdapter, LogCollector, MetricCollector, EventCollector {

    private final DockerClient dockerClient = createDockerClient();

    private static DockerClient createDockerClient() {
        DockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder().build();
        DockerHttpClient httpClient = new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .build();
        return DockerClientImpl.getInstance(config, httpClient);
    }

    @Override
    public ProviderType getProviderType() {
        return ProviderType.DOCKER;
    }

    @Override
    public Set<IntegrationCapability> getCapabilities() {
        return EnumSet.of(
                IntegrationCapability.RESOURCE_DISCOVERY,
                IntegrationCapability.LIVE_LOGS,
                IntegrationCapability.EVENTS,
                IntegrationCapability.START,
                IntegrationCapability.STOP,
                IntegrationCapability.RESTART
        );
    }

    @Override
    public boolean testConnection(Integration integration) {
        try {
            dockerClient.pingCmd().exec();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean checkHealth(Integration integration) {
        return testConnection(integration);
    }

    @Override
    public List<Map<String, Object>> discoverResources(Integration integration) {
        List<Container> containers = dockerClient.listContainersCmd().withShowAll(true).exec();
        return containers.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("image", c.getImage());
            map.put("state", c.getState());
            map.put("status", c.getStatus());
            map.put("names", c.getNames());
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public List<LogRecord> collect(Integration integration, Map<String, Object> params) {
        return fetchDockerLogs(integration, params);
    }

    @Override
    public List<LogRecord> query(Integration integration, Map<String, Object> queryParams) {
        return fetchDockerLogs(integration, queryParams);
    }

    private List<LogRecord> fetchDockerLogs(Integration integration, Map<String, Object> queryParams) {
        String containerId = (String) queryParams.get("containerId");
        if (containerId == null) {
            throw new IllegalArgumentException("containerId is required for Docker logs");
        }
        
        List<LogRecord> logsList = new ArrayList<>();
        try {
            dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .withTail(50)
                    .exec(new LogContainerResultCallback() {
                        @Override
                        public void onNext(Frame item) {
                            LogRecord record = new LogRecord();
                            record.setId(UUID.randomUUID().toString());
                            record.setTimestamp(LocalDateTime.now());
                            record.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                            record.setIntegrationId(integration.getId());
                            record.setProvider(ProviderType.DOCKER);
                            record.setResourceId(containerId);
                            record.setResourceType("CONTAINER");
                            record.setService("docker-" + containerId);
                            record.setLevel(item.getStreamType().name().equals("STDERR") ? "ERROR" : "INFO");
                            record.setMessage(new String(item.getPayload()));
                            logsList.add(record);
                        }
                    }).awaitCompletion();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        int offset = queryParams.containsKey("offset") ? Integer.parseInt(queryParams.get("offset").toString()) : 0;
        int limit = queryParams.containsKey("limit") ? Integer.parseInt(queryParams.get("limit").toString()) : 1000;
        if (offset >= logsList.size()) return new ArrayList<>();
        return logsList.subList(offset, Math.min(offset + limit, logsList.size()));
    }

    @Override
    public void stream(Integration integration, Map<String, Object> params, java.util.function.Consumer<LogRecord> logConsumer) {
        String containerId = (String) params.get("containerId");
        if (containerId == null) {
            throw new IllegalArgumentException("containerId is required for Docker log streaming");
        }
        
        try {
            dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .withFollowStream(true)
                    .withTail(50)
                    .exec(new LogContainerResultCallback() {
                        @Override
                        public void onNext(Frame item) {
                            LogRecord record = new LogRecord();
                            record.setId(UUID.randomUUID().toString());
                            record.setTimestamp(LocalDateTime.now());
                            record.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                            record.setIntegrationId(integration.getId());
                            record.setProvider(ProviderType.DOCKER);
                            record.setResourceId(containerId);
                            record.setResourceType("CONTAINER");
                            record.setService("docker-" + containerId);
                            record.setLevel(item.getStreamType().name().equals("STDERR") ? "ERROR" : "INFO");
                            record.setMessage(new String(item.getPayload()).trim());
                            logConsumer.accept(record);
                        }
                    }).awaitCompletion();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public List<MetricRecord> collectMetrics(Integration integration, Map<String, Object> queryParams) {
        // Implementation of metric collection from Docker
        // Usually docker stats API returns CPU/Memory/Network.
        // For baseline, return empty list or basic mocked data if docker stats is heavy.
        return Collections.emptyList();
    }

    @Override
    public List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams) {
        return Collections.emptyList();
    }

    @Override
    public List<InfrastructureEvent> collectEvents(Integration integration, Map<String, Object> params) {
        // Events in Docker are streamed. Returning an empty list here since synchronous fetching is limited.
        // In a real scenario, this would attach to the events stream.
        return Collections.emptyList();
    }

    @Override
    public boolean executeAction(Integration integration, IntegrationCapability action, Map<String, Object> params) {
        String containerId = (String) params.get("containerId");
        if (containerId == null) {
            throw new IllegalArgumentException("containerId is required for Docker lifecycle actions");
        }

        switch (action) {
            case START:
                dockerClient.startContainerCmd(containerId).exec();
                return true;
            case STOP:
                dockerClient.stopContainerCmd(containerId).exec();
                return true;
            case RESTART:
                dockerClient.restartContainerCmd(containerId).exec();
                return true;
            default:
                throw new UnsupportedOperationException("Action not supported by Docker adapter: " + action);
        }
    }
}
