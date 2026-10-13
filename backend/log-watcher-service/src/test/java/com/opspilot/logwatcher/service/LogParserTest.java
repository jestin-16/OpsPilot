package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.ParsedLogLine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class LogParserTest {

    private LogParser logParser;

    @BeforeEach
    void setUp() {
        logParser = new LogParser(true); // masking enabled
    }

    @Test
    @DisplayName("Should parse Kubernetes RFC3339 timestamp and message")
    void testParseK8sTimestamp() {
        String raw = "2026-10-13T12:34:56.789123Z [INFO] django.server: \"GET /api/v1/health HTTP/1.1\" 200 45";
        ParsedLogLine line = logParser.parse(raw, "default", "django-app-7c9d5-abcd", "django");

        assertEquals("2026-10-13T12:34:56.789123Z", line.getTimestamp());
        assertEquals(Instant.parse("2026-10-13T12:34:56.789123Z"), line.getParsedTimestamp());
        assertEquals("default", line.getNamespace());
        assertEquals("django-app-7c9d5-abcd", line.getPod());
        assertEquals("django", line.getContainer());
        assertEquals("INFO", line.getLevel());
        assertEquals("[INFO] django.server: \"GET /api/v1/health HTTP/1.1\" 200 45", line.getMessage());
    }

    @Test
    @DisplayName("Should detect ERROR level for exceptions, tracebacks and 500 status codes")
    void testDetectErrorLevel() {
        ParsedLogLine l1 = logParser.parse("2026-10-13T12:00:00Z Traceback (most recent call last):", "default", "django", "django");
        assertEquals("ERROR", l1.getLevel());

        ParsedLogLine l2 = logParser.parse("2026-10-13T12:00:00Z django.request: Internal Server Error: /api/checkout", "default", "django", "django");
        assertEquals("ERROR", l2.getLevel());

        ParsedLogLine l3 = logParser.parse("2026-10-13T12:00:00Z FATAL: could not connect to database at postgres:5432", "default", "django", "django");
        assertEquals("ERROR", l3.getLevel());

        ParsedLogLine l4 = logParser.parse("2026-10-13T12:00:00Z psycopg2.OperationalError: server closed the connection unexpectedly", "default", "django", "django");
        assertEquals("ERROR", l4.getLevel());
    }

    @Test
    @DisplayName("Should detect WARN, DEBUG and fallback to INFO")
    void testDetectOtherLevels() {
        ParsedLogLine warn = logParser.parse("2026-10-13T12:00:00Z [WARNING] Deprecated setting detected in settings.py", "default", "django", "django");
        assertEquals("WARN", warn.getLevel());

        ParsedLogLine debug = logParser.parse("2026-10-13T12:00:00Z [DEBUG] Query execution time: 1.2ms", "default", "django", "django");
        assertEquals("DEBUG", debug.getLevel());

        ParsedLogLine info = logParser.parse("2026-10-13T12:00:00Z Application started successfully on 0.0.0.0:8000", "default", "django", "django");
        assertEquals("INFO", info.getLevel());
    }

    @Test
    @DisplayName("Should mask passwords, bearer tokens and API keys")
    void testMaskSensitiveData() {
        String logWithSecrets = "Connecting with password=super_secret_db_pass and api_key=ak_live_987654321 with Bearer eyJhbGciOiJIUzI1NiJ9.test";
        String masked = logParser.maskSensitiveData(logWithSecrets);

        assertFalse(masked.contains("super_secret_db_pass"));
        assertFalse(masked.contains("ak_live_987654321"));
        assertFalse(masked.contains("eyJhbGciOiJIUzI1NiJ9.test"));
        assertTrue(masked.contains("***REDACTED***"));
    }

    @Test
    @DisplayName("Should handle missing timestamps gracefully")
    void testMissingTimestamp() {
        String raw = "Simple un-timestamped raw stdout line";
        ParsedLogLine line = logParser.parse(raw, "prod", "my-pod", "my-container");

        assertNotNull(line.getTimestamp());
        assertNotNull(line.getParsedTimestamp());
        assertEquals("Simple un-timestamped raw stdout line", line.getMessage());
    }
}
