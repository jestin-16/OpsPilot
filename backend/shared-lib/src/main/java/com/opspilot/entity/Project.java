package com.opspilot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "repository_url")
    private String repositoryUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "aws_log_group_name")
    private String awsLogGroupName;

    @Column(name = "github_repo_name")
    private String githubRepoName;

    @Column(name = "loki_app_label")
    private String lokiAppLabel;

    @Column(nullable = false)
    private String status = "Active";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Project() {
    }

    public Project(String projectName, String description, String repositoryUrl, User owner, String status) {
        this.projectName = projectName;
        this.description = description;
        this.repositoryUrl = repositoryUrl;
        this.owner = owner;
        this.status = status != null ? status : "Active";
        this.createdAt = LocalDateTime.now();
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

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
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
}
