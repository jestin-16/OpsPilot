package com.opspilot.dto;

import jakarta.validation.constraints.NotBlank;

public class ProjectRequest {

    @NotBlank(message = "Project name is required")
    private String projectName;

    private String description;

    private String repositoryUrl;

    private String status; // Active, Archived

    public ProjectRequest() {
    }

    public ProjectRequest(String projectName, String description, String repositoryUrl, String status) {
        this.projectName = projectName;
        this.description = description;
        this.repositoryUrl = repositoryUrl;
        this.status = status;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
