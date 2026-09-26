package com.opspilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "commit_logs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CommitLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "commit_log_id")
    private Long commitLogId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonIgnore
    private Project project;

    @Column(name = "commit_sha", nullable = false)
    private String commitSha;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "author", nullable = false)
    private String author;

    @Column(name = "message", nullable = false, length = 2048)
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public CommitLogEntity() {
        this.timestamp = LocalDateTime.now();
    }

    public CommitLogEntity(Project project, String commitSha, String branchName, String author, String message) {
        this.project = project;
        this.commitSha = commitSha;
        this.branchName = branchName;
        this.author = author;
        this.message = truncateMessage(message);
        this.timestamp = LocalDateTime.now();
    }

    public CommitLogEntity(Project project, String commitSha, String branchName, String author, String message, LocalDateTime timestamp) {
        this.project = project;
        this.commitSha = commitSha;
        this.branchName = branchName;
        this.author = author;
        this.message = truncateMessage(message);
        this.timestamp = timestamp;
    }

    private static String truncateMessage(String msg) {
        if (msg == null) return "";
        return msg.length() > 2040 ? msg.substring(0, 2040) : msg;
    }

    public Long getCommitLogId() {
        return commitLogId;
    }

    public void setCommitLogId(Long commitLogId) {
        this.commitLogId = commitLogId;
    }

    @JsonIgnore
    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    @JsonProperty("projectId")
    public Long getProjectId() {
        return project != null ? project.getId() : null;
    }

    @JsonProperty("projectName")
    public String getProjectName() {
        return project != null ? project.getProjectName() : null;
    }

    public String getCommitSha() {
        return commitSha;
    }

    public void setCommitSha(String commitSha) {
        this.commitSha = commitSha;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = truncateMessage(message);
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
