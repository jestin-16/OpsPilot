package com.opspilot.connector.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.FakeServer;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.enums.ProviderType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class GitAndCicdConnectorTest {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String EVENTS = "[{\"id\":\"11\",\"type\":\"PushEvent\",\"actor\":{\"login\":\"ana\"},\"created_at\":\"2024-05-01T10:00:00Z\","
            + "\"payload\":{\"ref\":\"refs/heads/main\",\"size\":2,\"head\":\"abcdef1234\",\"commits\":[{\"message\":\"fix login\\n\\nlong body\"}]}},"
            + "{\"id\":\"12\",\"type\":\"WatchEvent\",\"actor\":{\"login\":\"bob\"},\"created_at\":\"2024-05-01T10:01:00Z\",\"payload\":{}},"
            + "{\"id\":\"13\",\"type\":\"PullRequestEvent\",\"actor\":{\"login\":\"cy\"},\"created_at\":\"2024-05-01T10:02:00Z\","
            + "\"payload\":{\"action\":\"opened\",\"pull_request\":{\"number\":5,\"title\":\"Add cache\",\"html_url\":\"http://x/5\"}}}]";
    private static final String RUNS = "{\"total_count\":2,\"workflow_runs\":["
            + "{\"id\":900,\"name\":\"CI\",\"run_number\":42,\"head_branch\":\"main\",\"status\":\"completed\",\"conclusion\":\"failure\","
            + "\"updated_at\":\"2024-05-01T10:05:00Z\",\"html_url\":\"http://x/r\",\"actor\":{\"login\":\"ana\"}},"
            + "{\"id\":901,\"name\":\"CI\",\"run_number\":43,\"head_branch\":\"dev\",\"status\":\"in_progress\",\"conclusion\":null,"
            + "\"updated_at\":\"2024-05-01T10:06:00Z\",\"html_url\":\"http://x/r2\",\"actor\":{\"login\":\"ana\"}}]}";

    private FakeServer server;
    private final GitConnector git = new GitConnector();
    private final CicdConnector cicd = new CicdConnector();

    @BeforeEach
    void start() throws Exception {
        server = new FakeServer()
                .json("/repos/acme/shop", "{\"full_name\":\"acme/shop\",\"private\":true}")
                .json("/repos/acme/shop/events", EVENTS)
                .json("/repos/acme/shop/actions/runs", RUNS)
                .json("/repos/acme/shop/actions/runs/900/jobs", "{\"jobs\":[{\"id\":5,\"name\":\"build\",\"status\":\"completed\",\"conclusion\":\"failure\","
                        + "\"completed_at\":\"2024-05-01T10:04:00Z\",\"steps\":[{\"name\":\"Run tests\",\"number\":2,\"status\":\"completed\","
                        + "\"conclusion\":\"failure\",\"completed_at\":\"2024-05-01T10:03:00Z\"}]}]}")
                .json("/job/deploy/api/json", "{\"name\":\"deploy\",\"lastBuild\":{\"number\":8},"
                        + "\"builds\":[{\"number\":8,\"result\":\"FAILURE\",\"building\":false,\"timestamp\":1714557600000,\"duration\":65000,\"url\":\"http://j/8\"},"
                        + "{\"number\":7,\"result\":\"SUCCESS\",\"building\":false,\"timestamp\":1714550000000,\"duration\":30000,\"url\":\"http://j/7\"}]}")
                .text("/job/deploy/8/consoleText", "Started by user\nERROR: compilation failed\nFinished: FAILURE\n");
    }

    @AfterEach
    void stop() {
        server.close();
    }

    private ConnectorConfig gitConfig(Map<String, Object> extra) {
        Map<String, Object> s = new java.util.HashMap<>(extra);
        s.put("repo", "acme/shop");
        s.put("apiBaseUrl", server.url());
        return new ConnectorConfig(1L, 3L, ProviderType.GITHUB, "repo", s, Map.of("token", "ghp_secret"));
    }

    private ConnectorConfig ghActions() {
        return new ConnectorConfig(1L, 4L, ProviderType.CICD, "ci",
                Map.of("provider", "GITHUB_ACTIONS", "repo", "acme/shop", "apiBaseUrl", server.url()), Map.of("token", "ghp_secret"));
    }

    private ConnectorConfig jenkins() {
        return new ConnectorConfig(1L, 5L, ProviderType.CICD, "jenkins",
                Map.of("provider", "JENKINS", "baseUrl", server.url(), "job", "deploy"), Map.of("username", "u", "apiToken", "t"));
    }

    @Test
    void gitTestConnection() {
        ConnectionResult r = git.testConnection(gitConfig(Map.of()));
        assertTrue(r.ok(), r.message());
        assertTrue(r.message().contains("private"));
        assertEquals("Bearer ghp_secret", server.authHeaders.get(0));
    }

    @Test
    void gitRejectsMalformedRepo() {
        ConnectionResult r = git.testConnection(new ConnectorConfig(1L, 1L, ProviderType.GITHUB, "x", Map.of("repo", "not a repo"), Map.of()));
        assertFalse(r.ok());
    }

    @Test
    void gitHistoryMapsPushPullRequestAndWorkflowRunsAndSkipsNoise() {
        List<LogEntry> entries = git.fetchHistory(gitConfig(Map.of()), LogFilters.none(), 0);
        assertEquals(4, entries.size()); // push, PR, 2 runs; WatchEvent skipped
        LogEntry failed = entries.stream().filter(e -> "failure".equals(e.getMetadata().get("conclusion"))).findFirst().orElseThrow();
        assertEquals("ERROR", failed.getLevel());
        LogEntry push = entries.stream().filter(e -> "push".equals(e.getMetadata().get("event"))).findFirst().orElseThrow();
        assertEquals("ana pushed 2 commit(s) to main: fix login", push.getMessage());
        assertEquals("abcdef1", push.getMetadata().get("sha"));
        assertTrue(entries.get(0).getTimestamp().isAfter(entries.get(entries.size() - 1).getTimestamp()));
    }

    @Test
    void gitAccessDeniedIsReadable() {
        server.status("/repos/acme/shop", 404);
        ConnectionResult r = git.testConnection(gitConfig(Map.of()));
        assertFalse(r.ok());
        assertFalse(r.message().contains("ghp_secret"));
    }

    @Test
    void webhookPayloadsMapToEntries() throws Exception {
        Optional<LogEntry> e = GitHubEventMapper.fromWebhook("workflow_run", JSON.readTree(
                "{\"repository\":{\"full_name\":\"acme/shop\"},\"workflow_run\":{\"id\":1,\"name\":\"CI\",\"run_number\":3,"
                        + "\"head_branch\":\"main\",\"status\":\"completed\",\"conclusion\":\"cancelled\",\"updated_at\":\"2024-05-01T10:00:00Z\"}}"),
                ProviderType.GITHUB);
        assertTrue(e.isPresent());
        assertEquals("WARN", e.get().getLevel());
        assertTrue(GitHubEventMapper.fromWebhook("star", JSON.readTree("{}"), ProviderType.GITHUB).isEmpty());
    }

    @Test
    void githubActionsRunsAndJobSteps() {
        List<LogEntry> runs = cicd.fetchHistory(ghActions(), LogFilters.none(), 0);
        assertEquals(2, runs.size());
        assertEquals(ProviderType.CICD, runs.get(0).getSourceType());
        List<LogEntry> jobs = cicd.fetchHistory(ghActions(), LogFilters.none().selector("run", "900"), 0);
        assertEquals(2, jobs.size());
        assertTrue(jobs.stream().anyMatch(e -> e.getMessage().contains("Run tests") && e.getLevel().equals("ERROR")));
    }

    @Test
    void jenkinsTestBuildsAndConsole() {
        ConnectionResult r = cicd.testConnection(jenkins());
        assertTrue(r.ok(), r.message());
        assertTrue(r.message().contains("#8"));

        List<LogEntry> builds = cicd.fetchHistory(jenkins(), LogFilters.none(), 0);
        assertEquals(2, builds.size());
        assertEquals("ERROR", builds.get(0).getLevel());
        assertEquals("Build #8 FAILURE in 65s", builds.get(0).getMessage());

        List<LogEntry> console = cicd.fetchHistory(jenkins(), LogFilters.none().selector("build", "8"), 0);
        assertEquals(3, console.size());
        assertTrue(console.stream().anyMatch(e -> e.getLevel().equals("ERROR")));
    }

    @Test
    void cicdValidatesProvider() {
        ConnectionResult r = cicd.testConnection(new ConnectorConfig(1L, 1L, ProviderType.CICD, "x", Map.of("provider", "TRAVIS"), Map.of()));
        assertFalse(r.ok());
    }
}
