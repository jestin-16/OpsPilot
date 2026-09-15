package com.opspilot.service;

import com.opspilot.entity.ContainerEntity;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.ContainerRepository;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.core.DockerClientImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DockerService {

    @Autowired
    private ContainerRepository containerRepository;

    private final DockerClient dockerClient = DockerClientImpl.getInstance();

    public List<ContainerEntity> getContainersForUser(User currentUser) {
        List<ContainerEntity> containers = isAdministrator(currentUser)
                ? containerRepository.findAll()
                : containerRepository.findByDeployment_Project_Owner(currentUser);
        List<Container> daemonContainers = dockerClient.listContainersCmd().withShowAll(true).exec();
        containers.forEach(container -> findDaemonContainer(container, daemonContainers)
                .ifPresent(daemon -> container.setContainerStatus(daemon.getState().equalsIgnoreCase("running") ? "RUNNING" : "STOPPED")));
        return containerRepository.saveAll(containers);
    }

    public ContainerEntity startContainer(Long containerId, User currentUser) {
        ContainerEntity container = getContainerForUser(containerId, currentUser);
        dockerClient.startContainerCmd(findDaemonContainer(container).getId()).exec();
        container.setContainerStatus("RUNNING");
        return containerRepository.save(container);
    }

    public ContainerEntity stopContainer(Long containerId, User currentUser) {
        ContainerEntity container = getContainerForUser(containerId, currentUser);
        dockerClient.stopContainerCmd(findDaemonContainer(container).getId()).exec();
        container.setContainerStatus("STOPPED");
        return containerRepository.save(container);
    }

    public ContainerEntity restartContainer(Long containerId, User currentUser) {
        ContainerEntity container = getContainerForUser(containerId, currentUser);
        dockerClient.restartContainerCmd(findDaemonContainer(container).getId()).exec();
        container.setContainerStatus("RUNNING");
        return containerRepository.save(container);
    }

    private Container findDaemonContainer(ContainerEntity container) {
        return findDaemonContainer(container, dockerClient.listContainersCmd().withShowAll(true).exec())
                .orElseThrow(() -> new IllegalStateException("Docker container for image '" + container.getImageName() + "' is not available"));
    }

    private java.util.Optional<Container> findDaemonContainer(ContainerEntity container, List<Container> daemonContainers) {
        return daemonContainers.stream()
                .filter(daemon -> container.getImageName().equals(daemon.getImage()))
                .findFirst();
    }

    private ContainerEntity getContainerForUser(Long containerId, User currentUser) {
        ContainerEntity container = containerRepository.findById(containerId)
                .orElseThrow(() -> new RuntimeException("Container not found with id: " + containerId));

        boolean isCreator = container.getDeployment().getProject().getOwner().getId().equals(currentUser.getId());
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
