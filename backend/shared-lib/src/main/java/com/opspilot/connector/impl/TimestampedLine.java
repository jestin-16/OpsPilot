package com.opspilot.connector.impl;

import java.time.Instant;
import java.time.format.DateTimeParseException;

/** Splits "2024-05-01T10:00:00.123456789Z message" (Docker / Kubernetes timestamps=true) into its parts. */
public record TimestampedLine(Instant timestamp, String message) {

    public static TimestampedLine parse(String line) {
        if (line == null) {
            return new TimestampedLine(Instant.now(), "");
        }
        int space = line.indexOf(' ');
        if (space > 19 && line.charAt(4) == '-' && line.charAt(10) == 'T') {
            try {
                return new TimestampedLine(Instant.parse(line.substring(0, space)), line.substring(space + 1));
            } catch (DateTimeParseException ignored) {
                // not a timestamp prefix; fall through
            }
        }
        return new TimestampedLine(Instant.now(), line);
    }
}
