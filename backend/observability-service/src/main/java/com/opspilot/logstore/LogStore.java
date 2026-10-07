package com.opspilot.logstore;

import java.util.List;

/** Backend log storage. Loki is the only implementation. */
public interface LogStore {

    /** One log line; {@code tsNanos} is nanoseconds since the Unix epoch. */
    record LogLine(long tsNanos, String line) {
    }

    /** A labelled stream of lines. Labels must already be server-enforced. */
    record LogStream(java.util.Map<String, String> labels, List<LogLine> lines) {
    }

    boolean isEnabled();

    /** Runs a store-native query over [start, end] and returns streams, newest first within each stream. */
    List<LogStream> query(String query, java.time.Instant start, java.time.Instant end, int limit);

    /** Persists the streams. Throws {@link LogStoreException} if the store rejects or cannot be reached. */
    void push(List<LogStream> streams);

    class LogStoreException extends RuntimeException {
        private final boolean clientError;

        public LogStoreException(String message, boolean clientError, Throwable cause) {
            super(message, cause);
            this.clientError = clientError;
        }

        /** True when the store rejected the data itself (4xx), so retrying the same batch is pointless. */
        public boolean isClientError() {
            return clientError;
        }
    }
}
