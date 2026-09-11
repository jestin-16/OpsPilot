package com.opspilot.controller;

import com.opspilot.dto.MetricsResponse;
import com.opspilot.dto.IntegrationHealthResponse;
import com.opspilot.dto.KubernetesSummaryResponse;
import com.opspilot.service.IntegrationHealthService;
import com.opspilot.service.MonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/monitoring", "/api/monitoring"})
public class MonitoringController {

    @Autowired
    private MonitoringService monitoringService;

    @Autowired
    private IntegrationHealthService integrationHealthService;

    @Autowired
    private com.opspilot.service.KubernetesMonitoringService kubernetesMonitoringService;

    @GetMapping("/metrics")
    public ResponseEntity<MetricsResponse> getMetrics(
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "local") String providerName
    ) {
        return ResponseEntity.ok(monitoringService.getSystemMetrics(providerName));
    }

    @GetMapping("/integrations")
    public ResponseEntity<IntegrationHealthResponse> getIntegrations() {
        return ResponseEntity.ok(integrationHealthService.getHealth());
    }

    @GetMapping("/cluster")
    public ResponseEntity<KubernetesSummaryResponse> getCluster() {
        return ResponseEntity.ok(kubernetesMonitoringService.getSummary());
    }

    @GetMapping("/pods")
    public ResponseEntity<KubernetesSummaryResponse> getPods() {
        return ResponseEntity.ok(kubernetesMonitoringService.getSummary());
    }
}
