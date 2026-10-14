package com.opspilot.projectlogs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.connector.Levels;
import com.opspilot.connector.LogEntry;
import com.opspilot.enums.ProviderType;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Accepts what applications actually send: a JSON object, a JSON array, {"logs": [...]}, NDJSON, or plain text with one
 * entry per line. Field names are matched leniently (message/msg/log, level/severity/levelname, timestamp/time/ts/@timestamp).
 */
public final class IngestPayloadParser {

    public record Result(List<LogEntry> entries, int rejected) { }

    private static final ObjectMapper JSON = new ObjectMapper();
    /** Refuses trailing content so NDJSON is not mistaken for one document (readTree would silently stop after the first line). */
    private static final com.fasterxml.jackson.databind.ObjectReader SINGLE_DOCUMENT =
            JSON.readerFor(JsonNode.class).with(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_TRAILING_TOKENS);
    private static final List<String> MESSAGE_KEYS = List.of("message", "msg", "log", "text");
    private static final List<String> LEVEL_KEYS = List.of("level", "severity", "levelname", "log_level");
    private static final List<String> TIME_KEYS = List.of("timestamp", "time", "ts", "@timestamp", "asctime");
    private static final int MAX_META_KEYS = 20;
    private static final int MAX_META_VALUE = 256;

    private IngestPayloadParser() {
    }

    public static Result parse(byte[] body, String contentType, int maxEntries) {
        String text = new String(body, StandardCharsets.UTF_8);
        boolean json = contentType != null && contentType.toLowerCase().contains("json");
        List<LogEntry> out = new ArrayList<>();
        int rejected = 0;
        try {
            if (json) {
                String trimmed = text.strip();
                if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                    try {
                        rejected += collect(SINGLE_DOCUMENT.readTree(trimmed), out, maxEntries);
                        return new Result(out, rejected);
                    } catch (Exception notSingleDocument) {
                        out.clear(); // maybe NDJSON
                        rejected = 0;
                    }
                }
                for (String line : text.split("\\R")) {
                    if (line.isBlank()) continue;
                    try {
                        rejected += collect(JSON.readTree(line), out, maxEntries);
                    } catch (Exception e) {
                        rejected++;
                    }
                }
                return new Result(out, rejected);
            }
        } catch (RuntimeException e) {
            return new Result(out, rejected + 1);
        }
        for (String line : text.split("\\R")) {
            if (line.isBlank()) continue;
            if (out.size() >= maxEntries) {
                rejected++;
                continue;
            }
            out.add(entry(line, null, null, new LinkedHashMap<>()));
        }
        return new Result(out, rejected);
    }

    private static int collect(JsonNode node, List<LogEntry> out, int max) {
        int rejected = 0;
        if (node.isArray()) {
            for (JsonNode n : node) rejected += collect(n, out, max);
        } else if (node.isObject() && node.has("logs") && node.get("logs").isArray() && firstOf(node, MESSAGE_KEYS) == null) {
            for (JsonNode n : node.get("logs")) rejected += collect(n, out, max);
        } else if (node.isObject()) {
            String message = firstOf(node, MESSAGE_KEYS);
            if (message == null || out.size() >= max) {
                return 1;
            }
            Map<String, String> meta = new LinkedHashMap<>();
            for (JsonNode m : new JsonNode[]{node.get("metadata"), node.get("labels"), node.get("extra")}) {
                if (m != null && m.isObject()) flatten(m, meta);
            }
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext() && meta.size() < MAX_META_KEYS) {
                Map.Entry<String, JsonNode> f = fields.next();
                String k = f.getKey();
                if (MESSAGE_KEYS.contains(k) || LEVEL_KEYS.contains(k) || TIME_KEYS.contains(k)
                        || k.equals("metadata") || k.equals("labels") || k.equals("extra") || !f.getValue().isValueNode()) {
                    continue;
                }
                meta.putIfAbsent(k, cap(f.getValue().asText()));
            }
            String time = firstOf(node, TIME_KEYS);
            out.add(entry(message, firstOf(node, LEVEL_KEYS), time, meta));
        } else {
            return 1;
        }
        return rejected;
    }

    private static LogEntry entry(String message, String level, String time, Map<String, String> meta) {
        LogEntry e = LogEntry.of(ProviderType.APP_LOGS, level != null ? level : Levels.detect(message), message, parseTime(time), meta);
        return e;
    }

    private static void flatten(JsonNode obj, Map<String, String> into) {
        Iterator<Map.Entry<String, JsonNode>> it = obj.fields();
        while (it.hasNext() && into.size() < MAX_META_KEYS) {
            Map.Entry<String, JsonNode> f = it.next();
            into.put(f.getKey(), cap(f.getValue().isValueNode() ? f.getValue().asText() : f.getValue().toString()));
        }
    }

    private static String firstOf(JsonNode node, List<String> keys) {
        for (String k : keys) {
            JsonNode v = node.get(k);
            if (v != null && !v.isNull() && v.isValueNode() && !v.asText().isBlank()) return v.asText();
        }
        return null;
    }

    static Instant parseTime(String raw) {
        if (raw == null) return Instant.now();
        try {
            double n = Double.parseDouble(raw);
            // epoch seconds (with fraction) or milliseconds
            return n > 1e11 ? Instant.ofEpochMilli((long) n) : Instant.ofEpochMilli((long) (n * 1000));
        } catch (NumberFormatException ignored) {
            // not numeric
        }
        try {
            return Instant.parse(raw);
        } catch (DateTimeParseException ignored) {
            // try offset form
        }
        try {
            return OffsetDateTime.parse(raw).toInstant();
        } catch (DateTimeParseException ignored) {
            return Instant.now();
        }
    }

    private static String cap(String s) {
        return s.length() > MAX_META_VALUE ? s.substring(0, MAX_META_VALUE) : s;
    }
}
