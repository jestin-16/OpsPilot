package com.opspilot.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.opspilot.enums.IntegrationCategory;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;

import java.time.LocalDateTime;
import java.util.Map;

/** Never carries secrets: {@code config} holds non-secret settings only and {@code credentialKeys} lists names, not values. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IntegrationResponse {
    private Long id;
    private Long projectId;
    private ProviderType provider;
    private String name;
    private IntegrationCategory category;
    private IntegrationStatus status;
    private String configuration;
    private Map<String, Object> config;
    private java.util.List<String> credentialKeys;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastHealthCheckAt;
    private String metadata;
    private String statusMessage;
    private String ingestToken;
    private String ingestTokenPrefix;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public ProviderType getProvider() { return provider; }
    public void setProvider(ProviderType provider) { this.provider = provider; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public IntegrationCategory getCategory() { return category; }
    public void setCategory(IntegrationCategory category) { this.category = category; }

    public IntegrationStatus getStatus() { return status; }
    public void setStatus(IntegrationStatus status) { this.status = status; }

    public String getConfiguration() { return configuration; }
    public void setConfiguration(String configuration) { this.configuration = configuration; }

    public Map<String, Object> getConfig() { return config; }
    public void setConfig(Map<String, Object> config) { this.config = config; }

    public java.util.List<String> getCredentialKeys() { return credentialKeys; }
    public void setCredentialKeys(java.util.List<String> credentialKeys) { this.credentialKeys = credentialKeys; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastHealthCheckAt() { return lastHealthCheckAt; }
    public void setLastHealthCheckAt(LocalDateTime lastHealthCheckAt) { this.lastHealthCheckAt = lastHealthCheckAt; }

    /** Same instant as lastHealthCheckAt, named for the project-first API. */
    public LocalDateTime getLastCheckedAt() { return lastHealthCheckAt; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }

    /** Present only in the response to the create call (APP_LOGS); it cannot be read back later. */
    public String getIngestToken() { return ingestToken; }
    public void setIngestToken(String ingestToken) { this.ingestToken = ingestToken; }

    public String getIngestTokenPrefix() { return ingestTokenPrefix; }
    public void setIngestTokenPrefix(String ingestTokenPrefix) { this.ingestTokenPrefix = ingestTokenPrefix; }
}
