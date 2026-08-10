package com.opspilot.service;

import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.event.AuditEvent;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.ProjectRepository;
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
        Project project = new Project(
                request.getProjectName(),
                request.getDescription(),
                request.getRepositoryUrl(),
                currentUser,
                request.getStatus() != null ? request.getStatus() : "Active"
        );

        Project savedProject = projectRepository.save(project);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new AuditEvent(
                    this, currentUser, "PROJECT_CREATE", "PROJECT", savedProject.getId().toString(), "Created project: " + savedProject.getProjectName()
            ));
        }

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

        projectRepository.delete(project);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new AuditEvent(
                    this, currentUser, "PROJECT_DELETE", "PROJECT", id.toString(), "Deleted project: " + project.getProjectName()
            ));
        }
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
                project.getStatus(),
                project.getCreatedAt()
        );
    }
}
