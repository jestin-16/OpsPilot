package com.opspilot.service;

import com.opspilot.dto.MetricsResponse;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.OptionalDouble;

@Service
public class MonitoringService {

    @Autowired
    private PrometheusService prometheusService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DeploymentRepository deploymentRepository;


    public MetricsResponse getSystemMetrics(String providerName) {
        if ("prometheus".equalsIgnoreCase(providerName)) {
            OptionalDouble cpu = prometheusService.query("100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)");
            OptionalDouble memoryUsed = prometheusService.query("sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024");
            OptionalDouble memoryTotal = prometheusService.query("sum(node_memory_MemTotal_bytes) / 1024 / 1024");
            OptionalDouble requests = prometheusService.query("sum(http_server_requests_active_seconds_count)");
            OptionalDouble deployments = prometheusService.query("count(kube_deployment_metadata)");

            if (cpu.isPresent() || memoryUsed.isPresent() || memoryTotal.isPresent()) {
                MetricsResponse resp = new MetricsResponse(
                        cpu.orElse(0),
                        Math.round(memoryUsed.orElse(0)),
                        Math.round(memoryTotal.orElse(0)),
                        (int) Math.round(requests.orElse(0)),
                        (int) Math.round(deployments.orElse(0)),
                        List.of()
                );
                resp.setActiveProjects((int) projectRepository.count());
                return withMetadata(resp, "Prometheus", "AVAILABLE", null);
            }
        }

        // No Prometheus: report what can actually be measured here, the observability service's own JVM.
        // Request counts and history need Prometheus, so they are left empty rather than invented.
        int projectCount = (int) projectRepository.count();
        int deploymentCount = (int) deploymentRepository.count();

        Runtime runtime = Runtime.getRuntime();
        long usedMem = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
        long maxMem = runtime.maxMemory() / (1024 * 1024);
        double cpuPercent = processCpuPercent();

        MetricsResponse response = new MetricsResponse(
                cpuPercent,
                usedMem,
                maxMem,
                0,
                deploymentCount,
                List.of(new MetricsResponse.MetricPoint(
                        java.time.LocalTime.now().withNano(0).toString(), cpuPercent, usedMem, 0))
        );
        response.setActiveProjects(projectCount);
        return withMetadata(response, "OpsPilot JVM (connect Prometheus for cluster metrics)", "LIMITED", null);
    }

    /** This JVM's recent CPU load as a percentage, or 0 when the platform doesn't report it. */
    private static double processCpuPercent() {
        java.lang.management.OperatingSystemMXBean os = java.lang.management.ManagementFactory.getOperatingSystemMXBean();
        if (os instanceof com.sun.management.OperatingSystemMXBean sun) {
            double load = sun.getProcessCpuLoad();
            return load < 0 ? 0.0 : Math.round(load * 1000.0) / 10.0;
        }
        return 0.0;
    }

    private MetricsResponse withMetadata(MetricsResponse response, String source, String status, String error) {
        response.setSource(source);
        response.setStatus(status);
        response.setError(error);
        return response;
    }
}
