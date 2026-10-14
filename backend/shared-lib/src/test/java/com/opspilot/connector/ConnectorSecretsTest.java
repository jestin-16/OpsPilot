package com.opspilot.connector;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class ConnectorSecretsTest {

    @Test
    void splitMovesSecretLookingKeysOutOfSettings() {
        Map<String, Object> config = new HashMap<>();
        config.put("host", "http://x:2375");
        config.put("token", "abc");
        config.put("apiToken", "def");
        config.put("myPassword", "pw");
        config.put("repo", "a/b");

        ConnectorSecrets.Split split = ConnectorSecrets.split(config, Map.of("caCert", "PEM", "blank", " "));

        assertEquals(Map.of("host", "http://x:2375", "repo", "a/b"), split.settings());
        assertEquals(Map.of("token", "abc", "apiToken", "def", "myPassword", "pw", "caCert", "PEM"), split.secrets());
    }

    @Test
    void sanitizeDropsSecretsFromStoredSettings() {
        Map<String, Object> stored = Map.of("host", "h", "webhookSecret", "s", "client_secret", "z");
        assertEquals(Map.of("host", "h"), ConnectorSecrets.sanitize(stored));
    }

    @Test
    void invalidJsonIsRejectedWithoutEchoingIt() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> ConnectorConfig.parseObject("{token: hunter2"));
        assertFalse(e.getMessage().contains("hunter2"));
    }

    @Test
    void levelDetection() {
        assertEquals("ERROR", Levels.detect("2024 FATAL boom"));
        assertEquals("WARN", Levels.detect("warning: disk"));
        assertEquals("DEBUG", Levels.detect("trace x"));
        assertEquals("INFO", Levels.detect("hello"));
        assertEquals("WARN", Levels.normalize("warning"));
    }
}
