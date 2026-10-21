package com.opspilot.service;

import com.opspilot.security.ProjectScope;
import com.opspilot.dto.DeploymentRequest;
import com.opspilot.dto.DeploymentResponse;
import com.opspilot.entity.*;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Deployments are records of deployments that happened elsewhere: recorded through the API (by a person or
 * a CI step) or reported by GitHub deployment webhooks. OpsPilot does not run deployments itself.
 */
@Service
public class DeploymentService {

    /** Project logs this long before and after a deployment are shown as its logs. */
    static final int LOG_WINDOW_BEFORE_MINUTES = 5;
    static final int LOG_WINDOW_AFTER_MINUTES = 15;
    static final int MAX_DEPLOYMENT_LOGS = 500;

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ProjectScope projectScope;

    /** Records a deployment of the project, attributed to the caller (who must be able to see the project). */
    public DeploymentResponse recordDeployment(Long projectId, DeploymentRequest request, User currentUser) {
        Project project = projectScope.require(projectId, currentUser);
        String status = normalizeStatus(request.getStatus());

        Deployment deployment = new Deployment(project, currentUser, request.getVersion().trim(),
                request.getEnvironment().trim(), status);
        deployment.setSource(Deployment.SOURCE_MANUAL);
        deployment.setUrl(blankToNull(request.getUrl()));
        deployment.setUpdatedAt(LocalDateTime.now());
        Deployment saved = deploymentRepository.save(deployment);

        logRepository.save(new LogEntity(saved, "deployments", Deployment.FAILED.equals(status) ? "ERROR" : "INFO",
                "Deployment #" + saved.getId() + " of " + project.getProjectName() + " " + saved.getVersion()
                        + " to " + saved.getEnvironment() + " recorded as " + status + " by " + currentUser.getName()));

        if (Deployment.FAILED.equals(status) && project.getOwner() != null) {
            notificationRepository.save(new NotificationEntity(project.getOwner(), saved,
                    "Deployment #" + saved.getId() + " (" + project.getProjectName() + " " + saved.getVersion() + ") failed on "
                            + saved.getEnvironment(), "DEPLOYMENT_FAILED"));
        }
        return mapToResponse(saved);
    }

    static String normalizeStatus(String status) {
        return Deployment.normalizeStatus(status);
    }

    public List<DeploymentResponse> getDeploymentsForProject(Long projectId, User currentUser) {
        Project project = projectScope.require(projectId, currentUser);

        List<Deployment> deployments = deploymentRepository.findByProjectOrderByDeployedAtDesc(project);
        return deployments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DeploymentResponse> getAllDeployments(User currentUser) {
        List<Deployment> deployments = projectScope.visibleProjectIds(currentUser)
                .map(ids -> ids.isEmpty() ? List.<Deployment>of() : deploymentRepository.findByProject_IdInOrderByDeployedAtDesc(ids))
                .orElseGet(deploymentRepository::findAllByOrderByDeployedAtDesc);
        return deployments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DeploymentResponse getDeploymentById(Long id, User currentUser) {
        return mapToResponse(findVisibleDeployment(id, currentUser));
    }

    private Deployment findVisibleDeployment(Long id, User currentUser) {
        Deployment d = deploymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deployment not found"));
        projectScope.requireAccess(d.getProject(), currentUser);
        return d;
    }

    /** The project's logs from just before the deployment until after its last status update, oldest first. */
    public List<LogEntity> getDeploymentLogs(Long id, User currentUser) {
        Deployment d = findVisibleDeployment(id, currentUser);
        LocalDateTime at = d.getDeployedAt();
        // Long deployments keep reporting status; follow them until their last update.
        LocalDateTime last = d.getUpdatedAt() != null && d.getUpdatedAt().isAfter(at) ? d.getUpdatedAt() : at;
        List<LogEntity> logs = new ArrayList<>(logRepository.findProjectLogsBetween(d.getProject().getId(),
                at.minusMinutes(LOG_WINDOW_BEFORE_MINUTES), last.plusMinutes(LOG_WINDOW_AFTER_MINUTES), false,
                PageRequest.of(0, MAX_DEPLOYMENT_LOGS)));
        Collections.reverse(logs);
        return logs;
    }

    private DeploymentResponse mapToResponse(Deployment deployment) {
        // Attribution is only ever the real deployer: an OpsPilot user, or the provider's actor.
        User by = deployment.getDeployedBy();
        DeploymentResponse response = new DeploymentResponse(
                deployment.getId(),
                deployment.getProject().getId(),
                deployment.getProject().getProjectName(),
                by != null ? by.getId() : null,
                by != null ? by.getName() : deployment.getActor(),
                deployment.getVersion(),
                deployment.getEnvironment(),
                deployment.getStatus(),
                deployment.getDeployedAt()
        );
        response.setSource(deployment.getSource());
        response.setUrl(deployment.getUrl());
        response.setActor(deployment.getActor());
        return response;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
