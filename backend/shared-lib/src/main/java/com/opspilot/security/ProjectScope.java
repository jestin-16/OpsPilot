package com.opspilot.security;

import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.ProjectRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * The platform's project read rule, shared by every service: a project's data is visible to its owner and
 * to ADMIN or DEVOPS users. Data with no project (for example a webhook event that matched no repository)
 * is visible to ADMIN and DEVOPS only.
 */
@Component
public class ProjectScope {

    private final ProjectRepository projects;

    public ProjectScope(ProjectRepository projects) {
        this.projects = projects;
    }

    public static boolean isPrivileged(User user) {
        if (user == null || user.getRoles() == null) {
            return false;
        }
        return user.getRoles().stream().anyMatch(role -> {
            String name = role.getRoleName() != null ? role.getRoleName().toUpperCase() : "";
            return name.contains("ADMIN") || name.contains("DEVOPS");
        });
    }

    public boolean canAccess(Project project, User user) {
        if (user == null) {
            return false;
        }
        if (isPrivileged(user)) {
            return true;
        }
        return project != null && project.getOwner() != null && project.getOwner().getId().equals(user.getId());
    }

    /** Loads the project and checks access: 404 if it doesn't exist, 403 if the user may not see it. */
    public Project require(Long projectId, User user) {
        if (user == null) {
            throw new ForbiddenException("Authentication is required");
        }
        Project project = projects.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        requireAccess(project, user);
        return project;
    }

    public void requireAccess(Project project, User user) {
        if (!canAccess(project, user)) {
            throw new ForbiddenException("You do not have access to this project");
        }
    }

    /** For rows that store a plain project id; a null id is project-less data. */
    public void requireAccessToProjectId(Long projectId, User user) {
        if (isPrivileged(user)) {
            return;
        }
        if (projectId == null) {
            throw new ForbiddenException("You do not have access to this resource");
        }
        require(projectId, user);
    }

    /**
     * The ids of the projects the user may see, for use in a query's IN clause. Empty Optional means "every
     * project" (ADMIN / DEVOPS), so callers can keep their unfiltered query.
     */
    public Optional<List<Long>> visibleProjectIds(User user) {
        if (isPrivileged(user)) {
            return Optional.empty();
        }
        if (user == null) {
            return Optional.of(List.of());
        }
        return Optional.of(projects.findIdsByOwner(user));
    }
}
