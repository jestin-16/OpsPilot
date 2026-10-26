package com.opspilot.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import java.net.URI;
import java.util.Set;

/** Validation for dynamic provider settings and forms that do not use a typed DTO. */
public final class FormChecks {
    private static final ObjectMapper JSON = new ObjectMapper().enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS);
    private FormChecks() {}

    public static String resourceName(String value, String label) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(label + " is required");
        String name = value.trim();
        if (name.length() > 100 || !name.matches(ValidationRules.RESOURCE_NAME)) {
            throw new IllegalArgumentException(label + " must be 100 characters or fewer and use letters, numbers, spaces or name punctuation");
        }
        return name;
    }

    public static void text(String value, String label, int max) {
        if (value != null && (value.length() > max || !value.matches(ValidationRules.MULTILINE_TEXT))) {
            throw new IllegalArgumentException(label + " is too long or contains control characters");
        }
    }

    public static void endpoint(String value, String label, boolean allowTcp) {
        if (value == null || value.isBlank()) return;
        try {
            URI uri = URI.create(value);
            Set<String> protocols = allowTcp ? Set.of("http", "https", "tcp") : Set.of("http", "https");
            if (value.length() > 2048 || value.matches("(?s).*[\\s\\\\\\p{Cc}].*") || uri.getScheme() == null
                    || !protocols.contains(uri.getScheme().toLowerCase(java.util.Locale.ROOT))
                    || uri.getHost() == null || uri.getRawUserInfo() != null || uri.getRawFragment() != null
                    || uri.getPort() == 0 || uri.getPort() > 65535) throw new IllegalArgumentException();
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(label + " must be a valid HTTP" + (allowTcp ? ", HTTPS or TCP" : " or HTTPS") + " URL");
        }
    }

    public static void jsonObject(String value, String label) {
        if (value == null || value.isBlank()) return;
        try {
            JsonNode node = JSON.readTree(value);
            if (value.length() > 65536 || node == null || !node.isObject()) throw new IllegalArgumentException();
        } catch (Exception ex) {
            throw new IllegalArgumentException(label + " must be a valid JSON object");
        }
    }
}
