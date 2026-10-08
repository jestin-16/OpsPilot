package com.opspilot.integration.adapters;

import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.List;
import com.opspilot.metric.MetricRecord;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class DockerIntegrationAdapterTest {

    @InjectMocks
    private DockerIntegrationAdapter adapter;

    private Integration integration;

    @BeforeEach
    void setUp() {
        integration = new Integration();
        integration.setProvider(ProviderType.DOCKER);
    }

    @Test
    void testGetProviderType() {
        assertEquals(ProviderType.DOCKER, adapter.getProviderType());
    }

    @Test
    void testGetCapabilities() {
        Set<IntegrationCapability> capabilities = adapter.getCapabilities();
        assertTrue(capabilities.contains(IntegrationCapability.RESOURCE_DISCOVERY));
        assertTrue(capabilities.contains(IntegrationCapability.START));
        assertTrue(capabilities.contains(IntegrationCapability.STOP));
        assertTrue(capabilities.contains(IntegrationCapability.RESTART));
        assertTrue(capabilities.contains(IntegrationCapability.LIVE_LOGS));
        assertFalse(capabilities.contains(IntegrationCapability.DEPLOYMENT));
    }

    @Test
    void testSupports() {
        assertTrue(adapter.supports(IntegrationCapability.START));
        assertFalse(adapter.supports(IntegrationCapability.ROLLBACK));
    }

    @Test
    void testExecuteActionUnsupported() {
        Map<String, Object> params = new HashMap<>();
        params.put("containerId", "12345");
        assertThrows(UnsupportedOperationException.class, () -> adapter.executeAction(integration, IntegrationCapability.START, params));
    }

    @Test
    void testCollectEmpty() {
        Map<String, Object> params = new HashMap<>();
        assertTrue(adapter.collect(integration, params).isEmpty());
    }

    @Test
    void testCollectMetricsReturnsEmptyListForBaseline() {
        Map<String, Object> params = new HashMap<>();
        List<MetricRecord> metrics = adapter.collectMetrics(integration, params);
        assertNotNull(metrics);
        assertTrue(metrics.isEmpty(), "Baseline collectMetrics should return an empty list");
    }
}
