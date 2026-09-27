package com.opspilot.dto;

import com.opspilot.enums.IntegrationCategory;
import com.opspilot.enums.ProviderType;

public class IntegrationRequest {
    private ProviderType ProviderType;
    private String name;
    private IntegrationCategory category;
    private String configuration;
    private String credentials; // Will be stored securely, not in plaintext
    private String metadata;

    public ProviderType getProvider() { return ProviderType; }
    public void setProvider(ProviderType ProviderType) { this.ProviderType = ProviderType; }

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
}
