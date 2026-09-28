package com.opspilot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_rules")
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "integration_id")
    private Long integrationId;

    private String resource;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private Integer threshold;

    @Column(name = "time_window", nullable = false)
    private Integer timeWindow;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "notification_policy")
    private String notificationPolicy;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getIntegrationId() { return integrationId; }
    public void setIntegrationId(Long integrationId) { this.integrationId = integrationId; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public Integer getThreshold() { return threshold; }
    public void setThreshold(Integer threshold) { this.threshold = threshold; }

    public Integer getTimeWindow() { return timeWindow; }
    public void setTimeWindow(Integer timeWindow) { this.timeWindow = timeWindow; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public String getNotificationPolicy() { return notificationPolicy; }
    public void setNotificationPolicy(String notificationPolicy) { this.notificationPolicy = notificationPolicy; }
}
