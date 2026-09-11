package com.opspilot.dto;

import java.time.Instant;
import java.util.List;

public record IntegrationHealthResponse(List<IntegrationStatus> integrations) {
    public record IntegrationStatus(String name, boolean enabled, boolean available, String status,
                                     String error, Instant checkedAt) {
    }
}