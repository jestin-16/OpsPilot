package com.opspilot.logwatcher.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class MetricsService {

    private final MeterRegistry meterRegistry;
    private final Map<String, AtomicInteger> podPhaseCounts = new ConcurrentHashMap<>();
    private final AtomicInteger activeStreamsCount = new AtomicInteger(0);
    private final Counter reconnectCounter;

    public MetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // Register active streams gauge
        Gauge.builder("k8s_log_watcher_active_streams", activeStreamsCount, AtomicInteger::get)
                .description("Number of currently active Kubernetes log streams")
                .register(meterRegistry);

        this.reconnectCounter = Counter.builder("k8s_log_watcher_reconnects_total")
                .description("Total number of Kubernetes watch or log stream reconnection attempts")
                .register(meterRegistry);
    }

    public void incrementLogLines(String pod, String level) {
        Counter.builder("k8s_log_lines_total")
                .tag("pod", pod != null ? pod : "unknown")
                .tag("level", level != null ? level : "INFO")
                .description("Total parsed log lines processed")
                .register(meterRegistry)
                .increment();
    }

    public void incrementReconnect() {
        reconnectCounter.increment();
    }

    public void setActiveStreams(int count) {
        activeStreamsCount.set(count);
    }

    public void updatePodPhaseCount(String phase, int count) {
        podPhaseCounts.computeIfAbsent(phase, p -> {
            AtomicInteger ai = new AtomicInteger(count);
            Gauge.builder("k8s_pods_total", ai, AtomicInteger::get)
                    .tag("phase", p)
                    .description("Current number of pods in phase")
                    .register(meterRegistry);
            return ai;
        }).set(count);
    }
}
