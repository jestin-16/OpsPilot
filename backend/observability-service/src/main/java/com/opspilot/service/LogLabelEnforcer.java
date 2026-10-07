package com.opspilot.service;

import com.opspilot.logstore.LogStore.LogLine;
import com.opspilot.logstore.LogStore.LogStream;
import com.opspilot.security.ingest.IngestPrincipal;
import com.opspilot.service.LokiPushParser.RawLine;
import com.opspilot.service.LokiPushParser.RawStream;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Rebuilds every stream with exactly four labels - project, environment, source, container - taken from the
 * authenticated source record. Client-supplied labels are discarded; only a sanitised container hint is read from them.
 */
@Component
public class LogLabelEnforcer {

    public static final String PROJECT = "project";
    public static final String ENVIRONMENT = "environment";
    public static final String SOURCE = "source";
    public static final String CONTAINER = "container";

    static final int MAX_LINE_BYTES = 64 * 1024;
    static final int MAX_CONTAINER_LENGTH = 128;
    static final Duration MAX_AGE = Duration.ofDays(6);
    static final Duration MAX_FUTURE = Duration.ofMinutes(10);
    private static final String[] CONTAINER_HINTS = {"container", "container_name", "service_name"};

    public List<LogStream> enforce(IngestPrincipal principal, List<RawStream> raw, Instant now) {
        long minNanos = toNanos(now.minus(MAX_AGE));
        long maxNanos = toNanos(now.plus(MAX_FUTURE));
        Map<String, List<LogLine>> byContainer = new LinkedHashMap<>();
        for (RawStream stream : raw) {
            String container = containerOf(stream.labels());
            for (RawLine l : stream.lines()) {
                if (l.tsNanos() < minNanos || l.tsNanos() > maxNanos) continue;
                String line = truncate(l.line());
                if (line.isEmpty()) continue;
                byContainer.computeIfAbsent(container, k -> new ArrayList<>()).add(new LogLine(l.tsNanos(), line));
            }
        }
        List<LogStream> out = new ArrayList<>();
        for (Map.Entry<String, List<LogLine>> e : byContainer.entrySet()) {
            e.getValue().sort(Comparator.comparingLong(LogLine::tsNanos));
            out.add(new LogStream(labelsFor(principal, e.getKey()), e.getValue()));
        }
        return out;
    }

    public Map<String, String> labelsFor(IngestPrincipal p, String container) {
        Map<String, String> labels = new LinkedHashMap<>();
        labels.put(PROJECT, String.valueOf(p.projectId()));
        labels.put(ENVIRONMENT, p.environment());
        labels.put(SOURCE, p.sourceId().toString());
        labels.put(CONTAINER, container);
        return labels;
    }

    static String containerOf(Map<String, String> clientLabels) {
        for (String hint : CONTAINER_HINTS) {
            String v = clientLabels.get(hint);
            if (v != null) {
                String s = sanitizeContainer(v);
                if (!s.isEmpty()) return s;
            }
        }
        return "unknown";
    }

    static String sanitizeContainer(String raw) {
        String s = raw.startsWith("/") ? raw.substring(1) : raw;
        s = s.replaceAll("[^A-Za-z0-9_.-]", "_");
        return s.length() > MAX_CONTAINER_LENGTH ? s.substring(0, MAX_CONTAINER_LENGTH) : s;
    }

    private static String truncate(String line) {
        if (line == null) return "";
        return line.length() > MAX_LINE_BYTES ? line.substring(0, MAX_LINE_BYTES) : line;
    }

    private static long toNanos(Instant i) {
        return i.getEpochSecond() * 1_000_000_000L + i.getNano();
    }
}
