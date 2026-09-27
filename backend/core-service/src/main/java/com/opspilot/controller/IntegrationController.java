package com.opspilot.controller;

import com.opspilot.dto.IntegrationRequest;
import com.opspilot.dto.IntegrationResponse;
import com.opspilot.entity.User;
import com.opspilot.service.IntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class IntegrationController {

    @Autowired
    private IntegrationService integrationService;

    @PostMapping("/projects/{projectId}/integrations")
    public ResponseEntity<IntegrationResponse> createIntegration(
            @PathVariable Long projectId,
            @RequestBody IntegrationRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.createIntegration(projectId, request, currentUser));
    }

    @GetMapping("/projects/{projectId}/integrations")
    public ResponseEntity<List<IntegrationResponse>> getIntegrationsByProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.getIntegrationsByProject(projectId, currentUser));
    }

    @GetMapping("/integrations/{integrationId}")
    public ResponseEntity<IntegrationResponse> getIntegrationById(
            @PathVariable Long integrationId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.getIntegrationById(integrationId, currentUser));
    }

    @DeleteMapping("/integrations/{integrationId}")
    public ResponseEntity<Void> deleteIntegration(
            @PathVariable Long integrationId,
            @AuthenticationPrincipal User currentUser) {
        integrationService.deleteIntegration(integrationId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
