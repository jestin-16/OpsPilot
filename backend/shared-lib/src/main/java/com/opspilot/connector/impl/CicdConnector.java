package com.opspilot.connector.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.IntegrationConnector;
import com.opspilot.connector.Levels;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.enums.ProviderType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CI/CD pipeline activity. Settings: provider = GITHUB_ACTIONS | JENKINS, pollSeconds.
 * GitHub Actions: repo, apiBaseUrl; secret token. Entries are workflow runs (status transitions); the filter selector
 * "run" returns the jobs and steps of one run.
 * Jenkins: baseUrl, job; secrets username, apiToken. Entries are builds; the selector "build" returns that build's
 * console output. The live stream reports build state changes (console is fetched on demand).
 */
@Component
public class CicdConnector implements IntegrationConnector {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String DEFAULT_GITHUB_API = "https://api.github.com";

    @Override
    public ProviderType type() {
        return ProviderType.CICD;
    }

    @Override
    public ConnectionResult testConnection(ConnectorConfig config) {
        try {
            Api api = api(config);
            if (api.jenkins()) {
                JsonNode job = JSON.readTree(api.get("/job/" + enc(api.job()) + "/api/json?tree=" + enc("name,lastBuild[number]")));
                return ConnectionResult.success("Jenkins job '" + job.path("name").asText(api.job()) + "' reachable, last build #"
                        + job.path("lastBuild").path("number").asText("none"));
            }
            JsonNode runs = JSON.readTree(api.get("/repos/" + api.repo() + "/actions/runs?per_page=1"));
            return ConnectionResult.success("GitHub Actions reachable, " + runs.path("total_count").asInt() + " workflow run(s) in " + api.repo());
        } catch (Exception e) {
            return ConnectionResult.failure(describe(e));
        }
    }

    @Override
    public List<LogEntry> fetchHistory(ConnectorConfig config, LogFilters filters, int page) {
        try {
            return fetch(config, api(config), filters, Math.max(page, 0) + 1).stream()
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
        long poll = 30;
        try {
            poll = Long.parseLong(config.setting("pollSeconds", "30"));
        } catch (NumberFormatException ignored) {
            // keep default
        }
        final Api client = api;
        final long every = Math.max(poll, 5);
        return Flux.defer(() -> {
            Set<String> seen = new HashSet<>();
            boolean[] primed = {false};
            return Flux.interval(Duration.ZERO, Duration.ofSeconds(every)).concatMap(tick -> {
                try {
                    List<LogEntry> fresh = new ArrayList<>();
                    for (LogEntry e : fetch(config, client, LogFilters.none().pageSize(30), 1)) {
                        if (seen.add(e.getId()) && primed[0] && filters.matches(e)) fresh.add(e);
                    }
                    primed[0] = true;
                    fresh.sort(Comparator.comparing(LogEntry::getTimestamp));
                    return Flux.fromIterable(fresh);
                } catch (Exception ex) {
                    return Flux.<LogEntry>error(new IllegalStateException(describe(ex)));
                }
            });
        });
    }

    // ---- fetching ----

    private List<LogEntry> fetch(ConnectorConfig config, Api api, LogFilters filters, int page) throws IOException {
        List<LogEntry> out = api.jenkins() ? jenkins(api, filters) : github(api, filters, page);
        out.forEach(e -> e.owned(config.projectId(), config.integrationId()));
        return out.stream().filter(filters::matches).collect(Collectors.toList());
    }

    private List<LogEntry> github(Api api, LogFilters filters, int page) throws IOException {
        List<LogEntry> out = new ArrayList<>();
        String run = filters.selector("run");
        if (run != null) {
            for (JsonNode job : JSON.readTree(api.get("/repos/" + api.repo() + "/actions/runs/" + enc(run) + "/jobs")).path("jobs")) {
                out.add(jobEntry(api.repo(), run, job, null));
                for (JsonNode step : job.path("steps")) {
                    out.add(jobEntry(api.repo(), run, job, step));
                }
            }
            return out;
        }
        String paging = "?per_page=" + filters.getPageSize() + "&page=" + page;
        for (JsonNode r : JSON.readTree(api.get("/repos/" + api.repo() + "/actions/runs" + paging)).path("workflow_runs")) {
            LogEntry e = GitHubEventMapper.workflowRun(api.repo(), r, ProviderType.CICD);
            e.getMetadata().put("runId", r.path("id").asText());
            out.add(e);
        }
        return out;
    }

    private LogEntry jobEntry(String repo, String run, JsonNode job, JsonNode step) {
        JsonNode n = step != null ? step : job;
        String conclusion = n.path("conclusion").asText("");
        String status = n.path("status").asText("");
        String level = switch (conclusion) {
            case "failure", "timed_out" -> "ERROR";
            case "cancelled" -> "WARN";
            default -> "INFO";
        };
        Map<String, String> meta = new LinkedHashMap<>();
        meta.put("repo", repo);
        meta.put("runId", run);
        meta.put("job", job.path("name").asText());
        if (step != null) meta.put("step", step.path("name").asText());
        String text = (step != null ? "Step \"" + step.path("name").asText() + "\"" : "Job \"" + job.path("name").asText() + "\"")
                + " " + (conclusion.isEmpty() ? status : conclusion);
        String when = n.path("completed_at").asText(n.path("started_at").asText(null));
        LogEntry e = LogEntry.of(ProviderType.CICD, level, text, when == null || when.equals("null") ? Instant.now() : Instant.parse(when), meta);
        e.setId("job-" + job.path("id").asText() + (step != null ? "-" + step.path("number").asText() : "") + "-" + status + "-" + conclusion);
        return e;
    }

    private List<LogEntry> jenkins(Api api, LogFilters filters) throws IOException {
        List<LogEntry> out = new ArrayList<>();
        String build = filters.selector("build");
        if (build != null) {
            String text = api.get("/job/" + enc(api.job()) + "/" + enc(build) + "/consoleText");
            Instant now = Instant.now();
            int i = 0;
            for (String line : text.split("\\R")) {
                Map<String, String> meta = new LinkedHashMap<>();
                meta.put("job", api.job());
                meta.put("build", build);
                LogEntry e = LogEntry.of(ProviderType.CICD, Levels.detect(line), line, now.plusNanos(i++), meta);
                e.setId("console-" + build + "-" + i);
                out.add(e);
            }
            return out;
        }
        JsonNode builds = JSON.readTree(api.get("/job/" + enc(api.job())
                + "/api/json?tree=" + enc("builds[number,result,building,timestamp,duration,url]{0," + filters.getPageSize() + "}"))).path("builds");
        for (JsonNode b : builds) {
            String result = b.path("result").isNull() ? (b.path("building").asBoolean() ? "RUNNING" : "UNKNOWN") : b.path("result").asText();
            String level = switch (result) {
                case "FAILURE" -> "ERROR";
                case "UNSTABLE", "ABORTED" -> "WARN";
                default -> "INFO";
            };
            Map<String, String> meta = new LinkedHashMap<>();
            meta.put("job", api.job());
            meta.put("build", b.path("number").asText());
            meta.put("result", result);
            meta.put("url", b.path("url").asText());
            LogEntry e = LogEntry.of(ProviderType.CICD, level, "Build #" + b.path("number").asText() + " " + result
                    + (b.path("duration").asLong() > 0 ? " in " + b.path("duration").asLong() / 1000 + "s" : ""),
                    Instant.ofEpochMilli(b.path("timestamp").asLong(System.currentTimeMillis())), meta);
            e.setId("build-" + b.path("number").asText() + "-" + result);
            out.add(e);
        }
        return out;
    }

    // ---- plumbing ----

    private Api api(ConnectorConfig config) {
        String provider = config.setting("provider", "GITHUB_ACTIONS").toUpperCase();
        Map<String, String> headers = new LinkedHashMap<>();
        headers.put("User-Agent", "OpsPilot");
        if (provider.equals("JENKINS")) {
            String baseUrl = config.setting("baseUrl");
            String job = config.setting("job");
            if (baseUrl == null || job == null) {
                throw new IllegalArgumentException("Jenkins baseUrl and job are required");
            }
            URI base = ConnectorHttp.validate(baseUrl);
            if (config.secret("username") != null && config.secret("apiToken") != null) {
                headers.put("Authorization", "Basic " + Base64.getEncoder()
                        .encodeToString((config.secret("username") + ":" + config.secret("apiToken")).getBytes(StandardCharsets.UTF_8)));
            }
            return new Api(ConnectorHttp.client(false, null), base, headers, true, null, job);
        }
        if (!provider.equals("GITHUB_ACTIONS")) {
            throw new IllegalArgumentException("provider must be GITHUB_ACTIONS or JENKINS");
        }
        String repo = config.setting("repo");
        if (repo == null || !repo.matches("[\\w.-]+/[\\w.-]+")) {
            throw new IllegalArgumentException("Repository must look like owner/name");
        }
        headers.put("Accept", "application/vnd.github+json");
        headers.put("X-GitHub-Api-Version", "2022-11-28");
        if (config.secret("token") != null) {
            headers.put("Authorization", "Bearer " + config.secret("token"));
        }
        return new Api(ConnectorHttp.client(false, null), ConnectorHttp.validate(config.setting("apiBaseUrl", DEFAULT_GITHUB_API)),
                headers, false, repo, null);
    }

    private static String describe(Exception e) {
        if (e instanceof ConnectorHttp.HttpStatusException h) {
            if (h.status() == 401 || h.status() == 403) return "The CI provider rejected the credentials (HTTP " + h.status() + ")";
            if (h.status() == 404) return "Pipeline not found (HTTP 404)";
            return h.getMessage();
        }
        if (e instanceof IllegalArgumentException || e instanceof IllegalStateException) {
            return e.getMessage();
        }
        return "Cannot reach CI provider: " + e.getClass().getSimpleName();
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private record Api(HttpClient client, URI base, Map<String, String> headers, boolean jenkins, String repo, String job) {
        String get(String path) throws IOException {
            return ConnectorHttp.get(client, URI.create(base.toString().replaceAll("/+$", "") + path), headers);
        }
    }
}
