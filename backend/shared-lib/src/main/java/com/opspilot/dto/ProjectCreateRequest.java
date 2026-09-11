package com.opspilot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ProjectCreateRequest {
    @NotBlank(message = "Project name is required")
    @Size(max = 100, message = "Project name must be 100 characters or fewer")
    private String projectName;

    @Size(max = 1000, message = "Description must be 1000 characters or fewer")
    private String description;

    @Pattern(
            regexp = "^$|https?://(www\\.)?(github\\.com|gitlab\\.com)/.+$",
            message = "Repository URL must be a GitHub or GitLab URL"
    )
    private String repositoryUrl;

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
}