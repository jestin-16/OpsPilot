package com.opspilot.controller;

import com.opspilot.dto.DeploymentResponse;
import com.opspilot.service.DeploymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/deployments", "/api/deployments"})
public class GlobalDeploymentController {

    @Autowired
    private DeploymentService deploymentService;

    @GetMapping
    public ResponseEntity<List<DeploymentResponse>> getAllDeployments() {
        return ResponseEntity.ok(deploymentService.getAllDeployments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeploymentResponse> getDeployment(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(deploymentService.getDeploymentById(id));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<com.opspilot.entity.LogEntity>> getDeploymentLogs(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(deploymentService.getDeploymentLogs(id));
    }

    @org.springframework.web.bind.annotation.PostMapping("/{id}/rollback")
    public ResponseEntity<DeploymentResponse> rollbackDeployment(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.opspilot.entity.User currentUser) {
        return ResponseEntity.ok(deploymentService.rollbackDeployment(id, currentUser));
    }
}
