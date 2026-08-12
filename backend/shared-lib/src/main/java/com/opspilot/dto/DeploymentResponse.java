package com.opspilot.dto;

import java.time.LocalDateTime;

public class DeploymentResponse {

    private Long id;
    private Long projectId;
    private String projectName;
    private Long deployedById;
    private String deployedByName;
    private String version;
    private String environment;
    private String status;
    private LocalDateTime deployedAt;

    public DeploymentResponse() {
    }

    public DeploymentResponse(Long id, Long projectId, String projectName, Long deployedById, String deployedByName,
                              String version, String environment, String status, LocalDateTime deployedAt) {
        this.id = id;
        this.projectId = projectId;
        this.projectName = projectName;
        this.deployedById = deployedById;
        this.deployedByName = deployedByName;
        this.version = version;
        this.environment = environment;
        this.status = status;
        this.deployedAt = deployedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public Long getDeployedById() {
        return deployedById;
    }

    public void setDeployedById(Long deployedById) {
        this.deployedById = deployedById;
    }

    public String getDeployedByName() {
        return deployedByName;
    }

    public void setDeployedByName(String deployedByName) {
        this.deployedByName = deployedByName;
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

    public LocalDateTime getDeployedAt() {
        return deployedAt;
    }

    public void setDeployedAt(LocalDateTime deployedAt) {
        this.deployedAt = deployedAt;
    }
}
