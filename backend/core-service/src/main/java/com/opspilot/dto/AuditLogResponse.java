package com.opspilot.dto;
import java.time.LocalDateTime;
public record AuditLogResponse(Long id, String actorName, String actorEmail, String action, String resourceType, String resourceId, String details, LocalDateTime timestamp) {}
