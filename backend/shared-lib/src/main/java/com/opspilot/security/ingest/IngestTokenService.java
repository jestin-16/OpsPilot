package com.opspilot.security.ingest;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** Generates and verifies per-source ingest tokens. Raw tokens are never stored; only their SHA-256 hash. */
@Service
public class IngestTokenService {

    public static final String PREFIX = "opl_";
    public static final int DISPLAY_PREFIX_LENGTH = 12;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** "opl_" + 32 random bytes, URL-safe base64. */
    public String generate() {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        return PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    /** Lowercase hex SHA-256 of the raw token. */
    public String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /** Short, non-secret identifier shown in the UI (e.g. "opl_AbCd1234"). */
    public String displayPrefix(String token) {
        return token.substring(0, Math.min(DISPLAY_PREFIX_LENGTH, token.length()));
    }

    /** Constant-time comparison of a presented raw token against a stored hash. */
    public boolean matches(String presentedToken, String storedHash) {
        if (presentedToken == null || storedHash == null) return false;
        return MessageDigest.isEqual(
                hash(presentedToken).getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8));
    }
}
