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
    @Column(nullable = false)
    private ProviderType ProviderType;

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

    @Column(name = "credential_reference")
    @Convert(converter = com.opspilot.converter.EncryptionConverter.class)
    private String credentialReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "last_health_check_at")
    private LocalDateTime lastHealthCheckAt;

    @Column(columnDefinition = "TEXT")
    private String metadata;

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
    
    public String getCredentialReference() { return credentialReference; }
    public void setCredentialReference(String credentialReference) { this.credentialReference = credentialReference; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastHealthCheckAt() { return lastHealthCheckAt; }
    public void setLastHealthCheckAt(LocalDateTime lastHealthCheckAt) { this.lastHealthCheckAt = lastHealthCheckAt; }
    
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}
