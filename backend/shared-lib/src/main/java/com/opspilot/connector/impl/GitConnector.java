package com.opspilot.connector.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.IntegrationConnector;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.enums.ProviderType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * GitHub repository activity (pushes, pull requests, workflow runs) as log entries. Settings: repo ("owner/name"),
 * apiBaseUrl (GitHub Enterprise), pollSeconds (live stream, default 30). Secrets: token (optional for public repos),
 * webhookSecret (used when deliveries are pushed to the ingest endpoint). GitLab is not implemented.
 */
@Component
public class GitConnector implements IntegrationConnector {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String DEFAULT_API = "https://api.github.com";

    @Override
    public ProviderType type() {
        return ProviderType.GITHUB;
    }

    @Override
    public ConnectionResult testConnection(ConnectorConfig config) {
        try {
            Api api = api(config);
            JsonNode repo = JSON.readTree(api.get("/repos/" + api.repo()));
            return ConnectionResult.success("Repository " + repo.path("full_name").asText(api.repo())
                    + (repo.path("private").asBoolean() ? " (private)" : " (public)") + " reachable");
        } catch (Exception e) {
            return ConnectionResult.failure(describe(e));
        }
    }

    @Override
    public List<LogEntry> fetchHistory(ConnectorConfig config, LogFilters filters, int page) {
        try {
            return collect(config, api(config), filters, Math.max(page, 0) + 1).stream()
                    .sorted(Comparator.comparing(LogEntry::getTimestamp).reversed())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new IllegalStateException(describe(e));
        }
    }

    @Override
    public Flux<LogEntry> streamLogs(ConnectorConfig config, LogFilters filters) {
        Api api;
        try {
            api = api(config);
        } catch (Exception e) {
            return Flux.error(new IllegalStateException(describe(e)));
        }
        long poll = parseLong(config.setting("pollSeconds"), 30);
        final Api client = api;
        return Flux.defer(() -> {
            Set<String> seen = new HashSet<>();
            boolean[] primed = {false};
            return Flux.interval(Duration.ZERO, Duration.ofSeconds(Math.max(poll, 5)))
                    .concatMap(tick -> Flux.fromIterable(pollOnce(config, client, filters, seen, primed)));
        });
    }

    private List<LogEntry> pollOnce(ConnectorConfig config, Api api, LogFilters filters, Set<String> seen, boolean[] primed) {
        try {
            List<LogEntry> fresh = new ArrayList<>();
            for (LogEntry e : collect(config, api, LogFilters.none().pageSize(30), 1)) {
                if (seen.add(e.getId()) && primed[0] && filters.matches(e)) fresh.add(e);
            }
            primed[0] = true; // first poll only records what already exists
            fresh.sort(Comparator.comparing(LogEntry::getTimestamp));
            return fresh;
        } catch (Exception ex) {
            throw new IllegalStateException(describe(ex));
        }
    }

    private List<LogEntry> collect(ConnectorConfig config, Api api, LogFilters filters, int page) throws IOException {
        List<LogEntry> out = new ArrayList<>();
        String paging = "?per_page=" + filters.getPageSize() + "&page=" + page;
        for (JsonNode ev : JSON.readTree(api.get("/repos/" + api.repo() + "/events" + paging))) {
            GitHubEventMapper.fromRestEvent(ev, api.repo(), ProviderType.GITHUB).ifPresent(out::add);
        }
        for (JsonNode run : JSON.readTree(api.get("/repos/" + api.repo() + "/actions/runs" + paging)).path("workflow_runs")) {
            out.add(GitHubEventMapper.workflowRun(api.repo(), run, ProviderType.GITHUB));
        }
        out.forEach(e -> e.owned(config.projectId(), config.integrationId()));
        return out.stream().filter(filters::matches).collect(Collectors.toList());
    }

    private Api api(ConnectorConfig config) {
        String repo = config.setting("repo");
        if (repo == null || !repo.matches("[\\w.-]+/[\\w.-]+")) {
            throw new IllegalArgumentException("Repository must look like owner/name");
        }
        URI base = ConnectorHttp.validate(config.setting("apiBaseUrl", DEFAULT_API));
        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("Accept", "application/vnd.github+json");
        headers.put("X-GitHub-Api-Version", "2022-11-28");
        headers.put("User-Agent", "OpsPilot");
        if (config.secret("token") != null) {
            headers.put("Authorization", "Bearer " + config.secret("token"));
        }
        return new Api(ConnectorHttp.client(false, null), base, headers, repo);
    }

    private static String describe(Exception e) {
        if (e instanceof ConnectorHttp.HttpStatusException h) {
            if (h.status() == 404) return "Repository not found, or the token cannot see it";
            if (h.status() == 401) return "GitHub rejected the token";
            if (h.status() == 403) return "GitHub denied access or the rate limit is exhausted";
            return h.getMessage();
        }
        if (e instanceof IllegalArgumentException || e instanceof IllegalStateException) {
            return e.getMessage();
        }
        return "Cannot reach GitHub: " + e.getClass().getSimpleName();
    }

    private static long parseLong(String v, long fallback) {
        try {
            return v == null ? fallback : Long.parseLong(v);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private record Api(HttpClient client, URI base, Map<String, String> headers, String repo) {
        String get(String path) throws IOException {
            return ConnectorHttp.get(client, URI.create(base.toString().replaceAll("/+$", "") + path), headers);
        }
    }
}
