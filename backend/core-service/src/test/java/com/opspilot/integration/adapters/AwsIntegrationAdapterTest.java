package com.opspilot.integration.adapters;

import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.enums.ProviderType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class AwsIntegrationAdapterTest {

    @InjectMocks
    private AwsIntegrationAdapter adapter;

    private Integration integration;

    @BeforeEach
    void setUp() {
        Project project = new Project();
        project.setId(1L);

        integration = new Integration();
        integration.setId(100L);
        integration.setProject(project);
        integration.setProvider(ProviderType.AWS);

        Map<String, Object> config = new HashMap<>();
        config.put("region", "us-east-1");
        integration.setConfig(config);

        Map<String, Object> secrets = new HashMap<>();
        secrets.put("accessKey", "DUMMY_KEY");
        secrets.put("secretKey", "DUMMY_SECRET");
        integration.setSecrets(secrets);
    }

    @Test
    void testGetProviderType() {
        assertEquals(ProviderType.AWS, adapter.getProviderType());
    }

    @Test
    void testGetCapabilities() {
        assertTrue(adapter.getCapabilities().size() > 0);
    }

    @Test
    void testConnectionWithInvalidCredentialsReturnsFalse() {
        // By default, the adapter creates real AWS clients but using invalid static credentials
        // It will fail validation against AWS and return false
        assertFalse(adapter.testConnection(integration));
    }

    @Test
    void testDiscoverResourcesFailsGracefully() {
        // With invalid credentials, it should just return empty list and log warnings, not throw
        assertTrue(adapter.discoverResources(integration).isEmpty());
    }

    @Test
    void testCollectLogsFailsGracefully() {
        Map<String, Object> params = new HashMap<>();
        params.put("logGroupName", "/aws/lambda/dummy");
        assertTrue(adapter.collect(integration, params).isEmpty());
    }

    @Test
    void testCollectMetricsFailsGracefully() {
        Map<String, Object> params = new HashMap<>();
        params.put("namespace", "AWS/EC2");
        params.put("metricName", "CPUUtilization");
        assertTrue(adapter.collectMetrics(integration, params).isEmpty());
    }
}
