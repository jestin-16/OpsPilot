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
public class KubernetesIntegrationAdapterTest {

    @InjectMocks
    private KubernetesIntegrationAdapter adapter;

    private Integration integration;

    @BeforeEach
    void setUp() {
        integration = new Integration();
        integration.setProvider(ProviderType.KUBERNETES);
    }

    @Test
    void testGetProviderType() {
        assertEquals(ProviderType.KUBERNETES, adapter.getProviderType());
    }

    @Test
    void testGetCapabilities() {
        Set<IntegrationCapability> capabilities = adapter.getCapabilities();
        assertTrue(capabilities.contains(IntegrationCapability.RESOURCE_DISCOVERY));
        assertTrue(capabilities.contains(IntegrationCapability.LIVE_LOGS));
        assertTrue(capabilities.contains(IntegrationCapability.LOGS));
        assertTrue(capabilities.contains(IntegrationCapability.EVENTS));
        assertTrue(capabilities.contains(IntegrationCapability.METRICS));
        assertTrue(capabilities.contains(IntegrationCapability.RESTART));
        assertFalse(capabilities.contains(IntegrationCapability.START));
    }

    @Test
    void testSupports() {
        assertTrue(adapter.supports(IntegrationCapability.RESOURCE_DISCOVERY));
        assertFalse(adapter.supports(IntegrationCapability.STOP));
    }

    @Test
    void testCollectMissingParams() {
        Map<String, Object> params = new HashMap<>();
        assertThrows(IllegalArgumentException.class, () -> adapter.collect(integration, params));
        
        params.put("podName", "test-pod");
        assertThrows(IllegalArgumentException.class, () -> adapter.collect(integration, params));
    }

    @Test
    void testGetEventsMissingParams() {
        Map<String, Object> params = new HashMap<>();
        assertThrows(IllegalArgumentException.class, () -> adapter.getEvents(integration, params));
    }

    @Test
    void testExecuteActionMissingParams() {
        Map<String, Object> params = new HashMap<>();
        assertThrows(IllegalArgumentException.class, () -> adapter.executeAction(integration, IntegrationCapability.RESTART, params));
    }

    @Test
    void testExecuteActionUnsupported() {
        Map<String, Object> params = new HashMap<>();
        params.put("podName", "test-pod");
        params.put("namespace", "default");
        assertThrows(UnsupportedOperationException.class, () -> adapter.executeAction(integration, IntegrationCapability.STOP, params));
    }

    @Test
    void testCollectMetricsReturnsEmptyListForBaseline() {
        Map<String, Object> params = new HashMap<>();
        List<MetricRecord> metrics = adapter.collectMetrics(integration, params);
        assertNotNull(metrics);
        assertTrue(metrics.isEmpty(), "Baseline collectMetrics should return an empty list");
    }
}
