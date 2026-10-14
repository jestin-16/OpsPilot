package com.opspilot.connector;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.enums.ProviderType;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Connection settings handed to a connector: non-secret settings plus secrets. toString() never prints either, so a
 * config can't leak through logging.
 */
public final class ConnectorConfig {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() { };

    private final Long projectId;
    private final Long integrationId;
    private final ProviderType type;
    private final String name;
    private final Map<String, Object> settings;
    private final Map<String, String> secrets;

    public ConnectorConfig(Long projectId, Long integrationId, ProviderType type, String name,
                           Map<String, Object> settings, Map<String, String> secrets) {
        this.projectId = projectId;
        this.integrationId = integrationId;
        this.type = type;
        this.name = name;
        this.settings = settings == null ? Map.of() : Collections.unmodifiableMap(new HashMap<>(settings));
        this.secrets = secrets == null ? Map.of() : Collections.unmodifiableMap(new HashMap<>(secrets));
    }

    /** Builds a config from the JSON strings stored on an integration. */
    public static ConnectorConfig fromJson(Long projectId, Long integrationId, ProviderType type, String name,
                                           String settingsJson, String secretsJson) {
        return new ConnectorConfig(projectId, integrationId, type, name, parseObject(settingsJson), stringify(parseObject(secretsJson)));
    }

    public static Map<String, Object> parseObject(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return MAPPER.readValue(json, MAP);
        } catch (Exception e) {
            throw new IllegalArgumentException("Configuration is not a valid JSON object");
        }
    }

    private static Map<String, String> stringify(Map<String, Object> in) {
        Map<String, String> out = new HashMap<>();
        in.forEach((k, v) -> { if (v != null) out.put(k, String.valueOf(v)); });
        return out;
    }

    public Long projectId() { return projectId; }
    public Long integrationId() { return integrationId; }
    public ProviderType type() { return type; }
    public String name() { return name; }
    public Map<String, Object> settings() { return settings; }
    public Map<String, String> secrets() { return secrets; }

    public String setting(String key) {
        Object v = settings.get(key);
        return v == null || String.valueOf(v).isBlank() ? null : String.valueOf(v).trim();
    }

    public String setting(String key, String fallback) {
        String v = setting(key);
        return v != null ? v : fallback;
    }

    public String secret(String key) {
        String v = secrets.get(key);
        return v == null || v.isBlank() ? null : v;
    }

    @Override
    public String toString() {
        return "ConnectorConfig[type=" + type + ", name=" + name + ", integrationId=" + integrationId + "]";
    }
}
