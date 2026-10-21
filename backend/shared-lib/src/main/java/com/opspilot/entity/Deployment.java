package com.opspilot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deployments")
public class Deployment {

    // Statuses of a real deployment (GitHub deployment states map onto these).
    public static final String IN_PROGRESS = "In progress";
    public static final String SUCCEEDED = "Succeeded";
    public static final String FAILED = "Failed";
    public static final String INACTIVE = "Inactive";

    // Where the record came from.
    public static final String SOURCE_MANUAL = "MANUAL";
    public static final String SOURCE_GITHUB = "GITHUB";
    /** Reported by a CI pipeline with the project's ingest token. */
    public static final String SOURCE_CI = "CI";

    /** Accepts common spellings and GitHub's states; no status means the deployment succeeded. */
    public static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return SUCCEEDED;
        }
        return switch (status.trim().toLowerCase(java.util.Locale.ROOT).replace('_', ' ').replace('-', ' ')) {
            case "succeeded", "success", "successful", "done" -> SUCCEEDED;
            case "failed", "failure", "error" -> FAILED;
            case "in progress", "pending", "queued", "started", "running" -> IN_PROGRESS;
            case "inactive", "rolled back", "superseded" -> INACTIVE;
            default -> throw new IllegalArgumentException("Status must be one of: In progress, Succeeded, Failed, Inactive");
        };
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    /** The OpsPilot user who recorded it; null for deployments reported by GitHub (see actor). */
    @JoinColumn(name = "deployed_by_id")
    private User deployedBy;

    @Column(nullable = false)
    private String version;

    @Column(nullable = false)
    private String environment; // Dev, Staging, Production

    @Column(nullable = false)
    private String status; // IN_PROGRESS, SUCCEEDED, FAILED, INACTIVE (older simulated rows: Running, ...)

    @Column(nullable = false, length = 30)
    private String source = SOURCE_MANUAL;

    @Column(name = "external_id")
    private String externalId;

    @Column(length = 1024)
    private String url;

    private String actor;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deployed_at", nullable = false, updatable = false)
    private LocalDateTime deployedAt = LocalDateTime.now();

    public Deployment() {
    }

    public Deployment(Project project, User deployedBy, String version, String environment, String status) {
        this.project = project;
        this.deployedBy = deployedBy;
        this.version = version;
        this.environment = environment;
        this.status = status;
        this.deployedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public User getDeployedBy() {
        return deployedBy;
    }

    public void setDeployedBy(User deployedBy) {
        this.deployedBy = deployedBy;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getDeployedAt() {
        return deployedAt;
    }

    public void setDeployedAt(LocalDateTime deployedAt) {
        this.deployedAt = deployedAt;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
