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
    void testExecuteActionMissingContainerId() {
        Map<String, Object> params = new HashMap<>();
        assertThrows(IllegalArgumentException.class, () -> adapter.executeAction(integration, IntegrationCapability.START, params));
    }

    @Test
    void testExecuteActionUnsupported() {
        Map<String, Object> params = new HashMap<>();
        params.put("containerId", "12345");
        assertThrows(UnsupportedOperationException.class, () -> adapter.executeAction(integration, IntegrationCapability.ROLLBACK, params));
    }

    @Test
    void testCollectMissingContainerId() {
        Map<String, Object> params = new HashMap<>();
        assertThrows(IllegalArgumentException.class, () -> adapter.collect(integration, params));
    }
}
