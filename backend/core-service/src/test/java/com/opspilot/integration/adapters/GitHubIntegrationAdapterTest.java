package com.opspilot.integration.adapters;

import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class GitHubIntegrationAdapterTest {

    @InjectMocks
    private GitHubIntegrationAdapter adapter;

    private Integration integration;
    private Project project;

    @BeforeEach
    void setUp() {
        project = new Project();
        project.setId(1L);
        project.setGithubRepoName("opspilot/test-repo");

        integration = new Integration();
        integration.setProvider(ProviderType.GITHUB);
        integration.setProject(project);
    }

    @Test
    void testGetProviderType() {
        assertEquals(ProviderType.GITHUB, adapter.getProviderType());
    }

    @Test
    void testGetCapabilities() {
        Set<IntegrationCapability> capabilities = adapter.getCapabilities();
        assertTrue(capabilities.contains(IntegrationCapability.RESOURCE_DISCOVERY));
        assertTrue(capabilities.contains(IntegrationCapability.EVENTS));
        assertTrue(capabilities.contains(IntegrationCapability.LOGS));
        assertTrue(capabilities.contains(IntegrationCapability.DEPLOYMENT));
        assertFalse(capabilities.contains(IntegrationCapability.START));
    }

    @Test
    void testSupports() {
        assertTrue(adapter.supports(IntegrationCapability.RESOURCE_DISCOVERY));
        assertFalse(adapter.supports(IntegrationCapability.RESTART));
    }

    @Test
    void testExecuteActionUnsupported() {
        assertThrows(UnsupportedOperationException.class, () -> adapter.executeAction(integration, IntegrationCapability.START, new HashMap<>()));
    }
}
