package com.opspilot.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "containers")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ContainerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "container_id")
    private Long containerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "project", "deployedBy"})
    private Deployment deployment;

    @Column(name = "image_name", nullable = false)
    private String imageName;

    @Column(name = "container_status", nullable = false)
    private String containerStatus; // e.g. RUNNING, STOPPED, STARTING

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ContainerEntity() {
        this.createdAt = LocalDateTime.now();
    }

    public ContainerEntity(Deployment deployment, String imageName, String containerStatus) {
        this.deployment = deployment;
        this.imageName = imageName;
        this.containerStatus = containerStatus;
        this.createdAt = LocalDateTime.now();
    }

    public Long getContainerId() {
        return containerId;
    }

    public void setContainerId(Long containerId) {
        this.containerId = containerId;
    }

    public Deployment getDeployment() {
        return deployment;
    }

    public void setDeployment(Deployment deployment) {
        this.deployment = deployment;
    }

    public String getImageName() {
        return imageName;
    }

    public void setImageName(String imageName) {
        this.imageName = imageName;
    }

    public String getContainerStatus() {
        return containerStatus;
    }

    public void setContainerStatus(String containerStatus) {
        this.containerStatus = containerStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
