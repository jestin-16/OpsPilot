package com.opspilot.controller;

import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.dto.IntegrationRequest;
import com.opspilot.dto.IntegrationResponse;
import com.opspilot.entity.User;
import com.opspilot.service.IntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;

@RestController
@RequestMapping({"/api/v1", "/api"})
public class IntegrationController {

    @Autowired
    private IntegrationService integrationService;

    @PostMapping("/projects/{projectId}/integrations")
    public ResponseEntity<IntegrationResponse> createIntegration(
            @PathVariable Long projectId,
            @Valid @RequestBody IntegrationRequest request,
            @AuthenticationPrincipal User currentUser) {
        if (request.getProvider() == null) {
            throw new IllegalArgumentException("provider is required");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        return ResponseEntity.ok(integrationService.createIntegration(projectId, request, currentUser));
    }

    @GetMapping("/projects/{projectId}/integrations")
    public ResponseEntity<List<IntegrationResponse>> getIntegrationsByProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.getIntegrationsByProject(projectId, currentUser));
    }

    @GetMapping("/projects/{projectId}/integrations/{integrationId}")
    public ResponseEntity<IntegrationResponse> getProjectIntegration(
            @PathVariable Long projectId,
            @PathVariable Long integrationId,
            @AuthenticationPrincipal User currentUser) {
        IntegrationResponse response = integrationService.getIntegrationById(integrationId, currentUser);
        if (!projectId.equals(response.getProjectId())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/projects/{projectId}/integrations/{integrationId}")
    public ResponseEntity<IntegrationResponse> updateIntegration(
            @PathVariable Long projectId,
            @PathVariable Long integrationId,
            @Valid @RequestBody IntegrationRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.updateIntegration(projectId, integrationId, request, currentUser));
    }

    /** Runs the connector's connection test and returns the integration with its new status and a message. */
    @PostMapping("/projects/{projectId}/integrations/{integrationId}/test")
    public ResponseEntity<IntegrationResponse> testIntegration(
            @PathVariable Long projectId,
            @PathVariable Long integrationId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.testIntegration(projectId, integrationId, currentUser));
    }

    @PostMapping("/projects/{projectId}/integrations/{integrationId}/disconnect")
    public ResponseEntity<IntegrationResponse> disconnectIntegration(
            @PathVariable Long projectId,
            @PathVariable Long integrationId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.disconnectIntegration(projectId, integrationId, currentUser));
    }

    /** Pickers: kind = containers | namespaces | pods (depending on the integration type). */
    @GetMapping("/projects/{projectId}/integrations/{integrationId}/resources")
    public ResponseEntity<List<Map<String, Object>>> discoverResources(
            @PathVariable Long projectId,
            @PathVariable Long integrationId,
            @RequestParam(required = false, defaultValue = "") String kind,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.discoverResources(projectId, integrationId, kind, currentUser));
    }

    @DeleteMapping("/projects/{projectId}/integrations/{integrationId}")
    public ResponseEntity<Void> deleteProjectIntegration(
            @PathVariable Long projectId,
            @PathVariable Long integrationId,
            @AuthenticationPrincipal User currentUser) {
        integrationService.deleteIntegration(projectId, integrationId, currentUser);
        return ResponseEntity.noContent().build();
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

    /**
     * Reads entries directly from the integration's source. Selectors (container, namespace, pod, run, build) narrow it.
     * Live streaming and stored history are served by observability-service at /projects/{id}/logs.
     */
    @GetMapping("/projects/{projectId}/integrations/{integrationId}/history")
    public ResponseEntity<List<LogEntry>> history(
            @PathVariable Long projectId,
            @PathVariable Long integrationId,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String container,
            @RequestParam(required = false) String namespace,
            @RequestParam(required = false) String pod,
            @RequestParam(required = false) String run,
            @RequestParam(required = false) String build,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @AuthenticationPrincipal User currentUser) {
        LogFilters filters = LogFilters.none().level(level).query(q).pageSize(size)
                .selector("container", container).selector("namespace", namespace).selector("pod", pod)
                .selector("run", run).selector("build", build);
        return ResponseEntity.ok(integrationService.history(projectId, integrationId, filters, page, currentUser));
    }

    @GetMapping("/projects/{projectId}/metrics")
    public ResponseEntity<List<com.opspilot.metric.MetricRecord>> getMetrics(
            @PathVariable Long projectId,
            @RequestParam Long integrationId,
            @RequestParam(required = false) java.util.Map<String, Object> params,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(integrationService.getMetrics(projectId, integrationId, params, currentUser));
    }
}
