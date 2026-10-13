package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.ClusterHealthSummaryDto;
import com.opspilot.logwatcher.model.ParsedLogLine;
import com.opspilot.logwatcher.model.PodSummaryDto;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class HealthSummaryTest {

    private KubernetesPodWatcher podWatcher;
    private PodLogBufferManager bufferManager;
    private MetricsService metricsService;
    private ClusterHealthService healthService;

    @BeforeEach
    void setUp() {
        podWatcher = Mockito.mock(KubernetesPodWatcher.class);
        bufferManager = new PodLogBufferManager(100);
        metricsService = new MetricsService(new SimpleMeterRegistry());
        healthService = new ClusterHealthService(podWatcher, bufferManager, metricsService);
    }

    @Test
    @DisplayName("Should correctly calculate pod counts, restarts, CrashLoopBackOff, and error rates")
    void testHealthSummaryCalculation() {
        // Pod 1: Running, 0 restarts
        PodSummaryDto p1 = new PodSummaryDto(
                "django-web-1", "default", "Running", 0, "10m", "1/1",
                "10.42.0.10", "node-1", List.of("django"),
                Map.of("django", "Running"), Map.of(), "2026-10-13T12:00:00Z"
        );

        // Pod 2: CrashLoopBackOff, 5 restarts
        PodSummaryDto p2 = new PodSummaryDto(
                "django-celery-1", "default", "CrashLoopBackOff", 5, "5m", "0/1",
                "10.42.0.11", "node-1", List.of("celery"),
                Map.of("celery", "CrashLoopBackOff"), Map.of(), "2026-10-13T12:05:00Z"
        );

        // Pod 3: OOMKilled, 2 restarts
        PodSummaryDto p3 = new PodSummaryDto(
                "django-worker-1", "default", "OOMKilled", 2, "2m", "0/1",
                "10.42.0.12", "node-1", List.of("worker"),
                Map.of("worker", "OOMKilled"), Map.of(), "2026-10-13T12:08:00Z"
        );

        when(podWatcher.getAllPods()).thenReturn(List.of(p1, p2, p3));

        // Add 10 logs for Pod 1 (2 errors -> 20% error rate)
        for (int i = 0; i < 8; i++) {
            bufferManager.appendLog("default", "django-web-1", new ParsedLogLine("ts", Instant.now(), "default", "django-web-1", "django", "INFO", "Success " + i, "raw"));
        }
        for (int i = 0; i < 2; i++) {
            bufferManager.appendLog("default", "django-web-1", new ParsedLogLine("ts", Instant.now(), "default", "django-web-1", "django", "ERROR", "Exception " + i, "raw"));
        }

        ClusterHealthSummaryDto summary = healthService.getSummary(15);

        assertEquals(3, summary.getTotalPods());
        assertEquals(7, summary.getTotalRestarts()); // 0 + 5 + 2
        assertEquals(1, summary.getPodsByPhase().get("Running"));
        assertEquals(1, summary.getPodsByPhase().get("CrashLoopBackOff"));
        assertEquals(1, summary.getPodsByPhase().get("OOMKilled"));

        // CrashLoopBackOff pods list
        assertEquals(1, summary.getCrashLoopPods().size());
        assertEquals("django-celery-1", summary.getCrashLoopPods().get(0).getPodName());

        // OOMKilled pods list
        assertEquals(1, summary.getOomKilledPods().size());
        assertEquals("django-worker-1", summary.getOomKilledPods().get(0).getPodName());

        // Pod 1 error rate = 20.0%
        assertEquals(20.0, summary.getErrorRatePerPod().get("django-web-1"));
    }
}
