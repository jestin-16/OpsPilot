package com.opspilot.dto;

public class AiQueryRequest {
    private String prompt;
    private Long deploymentId;

    public AiQueryRequest() {}

    public AiQueryRequest(String prompt, Long deploymentId) {
        this.prompt = prompt;
        this.deploymentId = deploymentId;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public Long getDeploymentId() {
        return deploymentId;
    }

    public void setDeploymentId(Long deploymentId) {
        this.deploymentId = deploymentId;
    }
}
