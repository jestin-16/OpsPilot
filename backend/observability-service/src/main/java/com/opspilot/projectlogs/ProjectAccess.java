package com.opspilot.projectlogs;

import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.ProjectRepository;
import org.springframework.stereotype.Component;

/** Same rule as the rest of the platform: the project owner, or an ADMIN / DEVOPS user. */
@Component
public class ProjectAccess {

    private final ProjectRepository projectRepository;

    public ProjectAccess(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public Project require(Long projectId, User user) {
        if (user == null) {
            throw new ForbiddenException("Authentication is required to view logs");
        }
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        if (!project.getOwner().getId().equals(user.getId()) && !isPrivileged(user)) {
            throw new ForbiddenException("You do not have permission to view logs for this project");
        }
        return project;
    }

    static boolean isPrivileged(User user) {
        if (user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(role -> {
            String name = role.getRoleName() != null ? role.getRoleName().toUpperCase() : "";
            return name.contains("ADMIN") || name.contains("DEVOPS");
        });
    }
}
