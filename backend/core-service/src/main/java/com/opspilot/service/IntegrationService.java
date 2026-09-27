package com.opspilot.service;

import com.opspilot.dto.IntegrationRequest;
import com.opspilot.dto.IntegrationResponse;
import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class IntegrationService {

    @Autowired
    private IntegrationRepository integrationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private com.opspilot.integration.IntegrationProviderRegistry providerRegistry;

    @Transactional
    public IntegrationResponse createIntegration(Long projectId, IntegrationRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (!project.getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to add integrations to this project");
        }

        Integration integration = new Integration();
        integration.setProject(project);
        integration.setProvider(request.getProvider());
        integration.setName(request.getName());
        integration.setCategory(request.getCategory());
        integration.setConfiguration(request.getConfiguration());
        integration.setCredentialReference(request.getCredentials()); // Encrypted by converter
        integration.setMetadata(request.getMetadata());
        integration.setStatus(IntegrationStatus.CONNECTING);

        Integration saved = integrationRepository.save(integration);
        return mapToResponse(saved);
    }

    public List<IntegrationResponse> getIntegrationsByProject(Long projectId, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (!project.getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to view integrations for this project");
        }

        return integrationRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public IntegrationResponse getIntegrationById(Long integrationId, User currentUser) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));

        if (!integration.getProject().getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to view this integration");
        }

        return mapToResponse(integration);
    }

    @Transactional
    public void deleteIntegration(Long integrationId, User currentUser) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));

        if (!integration.getProject().getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to delete this integration");
        }

        integrationRepository.delete(integration);
    }

    private IntegrationResponse mapToResponse(Integration integration) {
        IntegrationResponse response = new IntegrationResponse();
        response.setId(integration.getId());
        response.setProjectId(integration.getProject().getId());
        response.setProvider(integration.getProvider());
        response.setName(integration.getName());
        response.setCategory(integration.getCategory());
        response.setStatus(integration.getStatus());
        response.setConfiguration(integration.getConfiguration());
        response.setCreatedAt(integration.getCreatedAt());
        response.setUpdatedAt(integration.getUpdatedAt());
        response.setLastHealthCheckAt(integration.getLastHealthCheckAt());
        response.setMetadata(integration.getMetadata());
        // Credentials explicitly omitted
        return response;
    }

    private boolean isPrivileged(User user) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(role -> {
            String name = role.getRoleName() != null ? role.getRoleName().toUpperCase() : "";
            return name.contains("ADMIN") || name.contains("DEVOPS");
        });
    }

    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamLogs(Long projectId, Long integrationId, java.util.Map<String, Object> params, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (!project.getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to view logs for this project");
        }

        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));

        if (!integration.getProject().getId().equals(project.getId())) {
            throw new IllegalArgumentException("Integration does not belong to the specified project");
        }

        com.opspilot.integration.IntegrationAdapter adapter = providerRegistry.getAdapter(integration.getProvider())
                .orElseThrow(() -> new IllegalStateException("Provider adapter not found for " + integration.getProvider()));

        if (!(adapter instanceof com.opspilot.log.LogCollector)) {
            throw new IllegalStateException("Adapter does not support log collection");
        }

        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(300000L); // 5 min timeout
        com.opspilot.log.LogCollector logCollector = (com.opspilot.log.LogCollector) adapter;

        java.util.concurrent.ExecutorService sseMvcExecutor = java.util.concurrent.Executors.newSingleThreadExecutor();
        sseMvcExecutor.execute(() -> {
            try {
                logCollector.stream(integration, params, (record) -> {
                    try {
                        org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder event = org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
                                .data(record)
                                .id(record.getId())
                                .name("log-record");
                        emitter.send(event);
                    } catch (Exception e) {
                        emitter.completeWithError(e);
                        throw new RuntimeException(e);
                    }
                });
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });

        emitter.onCompletion(sseMvcExecutor::shutdown);
        emitter.onError((e) -> sseMvcExecutor.shutdown());
        emitter.onTimeout(sseMvcExecutor::shutdown);

        return emitter;
    }

    public List<com.opspilot.metric.MetricRecord> getMetrics(Long projectId, Long integrationId, java.util.Map<String, Object> params, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (!project.getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to view metrics for this project");
        }

        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));

        if (!integration.getProject().getId().equals(project.getId())) {
            throw new IllegalArgumentException("Integration does not belong to the specified project");
        }

        com.opspilot.integration.IntegrationAdapter adapter = providerRegistry.getAdapter(integration.getProvider())
                .orElseThrow(() -> new IllegalStateException("Provider adapter not found for " + integration.getProvider()));

        if (!adapter.supports(com.opspilot.enums.IntegrationCapability.METRICS)) {
            throw new UnsupportedOperationException("Provider does not support metric collection");
        }
        
        if (!(adapter instanceof com.opspilot.metric.MetricCollector)) {
            throw new UnsupportedOperationException("Adapter does not implement MetricCollector");
        }

        return ((com.opspilot.metric.MetricCollector) adapter).collectMetrics(integration, params == null ? new java.util.HashMap<>() : params);
    }
}
