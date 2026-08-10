package com.opspilot.dto;

import java.time.LocalDateTime;

public class ProjectResponse {

    private Long id;
    private String projectName;
    private String description;
    private String repositoryUrl;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String deployedUrl;
    private String status;
    private LocalDateTime createdAt;

    public ProjectResponse() {
    }

    public ProjectResponse(Long id, String projectName, String description, String repositoryUrl,
                           Long ownerId, String ownerName, String ownerEmail, String status, LocalDateTime createdAt) {
        this(id, projectName, description, repositoryUrl, ownerId, ownerName, ownerEmail,
             "http://localhost:8080/api/v1/projects/" + id + "/output", status, createdAt);
    }

    public ProjectResponse(Long id, String projectName, String description, String repositoryUrl,
                           Long ownerId, String ownerName, String ownerEmail, String deployedUrl, String status, LocalDateTime createdAt) {
        this.id = id;
        this.projectName = projectName;
        this.description = description;
        this.repositoryUrl = repositoryUrl;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.deployedUrl = deployedUrl;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRepositoryUrl() {
        return repositoryUrl;
    }

    public void setRepositoryUrl(String repositoryUrl) {
        this.repositoryUrl = repositoryUrl;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getDeployedUrl() {
        return deployedUrl;
    }

    public void setDeployedUrl(String deployedUrl) {
        this.deployedUrl = deployedUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
