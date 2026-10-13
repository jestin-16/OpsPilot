package com.opspilot.logwatcher.model;

public class CrashLoopPodDto {
    private String podName;
    private String namespace;
    private String containerName;
    private int restartCount;
    private String reason; // CrashLoopBackOff, OOMKilled, Error
    private Integer exitCode;
    private String message;
    private String lastTerminationTime;

    public CrashLoopPodDto() {
    }

    public CrashLoopPodDto(String podName, String namespace, String containerName, int restartCount, String reason, Integer exitCode, String message, String lastTerminationTime) {
        this.podName = podName;
        this.namespace = namespace;
        this.containerName = containerName;
        this.restartCount = restartCount;
        this.reason = reason;
        this.exitCode = exitCode;
        this.message = message;
        this.lastTerminationTime = lastTerminationTime;
    }

    public String getPodName() {
        return podName;
    }

    public void setPodName(String podName) {
        this.podName = podName;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getContainerName() {
        return containerName;
    }

    public void setContainerName(String containerName) {
        this.containerName = containerName;
    }

    public int getRestartCount() {
        return restartCount;
    }

    public void setRestartCount(int restartCount) {
        this.restartCount = restartCount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getExitCode() {
        return exitCode;
    }

    public void setExitCode(Integer exitCode) {
        this.exitCode = exitCode;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getLastTerminationTime() {
        return lastTerminationTime;
    }

    public void setLastTerminationTime(String lastTerminationTime) {
        this.lastTerminationTime = lastTerminationTime;
    }
}
