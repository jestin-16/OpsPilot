package com.opspilot.service;

import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.event.AuditEvent;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.LogSourceRepository;
import com.opspilot.repository.PipelineRunRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private io.micrometer.core.instrument.MeterRegistry meterRegistry;

    public List<ProjectResponse> getAllProjectsForUser(User currentUser) {
        boolean isAdmin = isAdministrator(currentUser);
        List<Project> projects = isAdmin ? projectRepository.findAll() : projectRepository.findByOwner(currentUser);

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

        boolean isAdmin = isAdministrator(currentUser);
        org.springframework.data.domain.Page<Project> projectPage = isAdmin
                ? projectRepository.findAll(pageable)
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

    public ProjectResponse getProjectById(Long id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (currentUser != null) {
            verifyOwnerOrAdmin(project, currentUser);
        }

        return mapToResponse(project);
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, User currentUser) {
        if (projectRepository.existsByProjectNameAndOwner(request.getProjectName(), currentUser)) {
            throw new IllegalArgumentException("Project name must be unique per user");
        }

        if (request.getRepositoryUrl() != null && !request.getRepositoryUrl().isEmpty()) {
            if (!request.getRepositoryUrl().matches(".*(github\\.com|gitlab\\.com).*")) {
                throw new IllegalArgumentException("Repository URL must be a valid github.com or gitlab.com URL");
            }
        }

        Project project = new Project(
                request.getProjectName(),
                request.getDescription(),
                request.getRepositoryUrl(),
                currentUser,
                "SETUP_IN_PROGRESS"
        );
        project.setAwsLogGroupName(request.getAwsLogGroupName());
        project.setGithubRepoName(request.getGithubRepoName());
        project.setLokiAppLabel(request.getLokiAppLabel());
        project.setOciLogGroupOcid(request.getOciLogGroupOcid());
        project.setCredentialsJson(request.getCredentialsJson());

        Project savedProject = projectRepository.save(project);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new AuditEvent(
                    this, currentUser, "PROJECT_CREATE", "PROJECT", savedProject.getId().toString(), "Created project: " + savedProject.getProjectName()
            ));
        }

        meterRegistry.counter("project.create.success").increment();

        return mapToResponse(savedProject);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        verifyOwnerOrAdmin(project, currentUser);

        if (request.getProjectName() != null) {
            project.setProjectName(request.getProjectName());
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
                .anyMatch(r -> r.getRoleName().equalsIgnoreCase("Administrator") ||
                               r.getRoleName().equalsIgnoreCase("ROLE_ADMINISTRATOR") ||
                               r.getRoleName().equalsIgnoreCase("ADMIN"));
    }

    private ProjectResponse mapToResponse(Project project) {
        String deployedUrl = "http://localhost:8080/api/v1/projects/" + project.getId() + "/output";
        return new ProjectResponse(
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
    }
}
