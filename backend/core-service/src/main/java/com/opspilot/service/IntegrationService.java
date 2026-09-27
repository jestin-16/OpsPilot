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
}
