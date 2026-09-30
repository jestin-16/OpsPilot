package com.opspilot.dto;

import java.time.Instant;
import java.util.List;

public record IntegrationHealthResponse(String overallStatus, List<IntegrationStatus> integrations) {
    public record IntegrationStatus(String provider, boolean enabled, String status,
                                     String message, Instant checkedAt) {
    }
}