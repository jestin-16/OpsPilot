package com.opspilot.service;

import com.opspilot.dto.IntegrationHealthResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

public class IntegrationHealthServiceTest {

    @Mock
    private PrometheusService prometheusService;

    @Mock
    private KubernetesMonitoringService kubernetesMonitoringService;

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @BeforeEach
    public void setup() throws SQLException {
        MockitoAnnotations.openMocks(this);
        when(dataSource.getConnection()).thenReturn(connection);
    }

    private IntegrationHealthService createService(boolean prometheusEnabled, boolean kubernetesEnabled, boolean lokiEnabled) {
        return new IntegrationHealthService(
                prometheusService,
                kubernetesMonitoringService,
                dataSource,
                prometheusEnabled,
                kubernetesEnabled,
                lokiEnabled
        );
    }

    private void mockDbHealthy(boolean healthy) throws SQLException {
        when(connection.isValid(anyInt())).thenReturn(healthy);
    }

    @Test
    public void testKubernetesEnabledAndAvailable() throws SQLException {
        mockDbHealthy(true);
        org.mockito.Mockito.doReturn(true).when(kubernetesMonitoringService).isAvailable();
        org.mockito.Mockito.doReturn(true).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, true, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("OPERATIONAL", response.overallStatus());
        IntegrationHealthResponse.IntegrationStatus k8s = response.integrations().stream().filter(i -> i.provider().equals("KUBERNETES")).findFirst().get();
        assertEquals("CONNECTED", k8s.status());
    }

    @Test
    public void testKubernetesEnabledAndUnavailable() throws SQLException {
        mockDbHealthy(true);
        org.mockito.Mockito.doReturn(false).when(kubernetesMonitoringService).isAvailable();
        org.mockito.Mockito.doReturn(true).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, true, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("OPERATIONAL_WITH_WARNINGS", response.overallStatus());
        IntegrationHealthResponse.IntegrationStatus k8s = response.integrations().stream().filter(i -> i.provider().equals("KUBERNETES")).findFirst().get();
        assertEquals("DISCONNECTED", k8s.status());
    }

    @Test
    public void testKubernetesDisabled() throws SQLException {
        mockDbHealthy(true);
        org.mockito.Mockito.doReturn(true).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, false, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("OPERATIONAL", response.overallStatus());
        IntegrationHealthResponse.IntegrationStatus k8s = response.integrations().stream().filter(i -> i.provider().equals("KUBERNETES")).findFirst().get();
        assertEquals("DISABLED", k8s.status());
    }

    @Test
    public void testPrometheusEnabledAndAvailable() throws SQLException {
        mockDbHealthy(true);
        org.mockito.Mockito.doReturn(true).when(kubernetesMonitoringService).isAvailable();
        org.mockito.Mockito.doReturn(true).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, true, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("OPERATIONAL", response.overallStatus());
        IntegrationHealthResponse.IntegrationStatus prom = response.integrations().stream().filter(i -> i.provider().equals("PROMETHEUS")).findFirst().get();
        assertEquals("CONNECTED", prom.status());
    }

    @Test
    public void testPrometheusEnabledAndUnavailable() throws SQLException {
        mockDbHealthy(true);
        org.mockito.Mockito.doReturn(true).when(kubernetesMonitoringService).isAvailable();
        org.mockito.Mockito.doReturn(false).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, true, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("OPERATIONAL_WITH_WARNINGS", response.overallStatus());
        IntegrationHealthResponse.IntegrationStatus prom = response.integrations().stream().filter(i -> i.provider().equals("PROMETHEUS")).findFirst().get();
        assertEquals("DISCONNECTED", prom.status());
    }

    @Test
    public void testPrometheusDisabled() throws SQLException {
        mockDbHealthy(true);
        org.mockito.Mockito.doReturn(true).when(kubernetesMonitoringService).isAvailable();

        IntegrationHealthService service = createService(false, true, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("OPERATIONAL", response.overallStatus());
        IntegrationHealthResponse.IntegrationStatus prom = response.integrations().stream().filter(i -> i.provider().equals("PROMETHEUS")).findFirst().get();
        assertEquals("DISABLED", prom.status());
    }

    @Test
    public void testLokiDisabled() throws SQLException {
        mockDbHealthy(true);
        org.mockito.Mockito.doReturn(true).when(kubernetesMonitoringService).isAvailable();
        org.mockito.Mockito.doReturn(true).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, true, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("OPERATIONAL", response.overallStatus());
        IntegrationHealthResponse.IntegrationStatus loki = response.integrations().stream().filter(i -> i.provider().equals("LOKI")).findFirst().get();
        assertEquals("DISABLED", loki.status());
    }

    @Test
    public void testMultipleOptionalIntegrationsUnavailable() throws SQLException {
        mockDbHealthy(true);
        org.mockito.Mockito.doReturn(false).when(kubernetesMonitoringService).isAvailable();
        org.mockito.Mockito.doReturn(false).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, true, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("OPERATIONAL_WITH_WARNINGS", response.overallStatus());
    }

    @Test
    public void testCoreServiceUnavailable() throws SQLException {
        mockDbHealthy(false);
        org.mockito.Mockito.doReturn(true).when(kubernetesMonitoringService).isAvailable();
        org.mockito.Mockito.doReturn(true).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, true, false);
        IntegrationHealthResponse response = service.getHealth();

        assertEquals("CRITICAL", response.overallStatus());
    }

    @Test
    public void testMixedCoreAndOptionalFailures() throws SQLException {
        mockDbHealthy(false);
        org.mockito.Mockito.doReturn(false).when(kubernetesMonitoringService).isAvailable();
        org.mockito.Mockito.doReturn(false).when(prometheusService).isAvailable();

        IntegrationHealthService service = createService(true, true, false);
        IntegrationHealthResponse response = service.getHealth();

        // Core failure supersedes optional failure
        assertEquals("CRITICAL", response.overallStatus());
    }
}
