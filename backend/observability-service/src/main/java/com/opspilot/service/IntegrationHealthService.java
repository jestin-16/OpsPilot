package com.opspilot.service;

import com.opspilot.dto.IntegrationHealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class IntegrationHealthService {
    private final PrometheusService prometheusService;
    private final KubernetesMonitoringService kubernetesMonitoringService;
    private final DataSource dataSource;
    private final boolean prometheusEnabled;
    private final boolean kubernetesEnabled;
    private final boolean lokiEnabled;

    public IntegrationHealthService(PrometheusService prometheusService,
                                    KubernetesMonitoringService kubernetesMonitoringService,
                                    DataSource dataSource,
                                    @Value("${monitoring.prometheus.enabled:true}") boolean prometheusEnabled,
                                    @Value("${monitoring.kubernetes.enabled:true}") boolean kubernetesEnabled,
                                    @Value("${monitoring.loki.enabled:false}") boolean lokiEnabled) {
        this.prometheusService = prometheusService;
        this.kubernetesMonitoringService = kubernetesMonitoringService;
        this.dataSource = dataSource;
        this.prometheusEnabled = prometheusEnabled;
        this.kubernetesEnabled = kubernetesEnabled;
        this.lokiEnabled = lokiEnabled;
    }

    private boolean isDatabaseHealthy() {
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }

    public IntegrationHealthResponse getHealth() {
        Instant checkedAt = Instant.now();
        List<IntegrationHealthResponse.IntegrationStatus> integrations = new ArrayList<>();
        
        // Check core services
        boolean dbHealthy = isDatabaseHealthy();
        
        // Optional integrations
        boolean k8sAvailable = kubernetesEnabled && kubernetesMonitoringService.isAvailable();
        String k8sStatus = !kubernetesEnabled ? "DISABLED" : (k8sAvailable ? "CONNECTED" : "DISCONNECTED");
        String k8sMsg = !kubernetesEnabled ? "Integration disabled" : (k8sAvailable ? null : "Kubernetes API unavailable");
        integrations.add(new IntegrationHealthResponse.IntegrationStatus("KUBERNETES", kubernetesEnabled, k8sStatus, k8sMsg, checkedAt));

        boolean promAvailable = prometheusEnabled && prometheusService.isAvailable();
        String promStatus = !prometheusEnabled ? "DISABLED" : (promAvailable ? "CONNECTED" : "DISCONNECTED");
        String promMsg = !prometheusEnabled ? "Integration disabled" : (promAvailable ? null : prometheusService.getLastError());
        integrations.add(new IntegrationHealthResponse.IntegrationStatus("PROMETHEUS", prometheusEnabled, promStatus, promMsg, checkedAt));

        integrations.add(new IntegrationHealthResponse.IntegrationStatus("LOKI", lokiEnabled, 
            lokiEnabled ? "DISCONNECTED" : "DISABLED", 
            lokiEnabled ? "Loki client is not connected" : "Integration disabled", checkedAt));

        // Calculate overall status
        String overallStatus;
        if (!dbHealthy) {
            overallStatus = "CRITICAL";
        } else {
            boolean hasOptionalErrors = integrations.stream()
                .anyMatch(i -> i.enabled() && !"CONNECTED".equals(i.status()));
            overallStatus = hasOptionalErrors ? "OPERATIONAL_WITH_WARNINGS" : "OPERATIONAL";
        }

        return new IntegrationHealthResponse(overallStatus, integrations);
    }
}