package com.opspilot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.opspilot.entity.PipelineSource;

import java.time.LocalDateTime;

/**
 * Safe view of a source. Secrets are never included; only boolean "has..." flags and a fixed mask.
 * {@code webhookSecret} is populated exclusively on create and on the explicit regenerate call.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PipelineSourceResponse {
    public static final String MASK = "********";

    private Long id;
    private String name;
    private String provider;
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String repoFullName;
    private String baseUrl;
    private String jobName;
    private String username;
    private Long projectId;
    private boolean hasAccessToken;
    private boolean hasApiToken;
    private String accessToken;
    private String apiToken;
    private String webhookPath;
    private LocalDateTime lastRunAt;
    private String webhookSecret;

    public static PipelineSourceResponse from(PipelineSource s, LocalDateTime lastRunAt) {
        PipelineSourceResponse r = new PipelineSourceResponse();
        r.id = s.getId();
        r.name = s.getName();
        r.provider = s.getProvider();
        r.enabled = s.isEnabled();
        r.createdAt = s.getCreatedAt();
        r.updatedAt = s.getUpdatedAt();
        r.repoFullName = s.getRepoFullName();
        r.baseUrl = s.getBaseUrl();
        r.jobName = s.getJobName();
        r.username = s.getUsername();
        r.projectId = s.getProjectId();
        r.hasAccessToken = s.getAccessToken() != null && !s.getAccessToken().isBlank();
        r.hasApiToken = s.getApiToken() != null && !s.getApiToken().isBlank();
        r.accessToken = r.hasAccessToken ? MASK : null;
        r.apiToken = r.hasApiToken ? MASK : null;
        String seg = PipelineSource.GITHUB_ACTIONS.equals(s.getProvider()) ? "github" : "jenkins";
        r.webhookPath = "/api/v1/cicd/webhooks/" + seg + "/" + s.getId();
        r.lastRunAt = lastRunAt;
        return r;
    }

    public PipelineSourceResponse withWebhookSecret(String secret) {
        this.webhookSecret = secret;
        return this;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getProvider() { return provider; }
    public boolean isEnabled() { return enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getRepoFullName() { return repoFullName; }
    public String getBaseUrl() { return baseUrl; }
    public String getJobName() { return jobName; }
    public String getUsername() { return username; }
    public Long getProjectId() { return projectId; }
    public boolean isHasAccessToken() { return hasAccessToken; }
    public boolean isHasApiToken() { return hasApiToken; }
    public String getAccessToken() { return accessToken; }
    public String getApiToken() { return apiToken; }
    public String getWebhookPath() { return webhookPath; }
    public LocalDateTime getLastRunAt() { return lastRunAt; }
    public String getWebhookSecret() { return webhookSecret; }
}
