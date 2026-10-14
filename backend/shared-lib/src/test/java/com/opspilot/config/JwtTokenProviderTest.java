package com.opspilot.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-that-is-comfortably-longer-than-32-bytes";

    private static JwtTokenProvider provider(String secret) {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", secret);
        ReflectionTestUtils.setField(provider, "jwtExpirationMs", 60_000L);
        return provider;
    }

    @Test
    void refusesToStartWithoutASecret() {
        assertThrows(IllegalStateException.class, () -> provider("").requireSecret());
        assertThrows(IllegalStateException.class, () -> provider(null).requireSecret());
    }

    @Test
    void refusesASecretTooShortForHs256() {
        assertThrows(IllegalStateException.class, () -> provider("only-31-bytes-long-xxxxxxxxxxxx").requireSecret());
    }

    @Test
    void issuesAndValidatesTokensWithAConfiguredSecret() {
        JwtTokenProvider provider = provider(SECRET);
        provider.requireSecret();

        String token = provider.generateTokenFromEmail("dev@example.com", List.of("ROLE_DEVELOPER"));

        assertTrue(provider.validateToken(token));
        assertEquals("dev@example.com", provider.getEmailFromToken(token));
    }

    @Test
    void rejectsTokensSignedWithADifferentSecret() {
        String foreign = provider("another-secret-that-is-also-longer-than-32-bytes")
                .generateTokenFromEmail("dev@example.com", List.of("ROLE_ADMIN"));

        assertFalse(provider(SECRET).validateToken(foreign));
    }
}
