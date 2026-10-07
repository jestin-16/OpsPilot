package com.opspilot.dto;

import java.time.Instant;
import java.util.List;

/** Normalised result of a log query. Entries are newest first. */
public record LogQueryResponse(List<Entry> entries, int count, int limit, boolean truncated, Instant from, Instant to) {

    public record Entry(Instant timestamp, String tsNanos, String level, String message, Long projectId,
                        String environment, String sourceId, String sourceName, String container) {
    }
}
