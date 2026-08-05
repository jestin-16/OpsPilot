package com.opspilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pipeline_runs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PipelineRunEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "run_id")
    private Long runId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "owner"})
    private Project project;

    @Column(name = "event_type", nullable = false)
    private String eventType; // e.g. push, pull_request, workflow_run

    @Column(nullable = false)
    private String branch;

    @Column(name = "commit_sha", nullable = false)
    private String commitSha;

    @Column(name = "commit_message", length = 1024)
    private String commitMessage;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false)
    private String status; // e.g. SUCCESS, IN_PROGRESS, FAILED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public PipelineRunEntity() {
        this.createdAt = LocalDateTime.now();
    }

    public PipelineRunEntity(Project project, String eventType, String branch, String commitSha, String commitMessage, String author, String status) {
        this.project = project;
        this.eventType = eventType;
        this.branch = branch;
        this.commitSha = commitSha;
        this.commitMessage = commitMessage;
        this.author = author;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public Long getRunId() {
        return runId;
    }

    public void setRunId(Long runId) {
        this.runId = runId;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getCommitSha() {
        return commitSha;
    }

    public void setCommitSha(String commitSha) {
        this.commitSha = commitSha;
    }

    public String getCommitMessage() {
        return commitMessage;
    }

    public void setCommitMessage(String commitMessage) {
        this.commitMessage = commitMessage;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
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
