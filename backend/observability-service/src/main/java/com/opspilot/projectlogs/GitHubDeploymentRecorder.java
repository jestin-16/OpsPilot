package com.opspilot.projectlogs;

import com.fasterxml.jackson.databind.JsonNode;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.Project;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Optional;

/**
 * Records GitHub `deployment` and `deployment_status` webhook events (sent when a workflow or a person
 * deploys to a GitHub environment) as the project's deployments. One row per GitHub deployment id; each
 * status event updates it, ignoring deliveries older than the status already recorded.
 */
@Component
public class GitHubDeploymentRecorder {

    static final String EVENT_DEPLOYMENT = "deployment";
    static final String EVENT_DEPLOYMENT_STATUS = "deployment_status";

    private final DeploymentRepository deployments;
    private final ProjectRepository projects;
    private final LogRepository logs;

    public GitHubDeploymentRecorder(DeploymentRepository deployments, ProjectRepository projects, LogRepository logs) {
        this.deployments = deployments;
        this.projects = projects;
        this.logs = logs;
    }

    public static boolean handles(String event) {
        return EVENT_DEPLOYMENT.equals(event) || EVENT_DEPLOYMENT_STATUS.equals(event);
    }

    /** Returns the recorded deployment, or empty when the payload has no deployment. */
    @Transactional
    public Optional<Deployment> record(Long projectId, String event, JsonNode payload) {
        JsonNode gh = payload.path("deployment");
        if (!gh.hasNonNull("id")) {
            return Optional.empty();
        }
        Project project = projects.findById(projectId).orElse(null);
        if (project == null) {
            return Optional.empty();
        }
        String externalId = gh.get("id").asText();
        JsonNode statusNode = payload.path("deployment_status");
        boolean isStatus = EVENT_DEPLOYMENT_STATUS.equals(event) && !statusNode.isMissingNode();

        String status = isStatus ? mapState(statusNode.path("state").asText(null)) : Deployment.IN_PROGRESS;
        LocalDateTime eventTime = parseTime(isStatus ? statusNode.path("updated_at").asText(statusNode.path("created_at").asText(null))
                : gh.path("created_at").asText(null));
        String url = isStatus ? firstNonBlank(statusNode.path("environment_url").asText(null), statusNode.path("target_url").asText(null)) : null;

        Optional<Deployment> existing = deployments.findByProject_IdAndSourceAndExternalId(projectId, Deployment.SOURCE_GITHUB, externalId);
        Deployment deployment;
        boolean created = existing.isEmpty();
        if (created) {
            deployment = new Deployment(project, null, version(gh), gh.path("environment").asText("unknown"), status);
            deployment.setSource(Deployment.SOURCE_GITHUB);
            deployment.setExternalId(externalId);
            deployment.setActor(gh.path("creator").path("login").asText(null));
            LocalDateTime createdAt = parseTime(gh.path("created_at").asText(null));
            if (createdAt != null) {
                deployment.setDeployedAt(createdAt);
            }
        } else {
            deployment = existing.get();
            // Deliveries can arrive out of order; never let an older status overwrite a newer one.
            if (eventTime != null && deployment.getUpdatedAt() != null && eventTime.isBefore(deployment.getUpdatedAt())) {
                return Optional.of(deployment);
            }
            if (isStatus) {
                deployment.setStatus(status);
            }
        }
        if (url != null) {
            deployment.setUrl(url);
        }
        deployment.setUpdatedAt(eventTime != null ? eventTime : LocalDateTime.now());
        Deployment saved = deployments.save(deployment);

        if (created || isStatus) {
            logs.save(new LogEntity(saved, "github-deployments", Deployment.FAILED.equals(saved.getStatus()) ? "ERROR" : "INFO",
                    "GitHub deployment " + saved.getVersion() + " to " + saved.getEnvironment() + ": " + saved.getStatus()
                            + (saved.getActor() != null ? " (by " + saved.getActor() + ")" : "")));
        }
        return Optional.of(saved);
    }

    /** GitHub deployment states: error, failure, inactive, in_progress, queued, pending, success. */
    static String mapState(String state) {
        if (state == null) {
            return Deployment.IN_PROGRESS;
        }
        return switch (state) {
            case "success" -> Deployment.SUCCEEDED;
            case "failure", "error" -> Deployment.FAILED;
            case "inactive" -> Deployment.INACTIVE;
            default -> Deployment.IN_PROGRESS;
        };
    }

    /** "ref@sha7" (e.g. v2.8.4@1a2b3c4), or just the short sha when the ref is the sha itself. */
    static String version(JsonNode gh) {
        String sha = gh.path("sha").asText("");
        String shortSha = sha.length() > 7 ? sha.substring(0, 7) : sha;
        String ref = gh.path("ref").asText("");
        String version = ref.isEmpty() || ref.equals(sha) ? shortSha : (shortSha.isEmpty() ? ref : ref + "@" + shortSha);
        if (version.isEmpty()) {
            version = "unknown";
        }
        return version.length() > 255 ? version.substring(0, 255) : version;
    }

    private static LocalDateTime parseTime(String iso) {
        if (iso == null || iso.isBlank()) {
            return null;
        }
        try {
            // Same zone as LocalDateTime.now(), which every other deployment timestamp uses.
            return OffsetDateTime.parse(iso).atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return b != null && !b.isBlank() ? b : null;
    }
}
