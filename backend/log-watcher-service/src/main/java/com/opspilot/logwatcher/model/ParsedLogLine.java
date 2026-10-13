package com.opspilot.logwatcher.model;

import java.time.Instant;
import java.util.Objects;

public class ParsedLogLine {
    private String timestamp;
    private Instant parsedTimestamp;
    private String namespace;
    private String pod;
    private String container;
    private String level;
    private String message;
    private String raw;

    public ParsedLogLine() {
    }

    public ParsedLogLine(String timestamp, Instant parsedTimestamp, String namespace, String pod, String container, String level, String message, String raw) {
        this.timestamp = timestamp;
        this.parsedTimestamp = parsedTimestamp;
        this.namespace = namespace;
        this.pod = pod;
        this.container = container;
        this.level = level;
        this.message = message;
        this.raw = raw;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Instant getParsedTimestamp() {
        return parsedTimestamp;
    }

    public void setParsedTimestamp(Instant parsedTimestamp) {
        this.parsedTimestamp = parsedTimestamp;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getPod() {
        return pod;
    }

    public void setPod(String pod) {
        this.pod = pod;
    }

    public String getContainer() {
        return container;
    }

    public void setContainer(String container) {
        this.container = container;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRaw() {
        return raw;
    }

    public void setRaw(String raw) {
        this.raw = raw;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ParsedLogLine that = (ParsedLogLine) o;
        return Objects.equals(timestamp, that.timestamp) &&
                Objects.equals(namespace, that.namespace) &&
                Objects.equals(pod, that.pod) &&
                Objects.equals(container, that.container) &&
                Objects.equals(level, that.level) &&
                Objects.equals(message, that.message);
    }

    @Override
    public int hashCode() {
        return Objects.hash(timestamp, namespace, pod, container, level, message);
    }

    @Override
    public String toString() {
        return String.format("[%s] [%s/%s/%s] [%s] %s", timestamp, namespace, pod, container, level, message);
    }
}
