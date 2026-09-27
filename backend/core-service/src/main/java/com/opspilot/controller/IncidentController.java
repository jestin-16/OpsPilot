package com.opspilot.controller;

import com.opspilot.entity.Incident;
import com.opspilot.service.IncidentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/incidents", "/api/incidents"})
public class IncidentController {

    @Autowired
    private IncidentService incidentService;

    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents(
            @RequestParam(required = false) Long projectId) {
        if (projectId != null) {
            return ResponseEntity.ok(incidentService.getIncidentsByProject(projectId));
        }
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncident(@PathVariable Long id) {
        return incidentService.getIncidentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody Map<String, Object> payload) {
        Long projectId = payload.get("projectId") != null ? Long.valueOf(payload.get("projectId").toString()) : null;
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        String severity = (String) payload.get("severity");
        String affectedService = (String) payload.get("affectedService");
        
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
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(incidentService.updateIncidentStatus(id, status));
    }
}
