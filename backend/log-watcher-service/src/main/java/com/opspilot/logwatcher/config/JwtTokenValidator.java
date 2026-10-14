package com.opspilot.logwatcher.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

@Component
public class JwtTokenValidator {

    private final String jwtSecret;

    /** HS256 needs a key of at least 256 bits. */
    static final int MIN_SECRET_BYTES = 32;

    public JwtTokenValidator(@Value("${app.jwt.secret:}") String jwtSecret,
                             @Value("${app.auth.enabled:true}") boolean authEnabled) {
        // The secret is only needed when requests are authenticated (AUTH_ENABLED=false is for local runs).
        if (authEnabled) {
            if (jwtSecret == null || jwtSecret.isBlank()) {
                throw new IllegalStateException(
                        "JWT_SECRET is not set. Use the same value as the other OpsPilot services, or set AUTH_ENABLED=false");
            }
            if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
                throw new IllegalStateException("JWT_SECRET must be at least " + MIN_SECRET_BYTES + " bytes long");
            }
        }
        this.jwtSecret = jwtSecret;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            Object rolesObj = claims.get("roles");
            if (rolesObj instanceof List<?>) {
                return (List<String>) rolesObj;
            }
        } catch (Exception ignored) {
        }
        return Collections.emptyList();
    }
}
