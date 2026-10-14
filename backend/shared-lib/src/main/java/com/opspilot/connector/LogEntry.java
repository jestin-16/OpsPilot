package com.opspilot.connector;

import com.opspilot.enums.ProviderType;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Unified log record produced by every connector and by push ingest. */
public class LogEntry {

    private String id = UUID.randomUUID().toString();
    private Long projectId;
    private Long integrationId;
    private ProviderType sourceType;
    private String level = "INFO";
    private String message;
    private Instant timestamp = Instant.now();
    private Map<String, String> metadata = new HashMap<>();

    public LogEntry() {
    }

    public static LogEntry of(ProviderType sourceType, String level, String message, Instant timestamp, Map<String, String> metadata) {
        LogEntry e = new LogEntry();
        e.sourceType = sourceType;
        e.level = Levels.normalize(level);
        e.message = message;
        e.timestamp = timestamp != null ? timestamp : Instant.now();
        if (metadata != null) {
            e.metadata = new HashMap<>(metadata);
        }
        return e;
    }

    /** Copy with the owning project and integration stamped on. */
    public LogEntry owned(Long projectId, Long integrationId) {
        this.projectId = projectId;
        this.integrationId = integrationId;
        return this;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public Long getIntegrationId() { return integrationId; }
    public void setIntegrationId(Long integrationId) { this.integrationId = integrationId; }
    public ProviderType getSourceType() { return sourceType; }
    public void setSourceType(ProviderType sourceType) { this.sourceType = sourceType; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = Levels.normalize(level); }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata != null ? metadata : new HashMap<>(); }
}
