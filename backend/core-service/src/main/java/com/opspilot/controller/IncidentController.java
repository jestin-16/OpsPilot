package com.opspilot.controller;

import com.opspilot.entity.Incident;
import com.opspilot.entity.User;
import com.opspilot.security.ProjectScope;
import com.opspilot.service.IncidentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/incidents", "/api/incidents"})
public class IncidentController {

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private ProjectScope projectScope;

    private void requireAccess(Incident incident, User currentUser) {
        projectScope.requireAccessToProjectId(incident.getProject() != null ? incident.getProject().getId() : null, currentUser);
    }

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents(
            @RequestParam(required = false) Long projectId,
            @AuthenticationPrincipal User currentUser) {
        if (projectId != null) {
            projectScope.require(projectId, currentUser);
            return ResponseEntity.ok(incidentService.getIncidentsByProject(projectId));
        }
        return ResponseEntity.ok(projectScope.visibleProjectIds(currentUser)
                .map(incidentService::getIncidentsForProjects)
                .orElseGet(incidentService::getAllIncidents));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncident(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        return incidentService.getIncidentById(id)
                .map(incident -> {
                    requireAccess(incident, currentUser);
                    return ResponseEntity.ok(incident);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody Map<String, Object> payload,
                                                   @AuthenticationPrincipal User currentUser) {
        Long projectId = payload.get("projectId") != null ? Long.valueOf(payload.get("projectId").toString()) : null;
        if (projectId == null || projectId <= 0) {
            throw new IllegalArgumentException("projectId is required");
        }
        projectScope.require(projectId, currentUser);
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        String severity = (String) payload.get("severity");
        String affectedService = (String) payload.get("affectedService");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("Incident title is required");
        com.opspilot.validation.FormChecks.text(title, "Incident title", 255);
        com.opspilot.validation.FormChecks.text(description, "Description", 5000);
        com.opspilot.validation.FormChecks.text(affectedService, "Affected service", 255);
        if (affectedService != null && affectedService.matches("(?s).*[\\r\\n\\t].*")) throw new IllegalArgumentException("Affected service must be a single line");
        if (severity == null || !java.util.Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL").contains(severity)) {
            throw new IllegalArgumentException("Choose a valid severity");
        }
        
        Long deploymentId = payload.get("deploymentId") != null ? Long.valueOf(payload.get("deploymentId").toString()) : null;
        Long pipelineRunId = payload.get("pipelineRunId") != null ? Long.valueOf(payload.get("pipelineRunId").toString()) : null;

        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        Incident incident = incidentService.createIncident(
                projectId, title, description, severity, affectedService, deploymentId, pipelineRunId, userEmail
        );

        return ResponseEntity.ok(incident);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Incident> updateIncidentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User currentUser) {
        incidentService.getIncidentById(id).ifPresent(incident -> requireAccess(incident, currentUser));
        String status = payload.get("status");
        return ResponseEntity.ok(incidentService.updateIncidentStatus(id, status));
    }
}
