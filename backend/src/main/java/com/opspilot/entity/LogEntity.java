package com.opspilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "logs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "project", "deployedBy"})
    private Deployment deployment;

    @Column(name = "source_service", nullable = false)
    private String sourceService;

    @Column(name = "log_level", nullable = false)
    private String logLevel; // e.g. INFO, WARN, ERROR

    @Column(nullable = false, length = 2048)
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public LogEntity() {
        this.timestamp = LocalDateTime.now();
    }

    public LogEntity(Deployment deployment, String sourceService, String logLevel, String message) {
        this.deployment = deployment;
        this.sourceService = sourceService;
        this.logLevel = logLevel;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public Deployment getDeployment() {
        return deployment;
    }

    public void setDeployment(Deployment deployment) {
        this.deployment = deployment;
    }

    public String getSourceService() {
        return sourceService;
    }

    public void setSourceService(String sourceService) {
        this.sourceService = sourceService;
    }

    public String getLogLevel() {
        return logLevel;
    }

    public void setLogLevel(String logLevel) {
        this.logLevel = logLevel;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
