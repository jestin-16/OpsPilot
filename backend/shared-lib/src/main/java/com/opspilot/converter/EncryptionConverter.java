package com.opspilot.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Converter
public class EncryptionConverter implements AttributeConverter<String, String> {

    // In a real app, this should be injected or fetched from a secure vault/env var.
    // For this demonstration, we use a hardcoded 16-byte key.
    private static final String ALGORITHM = "AES";
    private static final byte[] KEY = "OpsPilotSecretKy".getBytes(StandardCharsets.UTF_8);

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(KEY, ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            byte[] encryptedBytes = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            String base64Encrypted = Base64.getEncoder().encodeToString(encryptedBytes);
            // Store as valid JSON to satisfy JSONB column type
            return String.format("{\"encryptedData\": \"%s\"}", base64Encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            // Extract the encrypted base64 string from the JSON wrapper
            String prefix = "{\"encryptedData\": \"";
            if (!dbData.startsWith(prefix)) {
                return dbData; // Return as-is if it's not wrapped (e.g. legacy data)
            }
            int startIndex = prefix.length();
            int endIndex = dbData.lastIndexOf("\"}");
            String base64Encrypted = dbData.substring(startIndex, endIndex);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(KEY, ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(base64Encrypted));
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting attribute", e);
        }
    }
}
