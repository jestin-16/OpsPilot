package com.opspilot.controller;

import com.opspilot.entity.LogEntity;
import com.opspilot.entity.LogSourceEntity;
import com.opspilot.entity.Project;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.LogSourceRepository;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.service.FieldMappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<List<LogSourceEntity>> getLogSources(@PathVariable Long projectId) {
        return ResponseEntity.ok(logSourceRepository.findByProject_Id(projectId));
    }

    @PostMapping("/projects/{projectId}/log-sources")
    public ResponseEntity<LogSourceEntity> createLogSource(@PathVariable Long projectId, @RequestBody LogSourceEntity logSource) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new RuntimeException("Project not found"));
        logSource.setProject(project);
        return ResponseEntity.ok(logSourceRepository.save(logSource));
    }

    @PutMapping("/log-sources/{sourceId}")
    public ResponseEntity<LogSourceEntity> updateLogSource(@PathVariable Long sourceId, @RequestBody LogSourceEntity logSource) {
        LogSourceEntity existing = logSourceRepository.findById(sourceId).orElseThrow(() -> new RuntimeException("Source not found"));
        existing.setSourceName(logSource.getSourceName());
        existing.setIngestionMode(logSource.getIngestionMode());
        existing.setFieldMapping(logSource.getFieldMapping());
        existing.setAuthMethod(logSource.getAuthMethod());
        existing.setAuthConfig(logSource.getAuthConfig());
        existing.setPollEndpointUrl(logSource.getPollEndpointUrl());
        existing.setPollIntervalSeconds(logSource.getPollIntervalSeconds());
        existing.setIsActive(logSource.getIsActive());
        return ResponseEntity.ok(logSourceRepository.save(existing));
    }

    @DeleteMapping("/log-sources/{sourceId}")
    public ResponseEntity<Void> deleteLogSource(@PathVariable Long sourceId) {
        logSourceRepository.deleteById(sourceId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/log-sources/{sourceId}/test")
    public ResponseEntity<?> testMapping(@PathVariable Long sourceId, @RequestBody String payload) {
        LogSourceEntity source = logSourceRepository.findById(sourceId).orElseThrow(() -> new RuntimeException("Source not found"));
        Optional<LogEntity> mapped = fieldMappingService.mapPayload(payload, source.getFieldMapping(), source.getSourceName());
        if (mapped.isPresent()) {
            return ResponseEntity.ok(mapped.get());
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Failed to map payload with provided configuration"));
    }
}
