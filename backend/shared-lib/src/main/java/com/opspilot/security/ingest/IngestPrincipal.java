package com.opspilot.security.ingest;

import java.util.UUID;

/** Identity of an authenticated ingest agent. Everything here comes from the stored source record, never from the request. */
public record IngestPrincipal(UUID sourceId, Long projectId, String environment, String sourceName) {
}
