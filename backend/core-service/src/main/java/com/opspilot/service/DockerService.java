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
        return isAdministrator(currentUser)
                ? containerRepository.findAll()
                : containerRepository.findByDeployment_DeployedBy(currentUser);
    }

    public ContainerEntity startContainer(Long containerId, User currentUser) {
        ContainerEntity container = getContainerForUser(containerId, currentUser);
        container.setContainerStatus("RUNNING");
        return containerRepository.save(container);
    }

    public ContainerEntity stopContainer(Long containerId, User currentUser) {
        ContainerEntity container = getContainerForUser(containerId, currentUser);
        container.setContainerStatus("STOPPED");
        return containerRepository.save(container);
    }

    public ContainerEntity restartContainer(Long containerId, User currentUser) {
        ContainerEntity container = getContainerForUser(containerId, currentUser);
        container.setContainerStatus("RUNNING");
        return containerRepository.save(container);
    }

    private ContainerEntity getContainerForUser(Long containerId, User currentUser) {
        ContainerEntity container = containerRepository.findById(containerId)
                .orElseThrow(() -> new RuntimeException("Container not found with id: " + containerId));

        boolean isCreator = container.getDeployment().getDeployedBy().getId().equals(currentUser.getId());
        if (!isCreator && !isAdministrator(currentUser)) {
            throw new ForbiddenException("You do not have access to this container");
        }
        return container;
    }

    private boolean isAdministrator(User user) {
        return user.getRoles().stream().anyMatch(role ->
                role.getRoleName().equalsIgnoreCase("ADMIN") ||
                role.getRoleName().equalsIgnoreCase("ROLE_ADMIN"));
    }
}
