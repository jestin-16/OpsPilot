package com.opspilot.dto;

import jakarta.validation.constraints.NotBlank;

public class ProjectRequest {

    @NotBlank(message = "Project name is required")
    private String projectName;

    private String description;

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
}
