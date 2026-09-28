package com.opspilot.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "notification_policies")
public class NotificationPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "minimum_severity")
    private String minimumSeverity;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "selected_channels")
    private String selectedChannels; // Comma-separated like "IN_APP,EMAIL"

    @Column(nullable = false)
    private Integer cooldown = 0; // in minutes

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getMinimumSeverity() { return minimumSeverity; }
    public void setMinimumSeverity(String minimumSeverity) { this.minimumSeverity = minimumSeverity; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public String getSelectedChannels() { return selectedChannels; }
    public void setSelectedChannels(String selectedChannels) { this.selectedChannels = selectedChannels; }

    public Integer getCooldown() { return cooldown; }
    public void setCooldown(Integer cooldown) { this.cooldown = cooldown; }
}
