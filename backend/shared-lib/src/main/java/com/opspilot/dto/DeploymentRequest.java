package com.opspilot.dto;

import jakarta.validation.constraints.NotBlank;

public class DeploymentRequest {

    @NotBlank(message = "Version is required")
    private String version;

    @NotBlank(message = "Environment is required")
    private String environment; // Dev, Staging, Production

    /** Outcome being recorded: In progress, Succeeded (default), Failed or Inactive. */
    private String status;

    /** Where this deployment is reachable, if known. */
    @jakarta.validation.constraints.Size(max = 1024)
    private String url;

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
