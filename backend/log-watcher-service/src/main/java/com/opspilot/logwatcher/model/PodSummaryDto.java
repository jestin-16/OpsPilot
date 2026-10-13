package com.opspilot.logwatcher.model;

import java.util.List;
import java.util.Map;

public class PodSummaryDto {
    private String name;
    private String namespace;
    private String status; // Running, Pending, CrashLoopBackOff, Failed, Completed
    private int restarts;
    private String age;
    private String ready; // e.g. "1/1", "2/2"
    private String podIP;
    private String nodeName;
    private List<String> containers;
    private Map<String, String> containerStatuses; // containerName -> state (Running, Waiting: CrashLoopBackOff, Terminated)
    private Map<String, String> labels;
    private String creationTimestamp;

    public PodSummaryDto() {
    }

    public PodSummaryDto(String name, String namespace, String status, int restarts, String age, String ready,
                         String podIP, String nodeName, List<String> containers,
                         Map<String, String> containerStatuses, Map<String, String> labels, String creationTimestamp) {
        this.name = name;
        this.namespace = namespace;
        this.status = status;
        this.restarts = restarts;
        this.age = age;
        this.ready = ready;
        this.podIP = podIP;
        this.nodeName = nodeName;
        this.containers = containers;
        this.containerStatuses = containerStatuses;
        this.labels = labels;
        this.creationTimestamp = creationTimestamp;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getRestarts() {
        return restarts;
    }

    public void setRestarts(int restarts) {
        this.restarts = restarts;
    }

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public String getReady() {
        return ready;
    }

    public void setReady(String ready) {
        this.ready = ready;
    }

    public String getPodIP() {
        return podIP;
    }

    public void setPodIP(String podIP) {
        this.podIP = podIP;
    }

    public String getNodeName() {
        return nodeName;
    }

    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }

    public List<String> getContainers() {
        return containers;
    }

    public void setContainers(List<String> containers) {
        this.containers = containers;
    }

    public Map<String, String> getContainerStatuses() {
        return containerStatuses;
    }

    public void setContainerStatuses(Map<String, String> containerStatuses) {
        this.containerStatuses = containerStatuses;
    }

    public Map<String, String> getLabels() {
        return labels;
    }

    public void setLabels(Map<String, String> labels) {
        this.labels = labels;
    }

    public String getCreationTimestamp() {
        return creationTimestamp;
    }

    public void setCreationTimestamp(String creationTimestamp) {
        this.creationTimestamp = creationTimestamp;
    }
}
