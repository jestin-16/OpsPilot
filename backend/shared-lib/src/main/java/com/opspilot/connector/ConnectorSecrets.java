package com.opspilot.connector;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/** Decides which integration fields are secrets and keeps them out of stored settings and API responses. */
public final class ConnectorSecrets {

    /** Setting names that are always treated as secrets, whichever field the client sent them in. */
    public static final Set<String> SECRET_KEYS = Set.of(
            "token", "apiToken", "username", "password", "caCert", "webhookSecret", "secret", "kubeconfig", "accessKey", "secretKey");

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ConnectorSecrets() {
    }

    public static boolean isSecret(String key) {
        return SECRET_KEYS.contains(key) || key.toLowerCase().matches(".*(token|secret|password|passwd|apikey|credential).*");
    }

    /** Result of splitting a client payload. */
    public record Split(Map<String, Object> settings, Map<String, String> secrets) { }

    public static Split split(Map<String, Object> config, Map<String, String> explicitSecrets) {
        Map<String, Object> settings = new HashMap<>();
        Map<String, String> secrets = new HashMap<>();
        if (config != null) {
            config.forEach((k, v) -> {
                if (v == null) return;
                if (isSecret(k)) secrets.put(k, String.valueOf(v)); else settings.put(k, v);
            });
        }
        if (explicitSecrets != null) {
            explicitSecrets.forEach((k, v) -> { if (v != null && !v.isBlank()) secrets.put(k, v); });
        }
        secrets.values().removeIf(String::isBlank);
        return new Split(settings, secrets);
    }

    /** Drops anything secret-looking from stored settings before they are returned to a client. */
    public static Map<String, Object> sanitize(Map<String, Object> settings) {
        Map<String, Object> out = new HashMap<>();
        settings.forEach((k, v) -> { if (!isSecret(k)) out.put(k, v); });
        return out;
    }

    public static String toJson(Map<String, ?> map) {
        try {
            return MAPPER.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Could not serialize configuration");
        }
    }
}
