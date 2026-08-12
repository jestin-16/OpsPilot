package com.opspilot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deployments")
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "deployed_by_id", nullable = false)
    private User deployedBy;

    @Column(nullable = false)
    private String version;

    @Column(nullable = false)
    private String environment; // Dev, Staging, Production

    @Column(nullable = false)
    private String status; // Draft, Building, Deploying, Running, Failed, RolledBack

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
}
