package com.opspilot.service;

import io.kubernetes.client.custom.Quantity;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class KubernetesServiceTest {

    @Test
    void testQuantityParsing() {
        Quantity cpu = Quantity.fromString("250m");
        assertNotNull(cpu);
        assertEquals(new BigDecimal("0.250"), cpu.getNumber());

        Quantity mem = Quantity.fromString("128Mi");
        assertNotNull(mem);
        assertEquals(128L * 1024L * 1024L, mem.getNumber().longValue());
    }

    @Test
    void testDisconnectedClusterReturnsEmpty() {
        KubernetesService service = new KubernetesService();
        assertTrue(service.getAllPods().isEmpty());
        assertTrue(service.getEnhancedPods().isEmpty());
        assertEquals("Disconnected", service.getClusterOverview().get("status"));
    }

    @Test
    void testExtractPodMetricsSingleContainer() {
        KubernetesService service = new KubernetesService();
        Map<String, Object> item = Map.of(
            "metadata", Map.of("name", "payment-pod", "namespace", "prod"),
            "containers", List.of(
                Map.of(
                    "name", "payment-app",
                    "usage", Map.of("cpu", "150m", "memory", "256Mi")
                )
            )
        );

        String[] metrics = service.extractPodMetricsFromItem(item);
        assertNotNull(metrics);
        assertEquals("150m", metrics[0]);
        assertEquals("256Mi", metrics[1]);
    }

    @Test
    void testExtractPodMetricsMultipleContainersAggregated() {
        KubernetesService service = new KubernetesService();
        Map<String, Object> item = Map.of(
            "metadata", Map.of("name", "gateway-pod", "namespace", "prod"),
            "containers", List.of(
                Map.of("name", "proxy", "usage", Map.of("cpu", "50m", "memory", "64Mi")),
                Map.of("name", "sidecar", "usage", Map.of("cpu", "100m", "memory", "192Mi"))
            )
        );

        String[] metrics = service.extractPodMetricsFromItem(item);
        assertNotNull(metrics);
        assertEquals("150m", metrics[0]);
        assertEquals("256Mi", metrics[1]);
    }

    @Test
    void testParsePodMetricsList() {
        KubernetesService service = new KubernetesService();
        Map<String, Object> raw = Map.of(
            "kind", "PodMetricsList",
            "items", List.of(
                Map.of(
                    "metadata", Map.of("name", "pod-1", "namespace", "default"),
                    "containers", List.of(
                        Map.of("name", "app", "usage", Map.of("cpu", "200m", "memory", "512Mi"))
                    )
                ),
                Map.of(
                    "metadata", Map.of("name", "pod-2", "namespace", "kube-system"),
                    "containers", List.of(
                        Map.of("name", "agent", "usage", Map.of("cpu", "1000m", "memory", "1073741824"))
                    )
                )
            )
        );

        Map<String, String[]> result = service.parsePodMetricsList(raw);
        assertEquals(2, result.size());

        assertArrayEquals(new String[]{"200m", "512Mi"}, result.get("default/pod-1"));
        assertArrayEquals(new String[]{"1000m", "1.0Gi"}, result.get("kube-system/pod-2"));
    }

    @Test
    void testInvalidMetricsReturnsEmpty() {
        KubernetesService service = new KubernetesService();
        assertTrue(service.parsePodMetricsList(null).isEmpty());
        assertTrue(service.parsePodMetricsList(Map.of()).isEmpty());
        assertNull(service.extractPodMetricsFromItem(Map.of()));
    }
}
