package com.opspilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "pods")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PodEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pod_id")
    private Long podId;

    @Column(name = "pod_name")
    private String podName;

    @Column(name = "namespace")
    private String namespace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "container_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "deployment"})
    private ContainerEntity container;

    @Column(name = "node_name", nullable = false)
    private String nodeName;

    @Column(name = "pod_status", nullable = false)
    private String podStatus; // e.g. Running, Pending, Terminated

    @Column(name = "cpu_usage")
    private String cpuUsage; // e.g. 120m, 250m

    @Column(name = "memory_usage")
    private String memoryUsage; // e.g. 256Mi, 512Mi

    public PodEntity() {}

    public PodEntity(String podName, String namespace, ContainerEntity container, String nodeName, String podStatus, String cpuUsage, String memoryUsage) {
        this.podName = podName;
        this.namespace = namespace;
        this.container = container;
        this.nodeName = nodeName;
        this.podStatus = podStatus;
        this.cpuUsage = cpuUsage;
        this.memoryUsage = memoryUsage;
    }

    public PodEntity(ContainerEntity container, String nodeName, String podStatus, String cpuUsage, String memoryUsage) {
        this(null, "default", container, nodeName, podStatus, cpuUsage, memoryUsage);
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

    public Long getPodId() {
        return podId;
    }

    public void setPodId(Long podId) {
        this.podId = podId;
    }

    public ContainerEntity getContainer() {
        return container;
    }

    public void setContainer(ContainerEntity container) {
        this.container = container;
    }

    public String getNodeName() {
        return nodeName;
    }

    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }

    public String getPodStatus() {
        return podStatus;
    }

    public void setPodStatus(String podStatus) {
        this.podStatus = podStatus;
    }

    public String getCpuUsage() {
        return cpuUsage;
    }

    public void setCpuUsage(String cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public String getMemoryUsage() {
        return memoryUsage;
    }

    public void setMemoryUsage(String memoryUsage) {
        this.memoryUsage = memoryUsage;
    }
}
