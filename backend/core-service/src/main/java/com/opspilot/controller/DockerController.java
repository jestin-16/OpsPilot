package com.opspilot.controller;

import com.opspilot.entity.ContainerEntity;
import com.opspilot.entity.User;
import com.opspilot.service.DockerService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/docker", "/api/docker"})
public class DockerController {

    @Autowired
    private DockerService dockerService;

    @GetMapping("/containers")
    public ResponseEntity<List<ContainerEntity>> getContainers(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(dockerService.getContainersForUser(currentUser));
    }

    @PostMapping("/containers/{id}/start")
    public ResponseEntity<ContainerEntity> startContainer(@PathVariable Long id,
                                                           @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(dockerService.startContainer(id, currentUser));
    }

    @PostMapping("/containers/{id}/stop")
    public ResponseEntity<ContainerEntity> stopContainer(@PathVariable Long id,
                                                          @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(dockerService.stopContainer(id, currentUser));
    }

    @PostMapping("/containers/{id}/restart")
    public ResponseEntity<ContainerEntity> restartContainer(@PathVariable Long id,
                                                             @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(dockerService.restartContainer(id, currentUser));
    }
}
