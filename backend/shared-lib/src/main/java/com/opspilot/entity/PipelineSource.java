package com.opspilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.opspilot.converter.SecretEncryptionConverter;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_sources")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PipelineSource {

    public static final String GITHUB_ACTIONS = "GITHUB_ACTIONS";
    public static final String JENKINS = "JENKINS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 50)
    private String provider;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "repo_full_name")
    private String repoFullName;

    // Secrets are @JsonIgnore'd so the entity can never leak them if serialized by accident.
    @JsonIgnore
    @Convert(converter = SecretEncryptionConverter.class)
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "base_url", length = 512)
    private String baseUrl;

    @Column(name = "job_name")
    private String jobName;

    private String username;

    @JsonIgnore
    @Convert(converter = SecretEncryptionConverter.class)
    @Column(name = "api_token", columnDefinition = "TEXT")
    private String apiToken;

    @JsonIgnore
    @Convert(converter = SecretEncryptionConverter.class)
    @Column(name = "webhook_secret", nullable = false, columnDefinition = "TEXT")
    private String webhookSecret;

    @Column(name = "project_id")
    private Long projectId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getRepoFullName() { return repoFullName; }
    public void setRepoFullName(String repoFullName) { this.repoFullName = repoFullName; }
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getApiToken() { return apiToken; }
    public void setApiToken(String apiToken) { this.apiToken = apiToken; }
    public String getWebhookSecret() { return webhookSecret; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}
