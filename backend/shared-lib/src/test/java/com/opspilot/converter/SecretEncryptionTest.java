package com.opspilot.converter;

import org.junit.jupiter.api.Test;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

/** Runs with opspilot.encryption.key set by surefire (see the parent pom). */
class SecretEncryptionTest {

    /** What older releases stored when no key was configured: GCM under the published dev key. */
    private static String underLegacyDevKey(String plaintext) throws Exception {
        byte[] iv = new byte[12];
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        byte[] key = MessageDigest.getInstance("SHA-256").digest(SecretEncryptionConverter.LEGACY_DEV_KEY.getBytes(StandardCharsets.UTF_8));
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, iv));
        byte[] enc = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        return SecretEncryptionConverter.PREFIX + Base64.getEncoder().encodeToString(ByteBuffer.allocate(12 + enc.length).put(iv).put(enc).array());
    }

    @Test
    void newValuesAreUnderTheConfiguredKeyAndNeedNoMigration() {
        String stored = SecretEncryptionConverter.encrypt("ghp_secret");

        assertFalse(stored.contains("ghp_secret"));
        assertEquals("ghp_secret", SecretEncryptionConverter.decrypt(stored));
        assertFalse(SecretEncryptionConverter.needsReencryption(stored));
    }

    @Test
    void valuesUnderTheOldDevKeyStillReadAndAreFlaggedForMigration() throws Exception {
        String old = underLegacyDevKey("ghp_old");

        assertEquals("ghp_old", SecretEncryptionConverter.decrypt(old));
        assertTrue(SecretEncryptionConverter.needsReencryption(old));
    }

    @Test
    void plaintextIsFlaggedForMigration() {
        assertTrue(SecretEncryptionConverter.needsReencryption("plain-token"));
        assertFalse(SecretEncryptionConverter.needsReencryption(""));
        assertFalse(SecretEncryptionConverter.needsReencryption(null));
    }

    @Test
    void refusesToRunWithoutAKey() {
        String previous = System.getProperty("opspilot.encryption.key");
        System.clearProperty("opspilot.encryption.key");
        try {
            if (System.getenv("OPSPILOT_ENCRYPTION_KEY") == null) {
                assertThrows(IllegalStateException.class, () -> SecretEncryptionConverter.encrypt("x"));
            }
        } finally {
            System.setProperty("opspilot.encryption.key", previous);
        }
    }

    @Test
    void jsonbConverterWritesTheNewFormatAndReadsTheLegacyOne() throws Exception {
        EncryptionConverter converter = new EncryptionConverter();

        String stored = converter.convertToDatabaseColumn("{\"token\":\"abc\"}");
        assertTrue(stored.startsWith("{\"enc\":\"enc:v1:"));
        assertFalse(stored.contains("abc"));
        assertEquals("{\"token\":\"abc\"}", converter.convertToEntityAttribute(stored));
        assertFalse(EncryptionConverter.needsReencryption(stored));

        String legacy = EncryptionConverter.legacyEncryptForTest("{\"token\":\"abc\"}");
        assertEquals("{\"token\":\"abc\"}", converter.convertToEntityAttribute(legacy));
        assertTrue(EncryptionConverter.needsReencryption(legacy));
        // Postgres reformats jsonb; the legacy value must still be found with different spacing.
        assertEquals("{\"token\":\"abc\"}", converter.convertToEntityAttribute(legacy.replace("\":\"", "\": \"")));
    }
}
