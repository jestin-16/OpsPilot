package com.opspilot.dto;

import jakarta.validation.constraints.NotBlank;

public class DeploymentRequest {

    @NotBlank(message = "Version is required")
    private String version;

    @NotBlank(message = "Environment is required")
    private String environment; // Dev, Staging, Production

    public DeploymentRequest() {
    }

    public DeploymentRequest(String version, String environment) {
        this.version = version;
        this.environment = environment;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }
}
