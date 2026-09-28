package com.opspilot.messaging;

import com.opspilot.event.EventType;
import java.time.LocalDateTime;

public class EventEnvelope {
    private String eventId;
    private EventType eventType;
    private LocalDateTime timestamp;
    private Long projectId;
    private Long integrationId;
    private String source;
    private Object payload;
    private String correlationId;

    public EventEnvelope() {}

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getIntegrationId() { return integrationId; }
    public void setIntegrationId(Long integrationId) { this.integrationId = integrationId; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
}
