package com.opspilot.dto;

import com.opspilot.enums.IntegrationCategory;
import com.opspilot.enums.ProviderType;

import java.util.Map;

/**
 * Create / update payload. Settings can be sent as a JSON object in {@code config}; keys that hold secrets (token,
 * password, ...) are moved to encrypted storage by the server. {@code secrets} sends secrets explicitly. The older
 * {@code configuration} / {@code credentials} JSON strings are still accepted.
 */
public class IntegrationRequest {
    private ProviderType provider;
    private String name;
    private IntegrationCategory category;
    private String configuration;
    private String credentials; // Will be stored securely, not in plaintext
    private String metadata;
    private Map<String, Object> config;
    private Map<String, String> secrets;

    public ProviderType getProvider() { return provider; }
    public void setProvider(ProviderType provider) { this.provider = provider; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public IntegrationCategory getCategory() { return category; }
    public void setCategory(IntegrationCategory category) { this.category = category; }

    public String getConfiguration() { return configuration; }
    public void setConfiguration(String configuration) { this.configuration = configuration; }

    public String getCredentials() { return credentials; }
    public void setCredentials(String credentials) { this.credentials = credentials; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public Map<String, Object> getConfig() { return config; }
    public void setConfig(Map<String, Object> config) { this.config = config; }

    public Map<String, String> getSecrets() { return secrets; }
    public void setSecrets(Map<String, String> secrets) { this.secrets = secrets; }
}
