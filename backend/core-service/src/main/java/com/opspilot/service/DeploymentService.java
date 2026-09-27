package com.opspilot.service;

import com.opspilot.dto.DeploymentRequest;
import com.opspilot.dto.DeploymentResponse;
import com.opspilot.entity.*;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeploymentService {

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ContainerRepository containerRepository;

    @Autowired
    private PodRepository podRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);

    public DeploymentResponse createDeployment(Long projectId, DeploymentRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        User effectiveUser = currentUser;
        if (effectiveUser == null) {
            effectiveUser = project.getOwner();
        }
        if (effectiveUser == null) {
            effectiveUser = userRepository.findAll().stream().findFirst().orElse(null);
        }

        Deployment deployment = new Deployment(
                project,
                effectiveUser,
                request.getVersion(),
                request.getEnvironment(),
                "Draft"
        );

        Deployment savedDeployment = deploymentRepository.save(deployment);
        Long deploymentId = savedDeployment.getId();

        // Emit log
        logRepository.save(new LogEntity(savedDeployment, "deployment-service", "INFO",
                "Deployment #" + deploymentId + " initiated for project " + project.getProjectName() + " (" + request.getEnvironment() + " - " + request.getVersion() + ")"));

        // Emit notification
        notificationRepository.save(new NotificationEntity(currentUser, savedDeployment,
                "Deployment #" + deploymentId + " (" + project.getProjectName() + ") triggered for " + request.getEnvironment(), "DEPLOYMENT_INITIATED"));

        // Immediately provision initial container and pod
        provisionContainerAndPod(savedDeployment);

        // Schedule status progression
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

    public List<DeploymentResponse> getAllDeployments() {
        return deploymentRepository.findAllByOrderByDeployedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DeploymentResponse getDeploymentById(Long id) {
        Deployment d = deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment not found"));
        return mapToResponse(d);
    }

    @Transactional
    public DeploymentResponse rollbackDeployment(Long id, User currentUser) {
        Deployment currentDeployment = deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment not found"));

        Project project = currentDeployment.getProject();
        verifyRollbackAuthorization(project, currentUser);

        List<Deployment> deployments = deploymentRepository.findByProjectOrderByDeployedAtDesc(project);
        Deployment previousStable = null;
        for (Deployment d : deployments) {
            if ("Running".equalsIgnoreCase(d.getStatus()) && !d.getId().equals(currentDeployment.getId()) && d.getDeployedAt().isBefore(currentDeployment.getDeployedAt())) {
                previousStable = d;
                break;
            }
        }

        if (previousStable == null) {
            throw new IllegalStateException("No previous stable deployment found to rollback to");
        }

        currentDeployment.setStatus("RolledBack");
        deploymentRepository.save(currentDeployment);

        DeploymentRequest rollbackRequest = new DeploymentRequest();
        rollbackRequest.setVersion(previousStable.getVersion());
        rollbackRequest.setEnvironment(currentDeployment.getEnvironment());
        
        return createDeployment(project.getId(), rollbackRequest, currentUser);
    }

    private void verifyRollbackAuthorization(Project project, User currentUser) {
        if (currentUser == null) {
            throw new com.opspilot.exception.UnauthorizedException("Authentication required");
        }
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isAuthorizedRole = currentUser.getRoles().stream()
                .anyMatch(r -> {
                    String rn = r.getRoleName().toUpperCase();
                    return rn.equals("ADMIN") || rn.equals("ROLE_ADMIN") || 
                           rn.equals("DEVOPS") || rn.equals("ROLE_DEVOPS");
                });

        if (!isOwner && !isAuthorizedRole) {
            throw new com.opspilot.exception.ForbiddenException("Only authorized project owner, DevOps Engineer, or Administrator can perform rollback");
        }
    }

    public List<LogEntity> getDeploymentLogs(Long id) {
        Deployment d = deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment not found"));
        return logRepository.findByDeploymentOrderByTimestampAsc(d);
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
                Deployment updated = deploymentRepository.save(d);

                // Log status transition
                logRepository.save(new LogEntity(updated, "deployment-service", "INFO",
                        "Deployment #" + deploymentId + " status updated to " + status));

                if ("Running".equalsIgnoreCase(status)) {
                    notificationRepository.save(new NotificationEntity(d.getDeployedBy(), updated,
                            "Deployment #" + deploymentId + " (" + d.getProject().getProjectName() + ") is now RUNNING on " + d.getEnvironment(), "DEPLOYMENT_SUCCESS"));
                }

                // Update mapped container status as well
                List<ContainerEntity> containers = containerRepository.findByDeploymentId(deploymentId);
                for (ContainerEntity c : containers) {
                    if ("Running".equalsIgnoreCase(status)) {
                        c.setContainerStatus("RUNNING");
                    } else if ("Building".equalsIgnoreCase(status) || "Deploying".equalsIgnoreCase(status)) {
                        c.setContainerStatus("STARTING");
                    }
                    containerRepository.save(c);
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to update deployment status to " + status + ": " + e.getMessage());
        }
    }

    private void provisionContainerAndPod(Deployment deployment) {
        try {
            String imageName = "opspilot/" + deployment.getProject().getProjectName().toLowerCase().replaceAll("[^a-z0-9]", "-") + ":" + deployment.getVersion();
            ContainerEntity container = new ContainerEntity(deployment, imageName, "STARTING");
            ContainerEntity savedContainer = containerRepository.save(container);

            PodEntity pod = new PodEntity(savedContainer, "minikube-node-1", "Running", "125m", "256Mi");
            podRepository.save(pod);

            logRepository.save(new LogEntity(deployment, "kubernetes-service", "INFO",
                    "Provisioned pod #pod-" + pod.getPodId() + " on node minikube-node-1 for image " + imageName));
        } catch (Exception e) {
            System.err.println("Error provisioning container/pod: " + e.getMessage());
        }
    }

    private DeploymentResponse mapToResponse(Deployment deployment) {
        Long userAuthId = deployment.getDeployedBy() != null ? deployment.getDeployedBy().getId() : (deployment.getProject().getOwner() != null ? deployment.getProject().getOwner().getId() : 1L);
        String userAuthName = deployment.getDeployedBy() != null ? deployment.getDeployedBy().getName() : (deployment.getProject().getOwner() != null ? deployment.getProject().getOwner().getName() : "System");

        return new DeploymentResponse(
                deployment.getId(),
                deployment.getProject().getId(),
                deployment.getProject().getProjectName(),
                userAuthId,
                userAuthName,
                deployment.getVersion(),
                deployment.getEnvironment(),
                deployment.getStatus(),
                deployment.getDeployedAt()
        );
    }
}
