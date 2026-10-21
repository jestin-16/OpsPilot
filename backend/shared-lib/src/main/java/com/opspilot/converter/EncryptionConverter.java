package com.opspilot.converter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Encrypts a secret held in a JSONB column (log_sources.auth_config). Writes {"enc": "enc:v1:..."} using
 * SecretEncryptionConverter (AES-256-GCM under OPSPILOT_ENCRYPTION_KEY). Still reads the legacy
 * {"encryptedData": ...} format, AES/ECB under a key that was hardcoded in this class, so existing rows keep
 * working until LegacySecretReencryption rewrites them; that key is public and is never used to write.
 */
@Converter
public class EncryptionConverter implements AttributeConverter<String, String> {

    private static final ObjectMapper JSON = new ObjectMapper();
    static final String FIELD = "enc";
    static final String LEGACY_FIELD = "encryptedData";
    private static final byte[] LEGACY_ECB_KEY = "OpsPilotSecretKy".getBytes(StandardCharsets.UTF_8);

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return JSON.writeValueAsString(Map.of(FIELD, SecretEncryptionConverter.encrypt(attribute)));
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Error encrypting attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        JsonNode node;
        try {
            node = JSON.readTree(dbData);
        } catch (Exception e) {
            return dbData; // not JSON: legacy plaintext
        }
        if (node.hasNonNull(FIELD)) {
            return SecretEncryptionConverter.decrypt(node.get(FIELD).asText());
        }
        if (node.hasNonNull(LEGACY_FIELD)) {
            return decryptLegacy(node.get(LEGACY_FIELD).asText());
        }
        return dbData;
    }

    /** True when the stored value is not under the configured key (legacy ECB format, old dev key, or plaintext). */
    public static boolean needsReencryption(String dbData) {
        if (dbData == null) {
            return false;
        }
        try {
            JsonNode node = JSON.readTree(dbData);
            if (node.hasNonNull(FIELD)) {
                return SecretEncryptionConverter.needsReencryption(node.get(FIELD).asText());
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            return true; // not JSON: plaintext
        }
        return true;
    }

    static String decryptLegacy(String base64) {
        try {
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(LEGACY_ECB_KEY, "AES"));
            return new String(cipher.doFinal(Base64.getDecoder().decode(base64)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Error decrypting legacy attribute", e);
        }
    }

    /** Only for tests: produces the legacy format to prove it can still be read. */
    static String legacyEncryptForTest(String plaintext) throws Exception {
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(LEGACY_ECB_KEY, "AES"));
        return JSON.writeValueAsString(Map.of(LEGACY_FIELD,
                Base64.getEncoder().encodeToString(cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8)))));
    }
}
