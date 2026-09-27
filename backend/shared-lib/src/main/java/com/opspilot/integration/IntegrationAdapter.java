package com.opspilot.integration;

import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface IntegrationAdapter {
    /**
     * Identifies the provider type this adapter handles.
     */
    ProviderType getProviderType();

    /**
     * Lists the capabilities this adapter implementation supports.
     */
    Set<IntegrationCapability> getCapabilities();

    /**
     * Checks if a specific capability is supported.
     */
    default boolean supports(IntegrationCapability capability) {
        return getCapabilities().contains(capability);
    }

    /**
     * Tests the connection to the provider using the integration's configuration.
     * Throws an exception or returns false if the connection fails.
     */
    boolean testConnection(Integration integration);

    /**
     * Checks the health of the integration.
     */
    boolean checkHealth(Integration integration);

    /**
     * Discovers resources (e.g. containers, pods, repositories) associated with the integration.
     */
    List<Map<String, Object>> discoverResources(Integration integration);

    // getLogs has been extracted to LogCollector interface

    /**
     * Fetches metrics from the provider.
     */
    List<Map<String, Object>> getMetrics(Integration integration, Map<String, Object> queryParams);

    /**
     * Fetches events from the provider.
     */
    List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams);

    /**
     * Executes a lifecycle action on the provider.
     */
    default boolean executeAction(Integration integration, IntegrationCapability action, Map<String, Object> params) {
        throw new UnsupportedOperationException("Action not supported: " + action);
    }
}
