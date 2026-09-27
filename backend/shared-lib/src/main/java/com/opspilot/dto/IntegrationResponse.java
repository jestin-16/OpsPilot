package com.opspilot.dto;

import com.opspilot.enums.IntegrationCategory;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;

import java.time.LocalDateTime;

public class IntegrationResponse {
    private Long id;
    private Long projectId;
    private ProviderType ProviderType;
    private String name;
    private IntegrationCategory category;
    private IntegrationStatus status;
    private String configuration;
    // Notice: NO credentials returned
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastHealthCheckAt;
    private String metadata;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public ProviderType getProvider() { return ProviderType; }
    public void setProvider(ProviderType ProviderType) { this.ProviderType = ProviderType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public IntegrationCategory getCategory() { return category; }
    public void setCategory(IntegrationCategory category) { this.category = category; }

    public IntegrationStatus getStatus() { return status; }
    public void setStatus(IntegrationStatus status) { this.status = status; }

    public String getConfiguration() { return configuration; }
    public void setConfiguration(String configuration) { this.configuration = configuration; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastHealthCheckAt() { return lastHealthCheckAt; }
    public void setLastHealthCheckAt(LocalDateTime lastHealthCheckAt) { this.lastHealthCheckAt = lastHealthCheckAt; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}
