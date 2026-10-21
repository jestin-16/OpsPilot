package com.opspilot.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption for secrets stored at rest (tokens, webhook secrets).
 * The key is derived (SHA-256) from OPSPILOT_ENCRYPTION_KEY (or the opspilot.encryption.key system property,
 * which tests use); there is no built-in fallback. Stored format: "enc:v1:" + base64(iv || ciphertext).
 * Values without the prefix are legacy plaintext; values written before the key was required may be under
 * the old public dev key. Both are still read, and LegacySecretReencryption rewrites them at startup.
 */
@Converter
public class SecretEncryptionConverter implements AttributeConverter<String, String> {

    static final String PREFIX = "enc:v1:";
    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** The key older releases fell back to when none was configured. Published in the repo, so read-only. */
    static final String LEGACY_DEV_KEY = "opspilot-dev-only-insecure-key";

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return decrypt(dbData);
    }

    public static String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(configuredKey()), new GCMParameterSpec(TAG_BITS, iv));
            byte[] enc = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buf = ByteBuffer.allocate(iv.length + enc.length).put(iv).put(enc);
            return PREFIX + Base64.getEncoder().encodeToString(buf.array());
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to encrypt secret", e);
        }
    }

    public static String decrypt(String dbData) {
        if (dbData == null || !dbData.startsWith(PREFIX)) {
            return dbData;
        }
        byte[] all = Base64.getDecoder().decode(dbData.substring(PREFIX.length()));
        try {
            return decryptWith(configuredKey(), all);
        } catch (AEADBadTagException wrongKey) {
            try {
                return decryptWith(LEGACY_DEV_KEY, all);
            } catch (Exception e) {
                throw new IllegalStateException("Unable to decrypt secret (wrong OPSPILOT_ENCRYPTION_KEY?)", wrongKey);
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to decrypt secret", e);
        }
    }

    /** True for stored values that are plaintext or under the legacy dev key, i.e. not protected by the configured key. */
    public static boolean needsReencryption(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return false;
        }
        if (!dbData.startsWith(PREFIX)) {
            return true;
        }
        byte[] all = Base64.getDecoder().decode(dbData.substring(PREFIX.length()));
        try {
            decryptWith(configuredKey(), all);
            return false;
        } catch (AEADBadTagException wrongKey) {
            return true;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to read stored secret", e);
        }
    }

    /** OPSPILOT_ENCRYPTION_KEY, or the opspilot.encryption.key system property; refuses to run without one. */
    public static String configuredKey() {
        String raw = System.getenv("OPSPILOT_ENCRYPTION_KEY");
        if (raw == null || raw.isBlank()) {
            raw = System.getProperty("opspilot.encryption.key");
        }
        if (raw == null || raw.isBlank()) {
            throw new IllegalStateException(
                    "OPSPILOT_ENCRYPTION_KEY is not set. It encrypts stored credentials; generate one with: openssl rand -base64 32");
        }
        if (raw.equals(LEGACY_DEV_KEY)) {
            throw new IllegalStateException("OPSPILOT_ENCRYPTION_KEY must not be the published dev key");
        }
        return raw;
    }

    private static String decryptWith(String rawKey, byte[] all) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(rawKey), new GCMParameterSpec(TAG_BITS, all, 0, IV_LENGTH));
        return new String(cipher.doFinal(all, IV_LENGTH, all.length - IV_LENGTH), StandardCharsets.UTF_8);
    }

    private static SecretKeySpec key(String raw) throws Exception {
        return new SecretKeySpec(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)), "AES");
    }
}
