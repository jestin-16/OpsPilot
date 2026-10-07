package com.opspilot.dto;

/** Create/update payload for a Docker log source. The project and type cannot be changed after creation. */
public class DockerLogSourceRequest {
    private String name;
    private String environment;
    private Long projectId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}
