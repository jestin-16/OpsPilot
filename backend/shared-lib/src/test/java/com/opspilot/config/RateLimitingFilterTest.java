package com.opspilot.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class RateLimitingFilterTest {

    private final RateLimitingFilter filter = new RateLimitingFilter();

    private static MockHttpServletRequest login(String forwardedFor) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("10.0.0.2"); // the API gateway
        if (forwardedFor != null) {
            request.addHeader("X-Forwarded-For", forwardedFor);
        }
        return request;
    }

    @Test
    void usesTheAddressTheGatewayAppendedNotOneTheClientSupplied() {
        assertEquals("203.0.113.7", filter.getClientIP(login("1.2.3.4, 203.0.113.7")));
        assertEquals("203.0.113.7", filter.getClientIP(login("203.0.113.7")));
        assertEquals("10.0.0.2", filter.getClientIP(login(null)));
    }

    @Test
    void spoofingXForwardedForDoesNotResetTheLimit() throws Exception {
        int status = 0;
        for (int i = 0; i <= 50; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            // A new forged left-most address on every attempt, but the same real client on the right.
            filter.doFilter(login("198.51.100." + i + ", 203.0.113.7"), response, mock(FilterChain.class));
            status = response.getStatus();
        }

        assertEquals(429, status, "the 51st attempt from one client is refused");
    }
}
