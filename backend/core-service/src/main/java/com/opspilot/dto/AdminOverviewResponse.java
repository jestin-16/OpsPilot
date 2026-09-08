package com.opspilot.dto;
public record AdminOverviewResponse(long userCount, long activeUserCount, long projectCount, long integrationCount, long auditEventCount) {}
