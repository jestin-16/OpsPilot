package com.opspilot.service;

import com.opspilot.dto.DeploymentRequest;
import com.opspilot.dto.DeploymentResponse;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class DeploymentService {

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    @Transactional
    public DeploymentResponse createDeployment(Long projectId, DeploymentRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Deployment deployment = new Deployment(
                project,
                currentUser,
                request.getVersion(),
                request.getEnvironment(),
                "Draft"
        );

        Deployment savedDeployment = deploymentRepository.save(deployment);
        Long deploymentId = savedDeployment.getId();

        // Simulate status progression: Draft -> Building -> Deploying -> Running
        scheduleStatusProgression(deploymentId);

        return mapToResponse(savedDeployment);
    }

    public List<DeploymentResponse> getDeploymentsForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        List<Deployment> deployments = deploymentRepository.findByProjectOrderByDeployedAtDesc(project);
        return deployments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void scheduleStatusProgression(Long deploymentId) {
        // Step 1: Draft -> Building after 2s
        scheduler.schedule(() -> updateStatus(deploymentId, "Building"), 2, TimeUnit.SECONDS);

        // Step 2: Building -> Deploying after 4s
        scheduler.schedule(() -> updateStatus(deploymentId, "Deploying"), 4, TimeUnit.SECONDS);

        // Step 3: Deploying -> Running after 6s
        scheduler.schedule(() -> updateStatus(deploymentId, "Running"), 6, TimeUnit.SECONDS);
    }

    private void updateStatus(Long deploymentId, String status) {
        try {
            deploymentRepository.findById(deploymentId).ifPresent(d -> {
                d.setStatus(status);
                deploymentRepository.save(d);
            });
        } catch (Exception e) {
            // Log warning if error occurs during async background update
            System.err.println("Failed to update deployment status to " + status + ": " + e.getMessage());
        }
    }

    private DeploymentResponse mapToResponse(Deployment deployment) {
        return new DeploymentResponse(
                deployment.getId(),
                deployment.getProject().getId(),
                deployment.getProject().getProjectName(),
                deployment.getDeployedBy().getId(),
                deployment.getDeployedBy().getName(),
                deployment.getVersion(),
                deployment.getEnvironment(),
                deployment.getStatus(),
                deployment.getDeployedAt()
        );
    }
}
