package com.opspilot.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.dto.AuthRequest;
import com.opspilot.dto.AuthResponse;
import com.opspilot.entity.RefreshToken;
import com.opspilot.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class RateLimitingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @BeforeEach
    public void setUp() {
        AuthResponse mockAuth = new AuthResponse("mock-token", 1L, "Test User", "rate.test@opspilot.io", Set.of("DEVELOPER"));
        RefreshToken mockRefresh = new RefreshToken("mock-refresh-token", null, Instant.now().plusSeconds(3600));

        Mockito.when(authService.login(any(AuthRequest.class))).thenReturn(mockAuth);
        Mockito.when(authService.createRefreshToken(any(Long.class))).thenReturn(mockRefresh);
    }

    @Test
    @DisplayName("Verify rate limiting triggers HTTP 429 after exceeding max login attempts from same IP")
    public void testRateLimitingTriggersAfterMaxAttempts() throws Exception {
        AuthRequest loginReq = new AuthRequest("rate.test@opspilot.io", "Password123!");
        String json = objectMapper.writeValueAsString(loginReq);

        // Perform 50 allowed requests
        for (int i = 0; i < 50; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json)
                            .header("X-Forwarded-For", "192.168.1.100"))
                    .andExpect(status().isOk());
        }

        // 51st request from same IP should be blocked with 429 Too Many Requests
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json)
                        .header("X-Forwarded-For", "192.168.1.100"))
                .andExpect(status().isTooManyRequests());
    }
}
