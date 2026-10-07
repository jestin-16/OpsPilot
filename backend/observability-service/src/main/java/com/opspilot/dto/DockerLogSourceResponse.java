package com.opspilot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.opspilot.entity.DockerLogSource;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Safe view of a source. The token hash is never exposed; {@code token} is populated only on create and rotate.
 * {@code status} is derived at read time so a silent agent shows STALE even before the sweep runs.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DockerLogSourceResponse {
    public static final String INGEST_PATH = "/api/v1/ingest/loki/push";

    private UUID id;
    private Long projectId;
    private String name;
    private String environment;
    private String type;
    private String tokenPrefix;
    private String status;
    private LocalDateTime lastSeenAt;
    private LocalDateTime createdAt;
    private String ingestPath = INGEST_PATH;
    private String token;

    public static DockerLogSourceResponse from(DockerLogSource s, Duration staleAfter, LocalDateTime now) {
        DockerLogSourceResponse r = new DockerLogSourceResponse();
        r.id = s.getId();
        r.projectId = s.getProjectId();
        r.name = s.getName();
        r.environment = s.getEnvironment();
        r.type = s.getType();
        r.tokenPrefix = s.getTokenPrefix();
        r.lastSeenAt = s.getLastSeenAt();
        r.createdAt = s.getCreatedAt();
        r.status = derive(s, staleAfter, now);
        return r;
    }

    static String derive(DockerLogSource s, Duration staleAfter, LocalDateTime now) {
        if (s.getLastSeenAt() == null) return DockerLogSource.WAITING;
        return s.getLastSeenAt().isBefore(now.minus(staleAfter)) ? DockerLogSource.STALE : DockerLogSource.ACTIVE;
    }

    public DockerLogSourceResponse withToken(String token) {
        this.token = token;
        return this;
    }

    public UUID getId() { return id; }
    public Long getProjectId() { return projectId; }
    public String getName() { return name; }
    public String getEnvironment() { return environment; }
    public String getType() { return type; }
    public String getTokenPrefix() { return tokenPrefix; }
    public String getStatus() { return status; }
    public LocalDateTime getLastSeenAt() { return lastSeenAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getIngestPath() { return ingestPath; }
    public String getToken() { return token; }
}
