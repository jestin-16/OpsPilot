package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.ParsedLogLine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages bounded in-memory ring buffers per pod and container.
 * Enforces per-pod line caps so no single noisy pod can exhaust system memory.
 */
@Service
public class PodLogBufferManager {

    private final int maxLinesPerPod;
    // Map key: "namespace/pod" -> LogRingBuffer
    private final Map<String, LogRingBuffer> podBuffers = new ConcurrentHashMap<>();

    public PodLogBufferManager(@Value("${log-watcher.buffer-max-lines:5000}") int maxLinesPerPod) {
        this.maxLinesPerPod = maxLinesPerPod;
    }

    private String getBufferKey(String namespace, String pod) {
        return namespace + "/" + pod;
    }

    public LogRingBuffer getOrCreateBuffer(String namespace, String pod) {
        return podBuffers.computeIfAbsent(getBufferKey(namespace, pod), k -> new LogRingBuffer(maxLinesPerPod));
    }

    public void appendLog(String namespace, String pod, ParsedLogLine logLine) {
        getOrCreateBuffer(namespace, pod).append(logLine);
    }

    public List<ParsedLogLine> getLogs(String namespace, String pod, String container, String level, Instant since, int tail) {
        LogRingBuffer buffer = podBuffers.get(getBufferKey(namespace, pod));
        if (buffer == null) {
            return List.of();
        }
        return buffer.getFilteredLines(container, level, since, tail);
    }

    public long getErrorCount(String namespace, String pod, Instant since) {
        LogRingBuffer buffer = podBuffers.get(getBufferKey(namespace, pod));
        if (buffer == null) {
            return 0;
        }
        return buffer.countErrorsSince(since);
    }

    public int getBufferSize(String namespace, String pod) {
        LogRingBuffer buffer = podBuffers.get(getBufferKey(namespace, pod));
        return buffer != null ? buffer.size() : 0;
    }

    public void removePod(String namespace, String pod) {
        podBuffers.remove(getBufferKey(namespace, pod));
    }

    public int getMaxLinesPerPod() {
        return maxLinesPerPod;
    }

    public Map<String, LogRingBuffer> getAllBuffers() {
        return podBuffers;
    }

    public void clearAll() {
        podBuffers.clear();
    }
}
