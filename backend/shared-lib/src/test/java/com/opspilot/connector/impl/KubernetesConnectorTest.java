package com.opspilot.connector.impl;

import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.FakeServer;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.enums.ProviderType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class KubernetesConnectorTest {

    private static final String PODS = "{\"items\":["
            + "{\"metadata\":{\"name\":\"api-1\"},\"status\":{\"phase\":\"Running\"},\"spec\":{\"containers\":[{\"name\":\"app\"},{\"name\":\"sidecar\"}]}},"
            + "{\"metadata\":{\"name\":\"job-1\"},\"status\":{\"phase\":\"Pending\"},\"spec\":{\"containers\":[{\"name\":\"main\"}]}}]}";

    private final KubernetesConnector connector = new KubernetesConnector();
    private FakeServer server;

    @BeforeEach
    void start() throws Exception {
        server = new FakeServer()
                .json("/version", "{\"gitVersion\":\"v1.30.1\"}")
                .json("/api/v1/namespaces", "{\"items\":[{\"metadata\":{\"name\":\"default\"}},{\"metadata\":{\"name\":\"prod\"}}]}")
                .json("/api/v1/namespaces/default/pods", PODS)
                .text("/api/v1/namespaces/default/pods/api-1/log",
                        "2024-05-01T10:00:00Z listening on :8080\n2024-05-01T10:00:05Z ERROR upstream timed out\n");
    }

    @AfterEach
    void stop() {
        server.close();
    }

    private ConnectorConfig config(Map<String, Object> extra, Map<String, String> secrets) {
        Map<String, Object> settings = new HashMap<>(extra);
        settings.put("apiServer", server.url());
        return new ConnectorConfig(2L, 9L, ProviderType.KUBERNETES, "cluster", settings, secrets);
    }

    private ConnectorConfig config() {
        return config(Map.of(), Map.of("token", "s3cr3t-token"));
    }

    @Test
    void testConnectionSendsBearerTokenAndReportsPods() {
        ConnectionResult r = connector.testConnection(config());
        assertTrue(r.ok(), r.message());
        assertTrue(r.message().contains("v1.30.1"));
        assertTrue(server.authHeaders.stream().allMatch(h -> h.equals("Bearer s3cr3t-token")));
    }

    @Test
    void rejectedTokenGivesActionableMessageWithoutLeakingAnything() {
        server.status("/version", 401);
        ConnectionResult r = connector.testConnection(config());
        assertFalse(r.ok());
        assertTrue(r.message().contains("RBAC"));
        assertFalse(r.message().contains("s3cr3t-token"));
        assertFalse(r.message().contains("secret-in-body"));
    }

    @Test
    void missingTokenIsReported() {
        ConnectionResult r = connector.testConnection(config(Map.of(), Map.of()));
        assertFalse(r.ok());
        assertTrue(r.message().toLowerCase().contains("token"));
    }

    @Test
    void discoversNamespacesAndRunnablePodContainers() {
        assertEquals(2, connector.discoverResources(config(), "namespaces").size());
        List<Map<String, Object>> pods = connector.discoverResources(config(), "pods");
        assertEquals(2, pods.size()); // api-1 has two containers; Pending pods are skipped
        assertEquals("api-1", pods.get(0).get("name"));
    }

    @Test
    void historyParsesTimestampsLevelsAndPodMetadata() {
        List<LogEntry> entries = connector.fetchHistory(config(Map.of("podName", "api-1", "container", "app"), Map.of("token", "t")),
                LogFilters.none(), 0);
        assertEquals(2, entries.size());
        assertEquals("ERROR", entries.get(0).getLevel());
        assertEquals("upstream timed out".length() > 0, entries.get(0).getMessage().contains("upstream timed out"));
        assertEquals("api-1", entries.get(0).getMetadata().get("pod"));
        assertEquals("default", entries.get(0).getMetadata().get("namespace"));
        assertEquals(ProviderType.KUBERNETES, entries.get(0).getSourceType());
    }

    @Test
    void streamFollowsEveryContainerOfRunningPods() {
        List<LogEntry> got = connector.streamLogs(config(Map.of("podName", "api-1", "container", "app"), Map.of("token", "t")), LogFilters.none())
                .collectList().block(Duration.ofSeconds(10));
        assertNotNull(got);
        assertEquals(2, got.size());
        assertTrue(server.requests.stream().anyMatch(r -> r.contains("follow=true")));
    }

    @Test
    void streamErrorsForBadConfig() {
        assertThrows(IllegalStateException.class, () ->
                connector.streamLogs(new ConnectorConfig(1L, 1L, ProviderType.KUBERNETES, "x", Map.of(), Map.of()), LogFilters.none())
                        .blockLast(Duration.ofSeconds(2)));
    }
}
