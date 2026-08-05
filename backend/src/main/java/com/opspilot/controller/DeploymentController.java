package com.opspilot.controller;

import com.opspilot.dto.DeploymentRequest;
import com.opspilot.dto.DeploymentResponse;
import com.opspilot.entity.User;
import com.opspilot.service.DeploymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/deployments")
public class DeploymentController {

    @Autowired
    private DeploymentService deploymentService;

    @PostMapping
    public ResponseEntity<DeploymentResponse> createDeployment(
            @PathVariable Long projectId,
            @Valid @RequestBody DeploymentRequest request,
            @AuthenticationPrincipal User currentUser) {
        DeploymentResponse response = deploymentService.createDeployment(projectId, request, currentUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<DeploymentResponse>> getDeployments(@PathVariable Long projectId) {
        List<DeploymentResponse> deployments = deploymentService.getDeploymentsForProject(projectId);
        return ResponseEntity.ok(deployments);
    }
}
