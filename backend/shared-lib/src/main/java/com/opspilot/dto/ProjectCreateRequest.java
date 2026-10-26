package com.opspilot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.opspilot.validation.ValidationRules;

public class ProjectCreateRequest {
    @NotBlank(message = "Project name is required")
    @Size(max = 100, message = "Project name must be 100 characters or fewer")
    @Pattern(regexp = ValidationRules.RESOURCE_NAME, message = "Project name contains invalid characters")
    @com.fasterxml.jackson.annotation.JsonAlias("name")
    private String projectName;

    @Pattern(regexp = "^$|dev|staging|prod", message = "Environment must be dev, staging or prod")
    private String environment;

    @Size(max = 1000, message = "Description must be 1000 characters or fewer")
    @Pattern(regexp = ValidationRules.MULTILINE_TEXT, message = "Description must not contain control characters")
    private String description;

    @Pattern(
            regexp = ValidationRules.REPOSITORY_URL,
            message = "Repository URL must be a GitHub or GitLab URL"
    )
    @Size(max = 2048, message = "Repository URL must be 2048 characters or fewer")
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

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }
}
