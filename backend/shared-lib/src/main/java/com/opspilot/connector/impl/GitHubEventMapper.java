package com.opspilot.connector.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.opspilot.connector.LogEntry;
import com.opspilot.enums.ProviderType;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** Turns GitHub push / pull-request / workflow-run data (REST or webhook form) into unified log entries. */
public final class GitHubEventMapper {

    private GitHubEventMapper() {
    }

    /** One item of GET /repos/{r}/events. Unrelated event types yield empty. */
    public static Optional<LogEntry> fromRestEvent(JsonNode ev, String repo, ProviderType source) {
        String type = ev.path("type").asText();
        String actor = ev.path("actor").path("login").asText("unknown");
        Instant at = time(ev.path("created_at").asText(null));
        JsonNode payload = ev.path("payload");
        switch (type) {
            case "PushEvent":
                return Optional.of(push(repo, actor, at, payload.path("ref").asText(), payload.path("size").asInt(0),
                        payload.path("commits").path(0).path("message").asText(""), payload.path("head").asText(""), ev.path("id").asText(), source));
            case "PullRequestEvent":
                return Optional.of(pullRequest(repo, actor, at, payload.path("action").asText(), payload.path("pull_request"), ev.path("id").asText(), source));
            default:
                return Optional.empty();
        }
    }

    /** A webhook delivery (X-GitHub-Event header value + JSON body). */
    public static Optional<LogEntry> fromWebhook(String event, JsonNode p, ProviderType source) {
        String repo = p.path("repository").path("full_name").asText("");
        String actor = p.path("sender").path("login").asText("unknown");
        switch (event == null ? "" : event) {
            case "push":
                return Optional.of(push(repo, actor, time(p.path("head_commit").path("timestamp").asText(null)), p.path("ref").asText(),
                        p.path("commits").size(), p.path("head_commit").path("message").asText(""), p.path("after").asText(""), null, source));
            case "pull_request":
                return Optional.of(pullRequest(repo, actor, time(p.path("pull_request").path("updated_at").asText(null)),
                        p.path("action").asText(), p.path("pull_request"), null, source));
            case "workflow_run":
                return Optional.of(workflowRun(repo, p.path("workflow_run"), source));
            default:
                return Optional.empty();
        }
    }

    /** One item of GET /repos/{r}/actions/runs. */
    public static LogEntry workflowRun(String repo, JsonNode run, ProviderType source) {
        String status = run.path("status").asText("");
        String conclusion = run.path("conclusion").asText("");
        String outcome = conclusion.isEmpty() || conclusion.equals("null") ? status : conclusion;
        String level = switch (outcome) {
            case "failure", "timed_out", "startup_failure" -> "ERROR";
            case "cancelled", "action_required" -> "WARN";
            default -> "INFO";
        };
        Map<String, String> meta = base(repo, "workflow_run");
        meta.put("workflow", run.path("name").asText());
        meta.put("runNumber", run.path("run_number").asText());
        meta.put("branch", run.path("head_branch").asText());
        meta.put("status", status);
        meta.put("conclusion", conclusion);
        meta.put("url", run.path("html_url").asText());
        meta.put("actor", run.path("actor").path("login").asText());
        LogEntry e = LogEntry.of(source, level,
                "Workflow \"" + run.path("name").asText() + "\" #" + run.path("run_number").asText() + " " + outcome
                        + " on " + run.path("head_branch").asText(),
                time(run.path("updated_at").asText(null)), meta);
        if (run.hasNonNull("id")) e.setId("run-" + run.path("id").asText() + "-" + status + "-" + conclusion);
        return e;
    }

    private static LogEntry push(String repo, String actor, Instant at, String ref, int commits, String firstMessage, String sha, String id, ProviderType source) {
        String branch = ref.startsWith("refs/heads/") ? ref.substring("refs/heads/".length()) : ref;
        Map<String, String> meta = base(repo, "push");
        meta.put("branch", branch);
        meta.put("actor", actor);
        meta.put("sha", sha.length() > 7 ? sha.substring(0, 7) : sha);
        String firstLine = firstMessage.lines().findFirst().orElse("");
        LogEntry e = LogEntry.of(source, "INFO", actor + " pushed " + commits + " commit(s) to " + branch + (firstLine.isEmpty() ? "" : ": " + firstLine), at, meta);
        if (id != null) e.setId("event-" + id);
        return e;
    }

    private static LogEntry pullRequest(String repo, String actor, Instant at, String action, JsonNode pr, String id, ProviderType source) {
        Map<String, String> meta = base(repo, "pull_request");
        meta.put("actor", actor);
        meta.put("action", action);
        meta.put("number", pr.path("number").asText());
        meta.put("url", pr.path("html_url").asText());
        LogEntry e = LogEntry.of(source, "INFO", actor + " " + action + " PR #" + pr.path("number").asText() + ": " + pr.path("title").asText(), at, meta);
        if (id != null) e.setId("event-" + id);
        return e;
    }

    private static Map<String, String> base(String repo, String event) {
        Map<String, String> meta = new LinkedHashMap<>();
        meta.put("repo", repo);
        meta.put("event", event);
        return meta;
    }

    private static Instant time(String iso) {
        if (iso == null) return Instant.now();
        try {
            return Instant.parse(iso);
        } catch (DateTimeParseException e) {
            try {
                return java.time.OffsetDateTime.parse(iso).toInstant();
            } catch (DateTimeParseException ignored) {
                return Instant.now();
            }
        }
    }
}
