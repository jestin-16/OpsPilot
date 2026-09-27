package com.opspilot.integration;

import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class IntegrationProviderRegistryTest {

    private IntegrationProviderRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new IntegrationProviderRegistry(Collections.emptyList());
    }

    @Test
    void testAdapterRegistrationAndLookup() {
        IntegrationAdapter mockAdapter = createMockAdapter(ProviderType.DOCKER, Set.of(IntegrationCapability.START, IntegrationCapability.STOP));
        registry.registerAdapter(mockAdapter);

        Optional<IntegrationAdapter> retrieved = registry.getAdapter(ProviderType.DOCKER);
        assertTrue(retrieved.isPresent());
        assertEquals(ProviderType.DOCKER, retrieved.get().getProviderType());
    }

    @Test
    void testUnknownProviderHandling() {
        Optional<IntegrationAdapter> retrieved = registry.getAdapter(ProviderType.AWS);
        assertFalse(retrieved.isPresent());
    }

    @Test
    void testCapabilityLookup() {
        IntegrationAdapter mockAdapter = createMockAdapter(ProviderType.KUBERNETES, Set.of(IntegrationCapability.RESOURCE_DISCOVERY, IntegrationCapability.LOGS));
        registry.registerAdapter(mockAdapter);

        IntegrationAdapter retrieved = registry.getAdapter(ProviderType.KUBERNETES).get();
        
        assertTrue(retrieved.supports(IntegrationCapability.RESOURCE_DISCOVERY));
        assertTrue(retrieved.supports(IntegrationCapability.LOGS));
        assertFalse(retrieved.supports(IntegrationCapability.DEPLOYMENT));
    }

    @Test
    void testRegisterAdapterWithNullThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> registry.registerAdapter(null));
    }

    private IntegrationAdapter createMockAdapter(ProviderType type, Set<IntegrationCapability> capabilities) {
        return new IntegrationAdapter() {
            @Override
            public ProviderType getProviderType() { return type; }

            @Override
            public Set<IntegrationCapability> getCapabilities() { return capabilities; }

            @Override
            public boolean testConnection(Integration integration) { return true; }

            @Override
            public boolean checkHealth(Integration integration) { return true; }

            @Override
            public List<Map<String, Object>> discoverResources(Integration integration) { return Collections.emptyList(); }

            @Override
            public List<Map<String, Object>> getMetrics(Integration integration, Map<String, Object> queryParams) { return Collections.emptyList(); }

            @Override
            public List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams) { return Collections.emptyList(); }
        };
    }
}
