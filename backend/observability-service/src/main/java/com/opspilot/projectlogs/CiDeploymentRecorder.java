package com.opspilot.projectlogs;

import com.fasterxml.jackson.databind.JsonNode;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.Project;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Records a deployment reported by a CI pipeline (POST /api/v1/ingest/{projectId}/deployments with the
 * project's ingest token). Body: {"version", "environment", "status"?, "url"?, "actor"?, "id"?}. A CI-side
 * "id" makes later calls update the same deployment (e.g. "In progress", then "Succeeded").
 */
@Component
public class CiDeploymentRecorder {

    private final DeploymentRepository deployments;
    private final ProjectRepository projects;
    private final LogRepository logs;

    public CiDeploymentRecorder(DeploymentRepository deployments, ProjectRepository projects, LogRepository logs) {
        this.deployments = deployments;
        this.projects = projects;
        this.logs = logs;
    }

    @Transactional
    public Deployment record(Long projectId, String reporter, JsonNode body) {
        String version = text(body, "version");
        String environment = text(body, "environment");
        if (version == null || environment == null) {
            throw new IllegalArgumentException("version and environment are required");
        }
        String status = Deployment.normalizeStatus(text(body, "status"));
        String externalId = text(body, "id");
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Optional<Deployment> existing = externalId == null ? Optional.empty()
                : deployments.findByProject_IdAndSourceAndExternalId(projectId, Deployment.SOURCE_CI, externalId);
        Deployment deployment = existing.orElseGet(() -> {
            Deployment d = new Deployment(project, null, limit(version, 255), limit(environment, 255), status);
            d.setSource(Deployment.SOURCE_CI);
            d.setExternalId(externalId != null ? limit(externalId, 255) : null);
            return d;
        });
        deployment.setStatus(status);
        String actor = text(body, "actor");
        deployment.setActor(limit(actor != null ? actor : reporter, 255));
        String url = text(body, "url");
        if (url != null) {
            deployment.setUrl(limit(url, 1024));
        }
        deployment.setUpdatedAt(LocalDateTime.now());
        Deployment saved = deployments.save(deployment);

        logs.save(new LogEntity(saved, "ci-deployments", Deployment.FAILED.equals(status) ? "ERROR" : "INFO",
                "Deployment " + saved.getVersion() + " to " + saved.getEnvironment() + ": " + status + " (reported by " + saved.getActor() + ")"));
        return saved;
    }

    private static String text(JsonNode body, String field) {
        JsonNode value = body.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText().trim();
        return text.isEmpty() ? null : text;
    }

    private static String limit(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
