package com.opspilot.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.opspilot.dto.AuthResponse;
import com.opspilot.dto.ProjectResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class SecurityPayloadTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    @DisplayName("Verify password_hash is never present in AuthResponse JSON payload")
    public void testAuthResponseDoesNotContainPasswordHash() throws Exception {
        AuthResponse authResponse = new AuthResponse(
                "mock-jwt-token-xyz",
                1L,
                "Alex Developer",
                "alex@opspilot.io",
                Set.of("DEVELOPER")
        );

        String jsonOutput = objectMapper.writeValueAsString(authResponse);

        assertFalse(jsonOutput.contains("password_hash"), "JSON output must NOT contain password_hash");
        assertFalse(jsonOutput.contains("passwordHash"), "JSON output must NOT contain passwordHash");
        assertFalse(jsonOutput.contains("password"), "JSON output must NOT contain password");
        assertTrue(jsonOutput.contains("token"), "JSON output must contain token");
    }

    @Test
    @DisplayName("Verify password_hash is never present in ProjectResponse JSON payload")
    public void testProjectResponseDoesNotContainPasswordHash() throws Exception {
        ProjectResponse projectResponse = new ProjectResponse(
                10L,
                "Order Gateway",
                "Order processing microservice",
                "https://github.com/opspilot/order-gateway",
                1L,
                "Alex Developer",
                "alex@opspilot.io",
                "Active",
                LocalDateTime.now()
        );

        String jsonOutput = objectMapper.writeValueAsString(projectResponse);

        assertFalse(jsonOutput.contains("password_hash"), "JSON output must NOT contain password_hash");
        assertFalse(jsonOutput.contains("passwordHash"), "JSON output must NOT contain passwordHash");
        assertFalse(jsonOutput.contains("password"), "JSON output must NOT contain password");
    }
}
