package com.opspilot.event;

import com.opspilot.entity.User;
import org.springframework.context.ApplicationEvent;

public class AuditEvent extends ApplicationEvent {

    private final User user;
    private final String action;
    private final String resourceType;
    private final String resourceId;
    private final String details;

    public AuditEvent(Object source, User user, String action, String resourceType, String resourceId, String details) {
        super(source);
        this.user = user;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.details = details;
    }

    public User getUser() {
        return user;
    }

    public String getAction() {
        return action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public String getDetails() {
        return details;
    }
}
