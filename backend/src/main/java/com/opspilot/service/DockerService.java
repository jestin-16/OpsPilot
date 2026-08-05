package com.opspilot.service;

import com.opspilot.entity.ContainerEntity;
import com.opspilot.repository.ContainerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DockerService {

    @Autowired
    private ContainerRepository containerRepository;

    public List<ContainerEntity> getAllContainers() {
        return containerRepository.findAll();
    }

    public ContainerEntity startContainer(Long containerId) {
        ContainerEntity container = containerRepository.findById(containerId)
                .orElseThrow(() -> new RuntimeException("Container not found with id: " + containerId));
        container.setContainerStatus("RUNNING");
        return containerRepository.save(container);
    }

    public ContainerEntity stopContainer(Long containerId) {
        ContainerEntity container = containerRepository.findById(containerId)
                .orElseThrow(() -> new RuntimeException("Container not found with id: " + containerId));
        container.setContainerStatus("STOPPED");
        return containerRepository.save(container);
    }

    public ContainerEntity restartContainer(Long containerId) {
        ContainerEntity container = containerRepository.findById(containerId)
                .orElseThrow(() -> new RuntimeException("Container not found with id: " + containerId));
        container.setContainerStatus("RUNNING");
        return containerRepository.save(container);
    }
}
