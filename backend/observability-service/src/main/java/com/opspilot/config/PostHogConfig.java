package com.opspilot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "posthog")
public class PostHogConfig {
    private String apiKey = "mock";
    private String projectId = "mock";
    private String host = "https://app.posthog.com";

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
}
