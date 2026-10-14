package com.opspilot.security.ingest;

/** Identity of an application authenticated with an APP_LOGS integration's ingest token. Comes from the stored record. */
public record ProjectIngestPrincipal(Long projectId, Long integrationId, String integrationName) {
}
