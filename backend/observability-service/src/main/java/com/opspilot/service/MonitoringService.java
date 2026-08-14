package com.opspilot.service;

import com.opspilot.dto.MetricsResponse;
import com.opspilot.repository.DeploymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class MonitoringService {

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired(required = false)
    private List<com.opspilot.provider.MetricsProvider> metricsProviders;

    public MetricsResponse getSystemMetrics(String providerName) {
        if (providerName != null && !providerName.equalsIgnoreCase("local") && metricsProviders != null) {
            for (com.opspilot.provider.MetricsProvider provider : metricsProviders) {
                if (provider.getProviderName().equalsIgnoreCase(providerName)) {
                    // For now, since fetchMetrics returns Object, we could cast it or map it.
                    // Assuming the provider handles formatting for now or we just fallback.
                }
            }
        }

        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory() / (1024 * 1024);
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);
        long usedMemory = totalMemory - freeMemory;

        double cpuLoad = 15.4 + (Math.random() * 12.0); // Simulated actuator CPU load
        int totalDeployments = (int) deploymentRepository.count();

        List<MetricsResponse.MetricPoint> history = new ArrayList<>();
        LocalTime now = LocalTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");

        for (int i = 5; i >= 0; i--) {
            String timeStr = now.minusSeconds(i * 10).format(formatter);
            double sampleCpu = Math.round((cpuLoad + (Math.random() * 8.0 - 4.0)) * 10.0) / 10.0;
            long sampleMemory = usedMemory + (long)(Math.random() * 20 - 10);
            int sampleReq = 45 + (int)(Math.random() * 30);
            history.add(new MetricsResponse.MetricPoint(timeStr, sampleCpu, sampleMemory, sampleReq));
        }

        return new MetricsResponse(
                Math.round(cpuLoad * 10.0) / 10.0,
                usedMemory,
                maxMemory > 0 ? maxMemory : 1024,
                48,
                totalDeployments,
                history
        );
    }
}
