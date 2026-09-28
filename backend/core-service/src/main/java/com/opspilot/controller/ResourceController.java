package com.opspilot.controller;

import com.opspilot.entity.Resource;
import com.opspilot.service.ResourceService;
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

    @GetMapping("/projects/{projectId}/resources")
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> getResourcesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(resourceService.getResourcesByProject(projectId));
    }

    @GetMapping("/resources")
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    @GetMapping("/integrations/{integrationId}/resources")
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> getResourcesByIntegration(@PathVariable Long integrationId) {
        return ResponseEntity.ok(resourceService.getResourcesByIntegration(integrationId));
    }
    
    @PostMapping("/integrations/{integrationId}/resources/sync")
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Resource>> syncResources(@PathVariable Long integrationId) {
        return ResponseEntity.ok(resourceService.syncResources(integrationId));
    }
}
