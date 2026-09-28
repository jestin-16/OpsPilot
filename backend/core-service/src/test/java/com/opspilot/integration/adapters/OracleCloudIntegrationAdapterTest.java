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
public class OracleCloudIntegrationAdapterTest {

    @InjectMocks
    private OracleCloudIntegrationAdapter adapter;

    private Integration integration;

    @BeforeEach
    void setUp() {
        Project project = new Project();
        project.setId(1L);

        integration = new Integration();
        integration.setId(100L);
        integration.setProject(project);
        integration.setProvider(ProviderType.ORACLE_CLOUD);

        integration.setConfiguration("{\"region\": \"us-ashburn-1\", \"compartmentId\": \"ocid1.compartment.oc1..dummy\"}");
        integration.setCredentialReference("{\"tenantId\": \"ocid1.tenancy.oc1..dummy\", \"userId\": \"ocid1.user.oc1..dummy\", \"fingerprint\": \"20:3b:97:13:55:1c:5b:0d:d3:37:d8:50:4e:c5:3a:34\", \"privateKey\": \"-----BEGIN RSA PRIVATE KEY-----\\nMIICXQIBAAKBgQCqGKukO1De7zhZj6+H0qtjTkVxwTCpvKe4eCZ0FPqri0cb2JZfXJ/DgYSF6vUp\\nwmJG8wVQZKjeGcjDOL5UlsuusFncCzWBQ7RKNUSesmQRMSGkVb1/3j+skZ6UtW+5u09lHNsj6tQ5\\n1s1SPrCBkedbNf0Tp0GbMvkRQqq5G3KzLwIDAQABAoGBAIGvS3gGzQvJqYk1hJpD+J1hXGvXg33P\\n0YvJqYk1hJpD+J1hXGvXg33P0YvJqYk1hJpD+J1hXGvXg33P0YvJqYk1hJpD+J1hXGvXg33P0YvJq\\nYk1hJpD+J1hXGvXg33P0YvJqYk1hJpD+J1hXGvXg33P0YvJqYk1hJpD+J1hXGvXg33P0YvJqYk1hJpD+J1hXGvXg33P0YvJqYk1hJpD+J1hXGvXg33P0YvJqYk1hJpD+J1hXGvXg33P0YvJqYk1hJpD+J1\\n-----END RSA PRIVATE KEY-----\"}");
    }

    @Test
    void testGetProviderType() {
        assertEquals(ProviderType.ORACLE_CLOUD, adapter.getProviderType());
    }

    @Test
    void testGetCapabilities() {
        assertTrue(adapter.getCapabilities().size() > 0);
    }

    @Test
    void testConnectionWithInvalidCredentialsReturnsFalse() {
        // Will throw exceptions when trying to authenticate the fake RSA key with Oracle
        assertFalse(adapter.testConnection(integration));
    }

    @Test
    void testDiscoverResourcesFailsGracefully() {
        assertTrue(adapter.discoverResources(integration).isEmpty());
    }

    @Test
    void testCollectLogsFailsGracefully() {
        Map<String, Object> params = new HashMap<>();
        params.put("searchQuery", "search \"ocid1.compartment.oc1..dummy\"");
        assertTrue(adapter.collect(integration, params).isEmpty());
    }

    @Test
    void testCollectMetricsFailsGracefully() {
        Map<String, Object> params = new HashMap<>();
        params.put("namespace", "oci_computeagent");
        params.put("query", "CpuUtilization[1m].mean()");
        assertTrue(adapter.collectMetrics(integration, params).isEmpty());
    }
}
