package com.opspilot.integration.adapters;

import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import com.opspilot.integration.IntegrationAdapter;
import org.springframework.stereotype.Component;

import java.util.*;

import com.opspilot.log.LogCollector;
import com.opspilot.log.LogRecord;
import com.opspilot.metric.MetricCollector;
import com.opspilot.metric.MetricRecord;
import com.opspilot.event.EventCollector;
import com.opspilot.event.InfrastructureEvent;

@Component
public class DockerIntegrationAdapter implements IntegrationAdapter, LogCollector, MetricCollector, EventCollector {

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
        return false;
    }

    @Override
    public boolean checkHealth(Integration integration) {
        return false;
    }

    @Override
    public List<Map<String, Object>> discoverResources(Integration integration) {
        return Collections.emptyList();
    }

    @Override
    public List<LogRecord> collect(Integration integration, Map<String, Object> params) {
        return Collections.emptyList();
    }

    @Override
    public List<LogRecord> query(Integration integration, Map<String, Object> queryParams) {
        return Collections.emptyList();
    }

    @Override
    public void stream(Integration integration, Map<String, Object> params, java.util.function.Consumer<LogRecord> logConsumer) {
        throw new UnsupportedOperationException("Streaming is not supported in push model.");
    }

    @Override
    public List<MetricRecord> collectMetrics(Integration integration, Map<String, Object> queryParams) {
        return Collections.emptyList();
    }

    @Override
    public List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams) {
        return Collections.emptyList();
    }

    @Override
    public List<InfrastructureEvent> collectEvents(Integration integration, Map<String, Object> params) {
        return Collections.emptyList();
    }

    @Override
    public boolean executeAction(Integration integration, IntegrationCapability action, Map<String, Object> params) {
        throw new UnsupportedOperationException("Action not supported in push model.");
    }
}
