package com.opspilot.controller;

import com.opspilot.dto.PipelineSourceRequest;
import com.opspilot.dto.PipelineSourceResponse;
import com.opspilot.service.PipelineSourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** CRUD for standalone CI/CD sources. Behind JWT; secrets are masked except on create / explicit reveal / regenerate. */
@RestController
@RequestMapping({"/api/v1/cicd/sources", "/api/cicd/sources"})
@PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
public class PipelineSourceController {

    @Autowired
    private PipelineSourceService sourceService;

    @GetMapping
    public List<PipelineSourceResponse> list() {
        return sourceService.list();
    }

    @GetMapping("/{id}")
    public PipelineSourceResponse get(@PathVariable Long id) {
        return sourceService.get(id);
    }

    @PostMapping
    public ResponseEntity<PipelineSourceResponse> create(@RequestBody PipelineSourceRequest request) {
        return ResponseEntity.status(201).body(sourceService.create(request));
    }

    @PutMapping("/{id}")
    public PipelineSourceResponse update(@PathVariable Long id, @RequestBody PipelineSourceRequest request) {
        return sourceService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        sourceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/test")
    public Map<String, Object> test(@PathVariable Long id) {
        return sourceService.testConnection(id);
    }

    @PostMapping("/{id}/reveal-secret")
    public PipelineSourceResponse reveal(@PathVariable Long id) {
        return sourceService.revealSecret(id);
    }

    @PostMapping("/{id}/regenerate-secret")
    public PipelineSourceResponse regenerate(@PathVariable Long id) {
        return sourceService.regenerateSecret(id);
    }
}
