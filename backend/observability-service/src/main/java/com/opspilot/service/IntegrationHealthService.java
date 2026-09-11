package com.opspilot.service;

import com.opspilot.dto.IntegrationHealthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class IntegrationHealthService {
    private final PrometheusService prometheusService;
        private final KubernetesMonitoringService kubernetesMonitoringService;
    private final boolean prometheusEnabled;
    private final boolean kubernetesEnabled;
    private final boolean lokiEnabled;

        public IntegrationHealthService(PrometheusService prometheusService,
                                                                        KubernetesMonitoringService kubernetesMonitoringService,
                                    @Value("${monitoring.prometheus.enabled:true}") boolean prometheusEnabled,
                                    @Value("${monitoring.kubernetes.enabled:true}") boolean kubernetesEnabled,
                                    @Value("${monitoring.loki.enabled:false}") boolean lokiEnabled) {
        this.prometheusService = prometheusService;
        this.kubernetesMonitoringService = kubernetesMonitoringService;
        this.prometheusEnabled = prometheusEnabled;
        this.kubernetesEnabled = kubernetesEnabled;
        this.lokiEnabled = lokiEnabled;
    }

    public IntegrationHealthResponse getHealth() {
        Instant checkedAt = Instant.now();
        boolean prometheusAvailable = prometheusService.isAvailable();
        boolean kubernetesAvailable = kubernetesEnabled && kubernetesMonitoringService.isAvailable();
        return new IntegrationHealthResponse(List.of(
            new IntegrationHealthResponse.IntegrationStatus("Kubernetes", kubernetesEnabled, kubernetesAvailable,
                kubernetesAvailable ? "CONNECTED" : "UNAVAILABLE",
                kubernetesAvailable ? null : "Kubernetes API unavailable", checkedAt),
                new IntegrationHealthResponse.IntegrationStatus("Prometheus", prometheusEnabled, prometheusAvailable,
                        prometheusAvailable ? "CONNECTED" : "UNAVAILABLE", prometheusAvailable ? null : prometheusService.getLastError(), checkedAt),
                new IntegrationHealthResponse.IntegrationStatus("Loki", lokiEnabled, false,
                        lokiEnabled ? "UNAVAILABLE" : "DISABLED", lokiEnabled ? "Loki client is not connected" : null, checkedAt)
        ));
    }
}