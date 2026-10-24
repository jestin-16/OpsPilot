package com.opspilot.logwatcher.model;

import java.time.Instant;

public record WatcherStatusDto(
        boolean connected,
        String message,
        Instant lastConnectedAt,
        String namespace,
        boolean enabled
) {
    public WatcherStatusDto(boolean connected, String message, Instant lastConnectedAt, String namespace) {
        this(connected, message, lastConnectedAt, namespace, true);
    }
}
