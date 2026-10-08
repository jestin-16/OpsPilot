package com.opspilot.service;

import com.opspilot.entity.ContainerEntity;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.ContainerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DockerService {

    @Autowired
    private ContainerRepository containerRepository;

    public List<ContainerEntity> getContainersForUser(User currentUser) {
        return isPrivileged(currentUser)
                ? containerRepository.findAll()
                : containerRepository.findByDeployment_Project_Owner(currentUser);
    }

    public ContainerEntity startContainer(Long containerId, User currentUser) {
        throw new UnsupportedOperationException("Remote container management is not supported in the push-model architecture.");
    }

    public ContainerEntity stopContainer(Long containerId, User currentUser) {
        throw new UnsupportedOperationException("Remote container management is not supported in the push-model architecture.");
    }

    public ContainerEntity restartContainer(Long containerId, User currentUser) {
        throw new UnsupportedOperationException("Remote container management is not supported in the push-model architecture.");
    }

    private ContainerEntity getContainerForUser(Long containerId, User currentUser) {
        ContainerEntity container = containerRepository.findById(containerId)
                .orElseThrow(() -> new RuntimeException("Container not found with id: " + containerId));

        boolean isCreator = container.getDeployment().getProject().getOwner().getId().equals(currentUser.getId());
        if (!isCreator && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have access to this container");
        }
        return container;
    }

    private boolean isPrivileged(User user) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(role -> {
            String name = role.getRoleName() != null ? role.getRoleName().toUpperCase() : "";
            return name.contains("ADMIN") || name.contains("DEVOPS");
        });
    }
}
