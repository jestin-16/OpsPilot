package com.opspilot.controller;

import com.opspilot.entity.Resource;
import com.opspilot.service.ResourceService;
import com.opspilot.entity.User;
import com.opspilot.security.ProjectScope;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    @Autowired
    private ProjectScope projectScope;

    @GetMapping("/projects/{projectId}/resources")
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> getResourcesByProject(@PathVariable Long projectId, @AuthenticationPrincipal User currentUser) {
        projectScope.require(projectId, currentUser);
        return ResponseEntity.ok(resourceService.getResourcesByProject(projectId));
    }

    @GetMapping("/resources")
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> getAllResources(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectScope.visibleProjectIds(currentUser)
                .map(resourceService::getResourcesForProjects)
                .orElseGet(resourceService::getAllResources));
    }

    @GetMapping("/integrations/{integrationId}/resources")
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> getResourcesByIntegration(@PathVariable Long integrationId, @AuthenticationPrincipal User currentUser) {
        projectScope.requireAccessToProjectId(resourceService.projectIdOfIntegration(integrationId), currentUser);
        return ResponseEntity.ok(resourceService.getResourcesByIntegration(integrationId));
    }
    
    @PostMapping("/integrations/{integrationId}/resources/sync")
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> syncResources(@PathVariable Long integrationId, @AuthenticationPrincipal User currentUser) {
        projectScope.requireAccessToProjectId(resourceService.projectIdOfIntegration(integrationId), currentUser);
        return ResponseEntity.ok(resourceService.syncResources(integrationId));
    }
}
