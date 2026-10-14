package com.opspilot.config;

import java.nio.charset.StandardCharsets;

/** Startup check for the HMAC secret that signs access tokens. */
public final class JwtSecrets {

    /** HS256 needs a key of at least 256 bits. */
    static final int MIN_BYTES = 32;

    private JwtSecrets() {
    }

    public static void requireStrong(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET is not set. Every OpsPilot service needs the same value; generate one with: openssl rand -base64 48");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_BYTES) {
            throw new IllegalStateException("JWT_SECRET must be at least " + MIN_BYTES + " bytes long");
        }
    }
}
