package com.opspilot.controller;

import com.opspilot.entity.ContainerEntity;
import com.opspilot.service.DockerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/docker")
public class DockerController {

    @Autowired
    private DockerService dockerService;

    @GetMapping("/containers")
    public ResponseEntity<List<ContainerEntity>> getContainers() {
        return ResponseEntity.ok(dockerService.getAllContainers());
    }

    @PostMapping("/containers/{id}/start")
    public ResponseEntity<ContainerEntity> startContainer(@PathVariable Long id) {
        return ResponseEntity.ok(dockerService.startContainer(id));
    }

    @PostMapping("/containers/{id}/stop")
    public ResponseEntity<ContainerEntity> stopContainer(@PathVariable Long id) {
        return ResponseEntity.ok(dockerService.stopContainer(id));
    }

    @PostMapping("/containers/{id}/restart")
    public ResponseEntity<ContainerEntity> restartContainer(@PathVariable Long id) {
        return ResponseEntity.ok(dockerService.restartContainer(id));
    }
}
