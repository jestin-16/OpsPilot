package com.opspilot.logstore;

import java.util.Collection;
import java.util.UUID;
import java.util.stream.Collectors;

public final class PromQlBuilder {

    private PromQlBuilder() {}

    public record Filter(Collection<Long> projectIds, Collection<UUID> sourceIds) {}

    public static String buildCpuQuery(Filter f, int timeWindowMinutes) {
        String matchers = buildMatchers(f);
        // Average CPU usage percentage over time window
        return String.format("avg(rate(container_cpu_usage_seconds_total{%s}[%dm])) * 100", matchers, timeWindowMinutes);
    }

    public static String buildMemoryQuery(Filter f) {
        String matchers = buildMatchers(f);
        // Average memory usage in bytes
        return String.format("avg(container_memory_usage_bytes{%s})", matchers);
    }

    private static String buildMatchers(Filter f) {
        if (f.projectIds() == null || f.projectIds().isEmpty() || f.sourceIds() == null || f.sourceIds().isEmpty()) {
            throw new IllegalArgumentException("Query scope must contain at least one project and source");
        }
        StringBuilder q = new StringBuilder();
        q.append(matcher("project", f.projectIds().stream().map(String::valueOf).collect(Collectors.toCollection(java.util.TreeSet::new))));
        q.append(',');
        q.append(matcher("source", f.sourceIds().stream().map(UUID::toString).collect(Collectors.toCollection(java.util.TreeSet::new))));
        return q.toString();
    }

    private static String matcher(String label, Collection<String> values) {
        for (String v : values) {
            if (!v.matches("^[0-9a-fA-F-]+$")) throw new IllegalArgumentException("Invalid " + label + " value");
        }
        return values.size() == 1
                ? label + "=\"" + values.iterator().next() + "\""
                : label + "=~\"" + String.join("|", values) + "\"";
    }
}
