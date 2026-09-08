package com.opspilot.controller;

import com.opspilot.entity.LogEntity;
import com.opspilot.entity.LogSourceEntity;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.LogSourceRepository;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.service.FieldMappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class LogSourceController {

    @Autowired
    private LogSourceRepository logSourceRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FieldMappingService fieldMappingService;

    @GetMapping("/projects/{projectId}/log-sources")
    public ResponseEntity<List<LogSourceEntity>> getLogSources(@PathVariable Long projectId, @AuthenticationPrincipal User currentUser) {
        assertProjectAccess(projectId, currentUser);
        List<LogSourceEntity> sources = logSourceRepository.findByProject_Id(projectId);
        // Mask the authConfig to avoid returning plaintext secrets
        sources.forEach(s -> {
            if (s.getAuthConfig() != null) {
                s.setAuthConfig("{\"masked\": true}");
            }
        });
        return ResponseEntity.ok(sources);
    }

    @PostMapping("/projects/{projectId}/log-sources")
    public ResponseEntity<?> createLogSource(@PathVariable Long projectId, @RequestBody LogSourceEntity logSource, @AuthenticationPrincipal User currentUser) {
        assertProjectAccess(projectId, currentUser);
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));
        logSource.setProject(project);

        String generatedSecret = null;
        String webhookUrl = null;

        if ("WEBHOOK".equalsIgnoreCase(logSource.getIngestionMode())) {
            // Generate public ID
            logSource.setPublicId(java.util.UUID.randomUUID().toString());

            // Generate secret
            byte[] secretBytes = new byte[32];
            new java.security.SecureRandom().nextBytes(secretBytes);
            generatedSecret = java.util.Base64.getEncoder().encodeToString(secretBytes);

            logSource.setAuthMethod("HEADER_SECRET");
            String authConfigJson = String.format("{\"headerName\":\"x-webhook-secret\", \"secretValue\":\"%s\"}", generatedSecret);
            logSource.setAuthConfig(authConfigJson);

            webhookUrl = "/api/v1/ingest/webhook/" + logSource.getPublicId();
        } else if (logSource.getPublicId() == null) {
             logSource.setPublicId(java.util.UUID.randomUUID().toString());
        }

        LogSourceEntity saved = logSourceRepository.save(logSource);

        if ("WEBHOOK".equalsIgnoreCase(logSource.getIngestionMode())) {
            return ResponseEntity.ok(Map.of(
                    "sourceId", saved.getSourceId(),
                    "publicId", saved.getPublicId(),
                    "webhookUrl", webhookUrl,
                    "secret", generatedSecret
            ));
        }

        return ResponseEntity.ok(saved);
    }

    @Autowired
    private LogRepository logRepository;

    @GetMapping("/log-sources/{sourceId}/status")
    public ResponseEntity<?> getLogSourceStatus(@PathVariable Long sourceId, @AuthenticationPrincipal User currentUser) {
        LogSourceEntity source = logSourceRepository.findById(sourceId)
                .orElseThrow(() -> new RuntimeException("Source not found"));
        assertProjectAccess(source.getProject().getId(), currentUser);
        
        Optional<LogEntity> latestLog = logRepository.findFirstBySourceServiceOrderByTimestampDesc(source.getSourceName());
        
        boolean hasReceived = latestLog.isPresent();
        Object lastEventAt = hasReceived ? latestLog.get().getTimestamp().toString() : null;

        return ResponseEntity.ok(Map.of(
                "hasReceivedFirstEvent", hasReceived,
                "lastEventAt", lastEventAt != null ? lastEventAt : ""
        ));
    }

    @PutMapping("/log-sources/{sourceId}")
    public ResponseEntity<LogSourceEntity> updateLogSource(@PathVariable Long sourceId, @RequestBody LogSourceEntity logSource, @AuthenticationPrincipal User currentUser) {
        LogSourceEntity existing = logSourceRepository.findById(sourceId).orElseThrow(() -> new RuntimeException("Source not found"));
        assertProjectAccess(existing.getProject().getId(), currentUser);
        existing.setSourceName(logSource.getSourceName());
        existing.setIngestionMode(logSource.getIngestionMode());
        existing.setFieldMapping(logSource.getFieldMapping());
        existing.setAuthMethod(logSource.getAuthMethod());
        // Don't update authConfig if it's masked
        if (logSource.getAuthConfig() != null && !logSource.getAuthConfig().contains("\"masked\": true")) {
            existing.setAuthConfig(logSource.getAuthConfig());
        }
        existing.setPollEndpointUrl(logSource.getPollEndpointUrl());
        existing.setPollIntervalSeconds(logSource.getPollIntervalSeconds());
        existing.setIsActive(logSource.getIsActive());
        
        LogSourceEntity saved = logSourceRepository.save(existing);
        saved.setAuthConfig("{\"masked\": true}");
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/log-sources/{sourceId}")
    public ResponseEntity<Void> deleteLogSource(@PathVariable Long sourceId, @AuthenticationPrincipal User currentUser) {
        LogSourceEntity source = logSourceRepository.findById(sourceId).orElseThrow(() -> new RuntimeException("Source not found"));
        assertProjectAccess(source.getProject().getId(), currentUser);
        logSourceRepository.deleteById(sourceId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/log-sources/{sourceId}/test")
    public ResponseEntity<?> testMapping(@PathVariable Long sourceId, @RequestBody String payload, @AuthenticationPrincipal User currentUser) {
        LogSourceEntity source = logSourceRepository.findById(sourceId).orElseThrow(() -> new RuntimeException("Source not found"));
        assertProjectAccess(source.getProject().getId(), currentUser);
        Optional<LogEntity> mapped = fieldMappingService.mapPayload(payload, source.getFieldMapping(), source.getSourceName());
        if (mapped.isPresent()) {
            return ResponseEntity.ok(mapped.get());
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Failed to map payload with provided configuration"));
    }

    private void assertProjectAccess(Long projectId, User user) {
        if (user == null) throw new ForbiddenException("Authentication is required");
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));
        boolean isAdmin = user.getRoles().stream().anyMatch(role -> "ADMIN".equalsIgnoreCase(role.getRoleName()) || "ROLE_ADMIN".equalsIgnoreCase(role.getRoleName()));
        if (!isAdmin && !project.getOwner().getId().equals(user.getId())) throw new ForbiddenException("Only the project owner or an Administrator can manage this log source");
    }
}
