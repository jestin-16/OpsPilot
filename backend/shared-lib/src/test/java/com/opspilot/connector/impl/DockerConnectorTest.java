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

import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class DockerConnectorTest {

    private final DockerConnector connector = new DockerConnector();
    private FakeServer server;

    @BeforeEach
    void start() throws Exception {
        ByteArrayOutputStream logs = new ByteArrayOutputStream();
        logs.writeBytes(DockerLogDecoderTest.frame(1, "2024-05-01T10:00:00.000000000Z server started\n"));
        logs.writeBytes(DockerLogDecoderTest.frame(2, "2024-05-01T10:00:01.000000000Z ERROR database unreachable\n"));
        logs.writeBytes(DockerLogDecoderTest.frame(1, "2024-05-01T10:00:02.000000000Z WARNING slow query\n"));
        server = new FakeServer()
                .text("/_ping", "OK")
                .json("/version", "{\"Version\":\"26.1.0\"}")
                .json("/containers/json", "[{\"Id\":\"abc123abc123abc123\",\"Names\":[\"/web\"],\"Image\":\"nginx\",\"State\":\"running\"},"
                        + "{\"Id\":\"def456def456def456\",\"Names\":[\"/db\"],\"Image\":\"postgres\",\"State\":\"running\"}]")
                .json("/containers/abc123abc123abc123/json", "{\"Config\":{\"Tty\":false}}")
                .json("/containers/def456def456def456/json", "{\"Config\":{\"Tty\":false}}")
                .bytes("/containers/abc123abc123abc123/logs", logs.toByteArray())
                .bytes("/containers/def456def456def456/logs", new byte[0]);
    }

    @AfterEach
    void stop() {
        server.close();
    }

    private ConnectorConfig config(Map<String, Object> extra) {
        Map<String, Object> settings = new java.util.HashMap<>(extra);
        settings.put("host", server.url());
        return new ConnectorConfig(1L, 7L, ProviderType.DOCKER, "local", settings, Map.of());
    }

    @Test
    void testConnectionReportsVersionAndRunningContainers() {
        ConnectionResult r = connector.testConnection(config(Map.of()));
        assertTrue(r.ok(), r.message());
        assertTrue(r.message().contains("26.1.0"));
        assertTrue(r.message().contains("2 running"));
    }

    @Test
    void testConnectionFailsCleanlyWhenUnreachable() {
        server.close();
        ConnectionResult r = connector.testConnection(config(Map.of()));
        assertFalse(r.ok());
    }

    @Test
    void unixSocketsAreRejectedWithGuidance() {
        ConnectionResult r = connector.testConnection(new ConnectorConfig(1L, 7L, ProviderType.DOCKER, "x",
                Map.of("host", "unix:///var/run/docker.sock"), Map.of()));
        assertFalse(r.ok());
        assertTrue(r.message().contains("TCP"));
    }

    @Test
    void discoversContainers() {
        List<Map<String, Object>> found = connector.discoverResources(config(Map.of()), "containers");
        assertEquals(2, found.size());
        assertEquals("web", found.get(0).get("name"));
    }

    @Test
    void historyIsNewestFirstWithDetectedLevelsAndMetadata() {
        List<LogEntry> entries = connector.fetchHistory(config(Map.of("containers", "web")), LogFilters.none(), 0);
        assertEquals(3, entries.size());
        assertEquals("WARN", entries.get(0).getLevel());
        assertEquals("ERROR", entries.get(1).getLevel());
        assertEquals("web", entries.get(0).getMetadata().get("container"));
        assertEquals("stderr", entries.get(1).getMetadata().get("stream"));
        assertEquals(ProviderType.DOCKER, entries.get(0).getSourceType());
        assertEquals(7L, entries.get(0).getIntegrationId());
        assertEquals(1L, entries.get(0).getProjectId());
    }

    @Test
    void historyAppliesLevelAndTextFilters() {
        assertEquals(1, connector.fetchHistory(config(Map.of()), LogFilters.none().level("ERROR"), 0).size());
        assertEquals(1, connector.fetchHistory(config(Map.of()), LogFilters.none().query("SLOW"), 0).size());
    }

    @Test
    void historyPaginates() {
        LogFilters f = LogFilters.none().pageSize(2);
        assertEquals(2, connector.fetchHistory(config(Map.of()), f, 0).size());
        assertEquals(1, connector.fetchHistory(config(Map.of()), f, 1).size());
    }

    @Test
    void containerSelectorNarrowsTheSource() {
        LogFilters f = LogFilters.none().selector("container", "db");
        assertTrue(connector.fetchHistory(config(Map.of()), f, 0).isEmpty());
    }

    @Test
    void streamEmitsFramesAndCompletesWhenTheContainerStops() {
        List<LogEntry> got = connector.streamLogs(config(Map.of("containers", "web")), LogFilters.none())
                .collectList().block(Duration.ofSeconds(10));
        assertNotNull(got);
        assertEquals(3, got.size());
        assertTrue(server.requests.stream().anyMatch(r -> r.contains("follow=1")));
    }

    @Test
    void streamErrorsInsteadOfThrowingForBadConfig() {
        assertThrows(IllegalStateException.class, () ->
                connector.streamLogs(new ConnectorConfig(1L, 1L, ProviderType.DOCKER, "x", Map.of(), Map.of()), LogFilters.none())
                        .blockLast(Duration.ofSeconds(2)));
    }
}
