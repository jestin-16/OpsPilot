package com.opspilot.service;

import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectCreateRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.Project;
import com.opspilot.util.Slugs;
import com.opspilot.entity.User;
import com.opspilot.event.AuditEvent;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.exception.UnauthorizedException;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.LogSourceRepository;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.IncidentRepository;
import com.opspilot.repository.CommitLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private LogSourceRepository logSourceRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private CommitLogRepository commitLogRepository;

    @Autowired
    private io.micrometer.core.instrument.MeterRegistry meterRegistry;

    public List<ProjectResponse> getAllProjectsForUser(User currentUser) {
        if (currentUser == null) {
            return Collections.emptyList();
        }
        List<Project> projects = projectRepository.findByOwner(currentUser);

        return projects.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public com.opspilot.dto.PagedResponse<ProjectResponse> getPaginatedProjectsForUser(
            User currentUser, int page, int size, String sortBy, String sortDir) {
        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase("desc")
                ? org.springframework.data.domain.Sort.by(sortBy).descending()
                : org.springframework.data.domain.Sort.by(sortBy).ascending();

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);

        org.springframework.data.domain.Page<Project> projectPage = currentUser == null
                ? org.springframework.data.domain.Page.empty(pageable)
                : projectRepository.findByOwner(currentUser, pageable);

        List<ProjectResponse> content = projectPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new com.opspilot.dto.PagedResponse<>(
                content,
                projectPage.getNumber(),
                projectPage.getSize(),
                projectPage.getTotalElements(),
                projectPage.getTotalPages(),
                projectPage.isLast()
        );
    }

    public List<ProjectResponse> getAllProjectsForAdmin() {
        return projectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (currentUser != null) {
            verifyOwnerOrAdmin(project, currentUser);
        }

        return mapToResponse(project);
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request, User currentUser) {
        if (currentUser == null) {
            throw new UnauthorizedException("Authentication is required to create a project");
        }

        String projectName = request.getProjectName().trim();
        String description = normalizeOptional(request.getDescription());
        String repositoryUrl = normalizeOptional(request.getRepositoryUrl());

        if (projectRepository.existsByProjectNameIgnoreCaseAndOwner(projectName, currentUser)) {
            throw new IllegalArgumentException("Project name must be unique per user");
        }

        Project project = new Project(
                projectName,
                description,
                repositoryUrl,
                currentUser,
                "SETUP_IN_PROGRESS"
        );

        project.setSlug(Slugs.unique(Slugs.slugify(projectName), projectRepository::existsBySlug));
        if (request.getEnvironment() != null && !request.getEnvironment().isBlank()) {
            project.setEnvironment(request.getEnvironment());
        }

        Project savedProject = projectRepository.save(project);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new AuditEvent(
                    this, currentUser, "PROJECT_CREATE", "PROJECT", savedProject.getId().toString(), "Created project: " + savedProject.getProjectName()
            ));
        }

        meterRegistry.counter("project.create.success").increment();

        return mapToResponse(savedProject);
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        verifyOwnerOrAdmin(project, currentUser);

        if (request.getProjectName() != null) {
            project.setProjectName(request.getProjectName());
        }
        if (request.getEnvironment() != null && !request.getEnvironment().isBlank()) {
            project.setEnvironment(request.getEnvironment());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getRepositoryUrl() != null) {
            project.setRepositoryUrl(request.getRepositoryUrl());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getAwsLogGroupName() != null) {
            project.setAwsLogGroupName(request.getAwsLogGroupName());
        }
        if (request.getGithubRepoName() != null) {
            project.setGithubRepoName(request.getGithubRepoName());
        }
        if (request.getLokiAppLabel() != null) {
            project.setLokiAppLabel(request.getLokiAppLabel());
        }
        if (request.getOciLogGroupOcid() != null) {
            project.setOciLogGroupOcid(request.getOciLogGroupOcid());
        }
        if (request.getCredentialsJson() != null) {
            project.setCredentialsJson(request.getCredentialsJson());
        }

        Project updatedProject = projectRepository.save(project);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new AuditEvent(
                    this, currentUser, "PROJECT_UPDATE", "PROJECT", updatedProject.getId().toString(), "Updated project: " + updatedProject.getProjectName()
            ));
        }

        return mapToResponse(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        verifyOwnerOrAdmin(project, currentUser);
        
        // Clean up dependencies to avoid foreign key constraint violations
        logRepository.deleteLogsByProjectId(id);
        deploymentRepository.deleteByProjectId(id);
        incidentRepository.deleteByProject_Id(id);
        commitLogRepository.deleteByProject_Id(id);
        pipelineRunRepository.deleteByProject_Id(id);
        logSourceRepository.deleteByProject_Id(id);

        projectRepository.delete(project);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new AuditEvent(
                    this, currentUser, "PROJECT_DELETE", "PROJECT", id.toString(), "Deleted project: " + project.getProjectName()
            ));
        }
    }

    @Transactional
    public ProjectResponse completeProjectSetup(Long id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        verifyOwnerOrAdmin(project, currentUser);
        project.setStatus("ACTIVE");
        Project updatedProject = projectRepository.save(project);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new AuditEvent(
                    this, currentUser, "PROJECT_SETUP_COMPLETE", "PROJECT", updatedProject.getId().toString(), "Completed setup for project: " + updatedProject.getProjectName()
            ));
        }

        return mapToResponse(updatedProject);
    }

    public void verifyOwnerOrAdmin(Project project, User currentUser) {
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = isAdministrator(currentUser);

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Only the project owner or an Administrator can access/update/delete this project");
        }
    }

    private boolean isAdministrator(User user) {
        return user.getRoles().stream()
                .anyMatch(r -> r.getRoleName().equalsIgnoreCase("ADMIN") ||
                               r.getRoleName().equalsIgnoreCase("ROLE_ADMIN"));
    }

    private ProjectResponse mapToResponse(Project project) {
        String deployedUrl = null; // OpsPilot does not host projects; see the integrations for where they run
        ProjectResponse response = new ProjectResponse(
                project.getId(),
                project.getProjectName(),
                project.getDescription(),
                project.getRepositoryUrl(),
                project.getOwner().getId(),
                project.getOwner().getName(),
                project.getOwner().getEmail(),
                deployedUrl,
                project.getAwsLogGroupName(),
                project.getGithubRepoName(),
                project.getLokiAppLabel(),
                project.getOciLogGroupOcid(),
                project.getCredentialsJson(),
                project.getStatus(),
                project.getCreatedAt()
        );
        response.setSlug(project.getSlug());
        response.setEnvironment(project.getEnvironment());
        return response;
    }
}
