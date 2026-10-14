package com.opspilot.entity;

import com.opspilot.enums.IntegrationCategory;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integrations")
public class Integration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private ProviderType provider;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IntegrationCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IntegrationStatus status;

    @Column(columnDefinition = "TEXT")
    private String configuration;

    @Column(name = "credential_reference", columnDefinition = "TEXT")
    @Convert(converter = com.opspilot.converter.SecretEncryptionConverter.class)
    private String credentialReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "last_health_check_at")
    private LocalDateTime lastHealthCheckAt;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    /** SHA-256 of the push-ingest token (APP_LOGS only); the raw token is shown once at creation. */
    @Column(name = "ingest_token_hash", length = 64)
    private String ingestTokenHash;

    @Column(name = "ingest_token_prefix", length = 16)
    private String ingestTokenPrefix;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Integration() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    
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
    
    public String getCredentialReference() { return credentialReference; }
    public void setCredentialReference(String credentialReference) { this.credentialReference = credentialReference; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastHealthCheckAt() { return lastHealthCheckAt; }
    public void setLastHealthCheckAt(LocalDateTime lastHealthCheckAt) { this.lastHealthCheckAt = lastHealthCheckAt; }
    
    public String getIngestTokenHash() { return ingestTokenHash; }
    public void setIngestTokenHash(String ingestTokenHash) { this.ingestTokenHash = ingestTokenHash; }

    public String getIngestTokenPrefix() { return ingestTokenPrefix; }
    public void setIngestTokenPrefix(String ingestTokenPrefix) { this.ingestTokenPrefix = ingestTokenPrefix; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}
