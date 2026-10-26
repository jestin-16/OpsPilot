package com.opspilot.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.opspilot.validation.ValidationRules;

public class ProjectRequest {

    // Optional on partial updates, but a supplied name must be valid.
    @Size(min = 1, max = 100, message = "Project name must be between 1 and 100 characters")
    @Pattern(regexp = ValidationRules.RESOURCE_NAME, message = "Project name contains invalid characters")
    @com.fasterxml.jackson.annotation.JsonAlias("name")
    private String projectName;

    @jakarta.validation.constraints.Pattern(regexp = "^$|dev|staging|prod", message = "Environment must be dev, staging or prod")
    private String environment;

    @Size(max = 1000, message = "Description must be 1000 characters or fewer")
    @Pattern(regexp = ValidationRules.MULTILINE_TEXT, message = "Description must not contain control characters")
    private String description;

    @Size(max = 2048, message = "Repository URL must be 2048 characters or fewer")
    @Pattern(regexp = ValidationRules.REPOSITORY_URL, message = "Repository URL must be a GitHub or GitLab repository URL")
    private String repositoryUrl;

    private String awsLogGroupName;

    private String githubRepoName;

    private String lokiAppLabel;

    private String ociLogGroupOcid;

    private String credentialsJson;

    private String status; // Active, Archived

    public ProjectRequest() {
    }

    public ProjectRequest(String projectName, String description, String repositoryUrl, String awsLogGroupName, String githubRepoName, String lokiAppLabel, String ociLogGroupOcid, String credentialsJson, String status) {
        this.projectName = projectName;
        this.description = description;
        this.repositoryUrl = repositoryUrl;
        this.awsLogGroupName = awsLogGroupName;
        this.githubRepoName = githubRepoName;
        this.lokiAppLabel = lokiAppLabel;
        this.ociLogGroupOcid = ociLogGroupOcid;
        this.credentialsJson = credentialsJson;
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

    public String getAwsLogGroupName() {
        return awsLogGroupName;
    }

    public void setAwsLogGroupName(String awsLogGroupName) {
        this.awsLogGroupName = awsLogGroupName;
    }

    public String getGithubRepoName() {
        return githubRepoName;
    }

    public void setGithubRepoName(String githubRepoName) {
        this.githubRepoName = githubRepoName;
    }

    public String getLokiAppLabel() {
        return lokiAppLabel;
    }

    public void setLokiAppLabel(String lokiAppLabel) {
        this.lokiAppLabel = lokiAppLabel;
    }

    public String getOciLogGroupOcid() {
        return ociLogGroupOcid;
    }

    public void setOciLogGroupOcid(String ociLogGroupOcid) {
        this.ociLogGroupOcid = ociLogGroupOcid;
    }

    public String getCredentialsJson() {
        return credentialsJson;
    }

    public void setCredentialsJson(String credentialsJson) {
        this.credentialsJson = credentialsJson;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }
}
