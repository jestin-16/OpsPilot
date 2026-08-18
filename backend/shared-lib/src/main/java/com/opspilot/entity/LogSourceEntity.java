package com.opspilot.entity;

import com.opspilot.converter.EncryptionConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "log_sources")
public class LogSourceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "source_id")
    private Long sourceId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "source_name", nullable = false)
    private String sourceName;

    @Column(name = "ingestion_mode", nullable = false)
    private String ingestionMode; // WEBHOOK or POLL

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_mapping", nullable = false, columnDefinition = "jsonb")
    private String fieldMapping; // Stored as JSON string

    @Column(name = "auth_method", nullable = false)
    private String authMethod;

    @Convert(converter = EncryptionConverter.class)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "auth_config", columnDefinition = "jsonb")
    private String authConfig; // Stored as encrypted JSON string

    @Column(name = "poll_endpoint_url")
    private String pollEndpointUrl;

    @Column(name = "poll_interval_seconds")
    private Integer pollIntervalSeconds = 60;

    @Column(name = "last_polled_at")
    private LocalDateTime lastPolledAt;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public LogSourceEntity() {}

    // Getters and Setters

    public Long getSourceId() { return sourceId; }
    public void setSourceId(Long sourceId) { this.sourceId = sourceId; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getIngestionMode() { return ingestionMode; }
    public void setIngestionMode(String ingestionMode) { this.ingestionMode = ingestionMode; }

    public String getFieldMapping() { return fieldMapping; }
    public void setFieldMapping(String fieldMapping) { this.fieldMapping = fieldMapping; }

    public String getAuthMethod() { return authMethod; }
    public void setAuthMethod(String authMethod) { this.authMethod = authMethod; }

    public String getAuthConfig() { return authConfig; }
    public void setAuthConfig(String authConfig) { this.authConfig = authConfig; }

    public String getPollEndpointUrl() { return pollEndpointUrl; }
    public void setPollEndpointUrl(String pollEndpointUrl) { this.pollEndpointUrl = pollEndpointUrl; }

    public Integer getPollIntervalSeconds() { return pollIntervalSeconds; }
    public void setPollIntervalSeconds(Integer pollIntervalSeconds) { this.pollIntervalSeconds = pollIntervalSeconds; }

    public LocalDateTime getLastPolledAt() { return lastPolledAt; }
    public void setLastPolledAt(LocalDateTime lastPolledAt) { this.lastPolledAt = lastPolledAt; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
