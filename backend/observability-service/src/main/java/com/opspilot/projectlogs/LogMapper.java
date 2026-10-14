package com.opspilot.projectlogs;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.connector.LogEntry;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.Project;
import com.opspilot.enums.ProviderType;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

/** Converts between the unified {@link LogEntry} and the stored {@link LogEntity}. */
public final class LogMapper {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<Map<String, String>> STRING_MAP = new TypeReference<>() { };
    private static final ZoneId ZONE = ZoneId.systemDefault();
    public static final int MAX_MESSAGE_CHARS = 8000;

    private LogMapper() {
    }

    public static LogEntity toEntity(LogEntry entry, Project projectRef, String fallbackSource) {
        LogEntity e = new LogEntity();
        e.setProject(projectRef);
        e.setIntegrationId(entry.getIntegrationId());
        e.setSourceType(entry.getSourceType() == null ? null : entry.getSourceType().name());
        e.setSourceService(sourceService(entry, fallbackSource));
        e.setLogLevel(entry.getLevel());
        String message = entry.getMessage() == null ? "" : entry.getMessage();
        e.setMessage(message.length() > MAX_MESSAGE_CHARS ? message.substring(0, MAX_MESSAGE_CHARS) + "…" : message);
        e.setTimestamp(LocalDateTime.ofInstant(entry.getTimestamp() == null ? Instant.now() : entry.getTimestamp(), ZONE));
        e.setMetadata(entry.getMetadata() == null || entry.getMetadata().isEmpty() ? null : write(entry.getMetadata()));
        return e;
    }

    public static LogEntry toEntry(LogEntity e) {
        LogEntry entry = new LogEntry();
        entry.setId(String.valueOf(e.getLogId()));
        entry.setProjectId(e.getProject() == null ? null : e.getProject().getId());
        entry.setIntegrationId(e.getIntegrationId());
        entry.setSourceType(parseType(e.getSourceType()));
        entry.setLevel(e.getLogLevel());
        entry.setMessage(e.getMessage());
        entry.setTimestamp(e.getTimestamp().atZone(ZONE).toInstant());
        Map<String, String> meta = e.getMetadata() == null ? new LinkedHashMap<>() : read(e.getMetadata());
        meta.putIfAbsent("source", e.getSourceService());
        entry.setMetadata(meta);
        return entry;
    }

    /** Most specific label available: container, pod, repo, job, then the fallback (integration name). */
    static String sourceService(LogEntry entry, String fallback) {
        Map<String, String> m = entry.getMetadata();
        for (String key : new String[]{"container", "pod", "repo", "job", "service"}) {
            if (m != null && m.get(key) != null && !m.get(key).isBlank()) {
                return m.get(key);
            }
        }
        return fallback == null || fallback.isBlank() ? "app" : fallback;
    }

    private static ProviderType parseType(String s) {
        try {
            return s == null ? null : ProviderType.valueOf(s);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String write(Map<String, String> map) {
        try {
            return JSON.writeValueAsString(map);
        } catch (Exception e) {
            return null;
        }
    }

    private static Map<String, String> read(String json) {
        try {
            return new LinkedHashMap<>(JSON.readValue(json, STRING_MAP));
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    /** JSON fragment that appears in the stored metadata column for key=value (used for LIKE filtering). */
    static String metadataFragment(String key, String value) {
        return write(Map.of(key, value)).replaceAll("^\\{|}$", "");
    }
}
