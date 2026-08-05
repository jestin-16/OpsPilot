package com.opspilot.service;

import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    public List<ProjectResponse> getAllProjectsForUser(User currentUser) {
        // If administrator, return all projects, otherwise return projects created by user or all accessible projects
        boolean isAdmin = isAdministrator(currentUser);
        List<Project> projects = isAdmin ? projectRepository.findAll() : projectRepository.findByOwner(currentUser);

        // Fallback: If non-admin user has no created projects yet, show all projects or their own
        if (!isAdmin && projects.isEmpty()) {
            projects = projectRepository.findAll();
        }

        return projects.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
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
        return mapToResponse(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        verifyOwnerOrAdmin(project, currentUser);

        projectRepository.delete(project);
    }

    public void verifyOwnerOrAdmin(Project project, User currentUser) {
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = isAdministrator(currentUser);

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Only the project owner or an Administrator can update/delete a project");
        }
    }

    private boolean isAdministrator(User user) {
        return user.getRoles().stream()
                .anyMatch(r -> r.getRoleName().equalsIgnoreCase("Administrator") ||
                               r.getRoleName().equalsIgnoreCase("ROLE_ADMINISTRATOR") ||
                               r.getRoleName().equalsIgnoreCase("ADMIN"));
    }

    private ProjectResponse mapToResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getProjectName(),
                project.getDescription(),
                project.getRepositoryUrl(),
                project.getOwner().getId(),
                project.getOwner().getName(),
                project.getOwner().getEmail(),
                project.getStatus(),
                project.getCreatedAt()
        );
    }
}
