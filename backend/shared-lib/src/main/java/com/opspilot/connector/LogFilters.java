package com.opspilot.connector;

import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Filters shared by history queries and live streams. Selectors narrow the source (container, namespace, pod ...). */
public class LogFilters {

    public static final int DEFAULT_PAGE_SIZE = 100;
    public static final int MAX_PAGE_SIZE = 1000;

    private String level;
    private Instant from;
    private Instant to;
    private String query;
    private int pageSize = DEFAULT_PAGE_SIZE;
    private final Map<String, String> selectors = new HashMap<>();

    public static LogFilters none() {
        return new LogFilters();
    }

    public LogFilters level(String level) { this.level = level == null || level.isBlank() ? null : Levels.normalize(level); return this; }
    public LogFilters from(Instant from) { this.from = from; return this; }
    public LogFilters to(Instant to) { this.to = to; return this; }
    public LogFilters query(String query) { this.query = query == null || query.isBlank() ? null : query; return this; }
    public LogFilters pageSize(int pageSize) { this.pageSize = Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE)); return this; }
    public LogFilters selector(String key, String value) {
        if (value != null && !value.isBlank()) selectors.put(key, value);
        return this;
    }

    public String getLevel() { return level; }
    public Instant getFrom() { return from; }
    public Instant getTo() { return to; }
    public String getQuery() { return query; }
    public int getPageSize() { return pageSize; }
    public Map<String, String> getSelectors() { return selectors; }
    public String selector(String key) { return selectors.get(key); }

    /** True when the entry passes level / time / text filters (selectors are applied by the connector). */
    public boolean matches(LogEntry e) {
        if (level != null && !level.equalsIgnoreCase(e.getLevel())) return false;
        if (from != null && e.getTimestamp() != null && e.getTimestamp().isBefore(from)) return false;
        if (to != null && e.getTimestamp() != null && e.getTimestamp().isAfter(to)) return false;
        if (query != null) {
            String q = query.toLowerCase(Locale.ROOT);
            return e.getMessage() != null && e.getMessage().toLowerCase(Locale.ROOT).contains(q);
        }
        return true;
    }
}
