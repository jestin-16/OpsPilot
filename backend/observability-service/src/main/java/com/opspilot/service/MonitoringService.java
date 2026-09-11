package com.opspilot.service;

import com.opspilot.dto.MetricsResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.OptionalDouble;

@Service
public class MonitoringService {

    @Autowired
    private PrometheusService prometheusService;

    public MetricsResponse getSystemMetrics(String providerName) {
        if (!"prometheus".equalsIgnoreCase(providerName)) {
            return unavailable("Metrics source is not configured; select Prometheus");
        }

        OptionalDouble cpu = prometheusService.query("100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)");
        OptionalDouble memoryUsed = prometheusService.query("sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024");
        OptionalDouble memoryTotal = prometheusService.query("sum(node_memory_MemTotal_bytes) / 1024 / 1024");
        OptionalDouble requests = prometheusService.query("sum(http_server_requests_active_seconds_count)");
        OptionalDouble deployments = prometheusService.query("count(kube_deployment_metadata)");

        if (cpu.isEmpty() && memoryUsed.isEmpty() && memoryTotal.isEmpty()) {
            return unavailable(prometheusService.getLastError());
        }

        return withMetadata(new MetricsResponse(
                cpu.orElse(0),
                Math.round(memoryUsed.orElse(0)),
                Math.round(memoryTotal.orElse(0)),
                (int) Math.round(requests.orElse(0)),
                (int) Math.round(deployments.orElse(0)),
                List.of()
        ), "Prometheus", "AVAILABLE", null);
    }

    private MetricsResponse unavailable(String error) {
        return withMetadata(new MetricsResponse(0, 0, 0, 0, 0, List.of()), "Prometheus", "UNAVAILABLE",
                error == null || error.isBlank() ? "Metrics source unavailable" : error);
    }

    private MetricsResponse withMetadata(MetricsResponse response, String source, String status, String error) {
        response.setSource(source);
        response.setStatus(status);
        response.setError(error);
        return response;
    }
}
