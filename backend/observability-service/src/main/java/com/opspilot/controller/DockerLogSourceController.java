package com.opspilot.controller;

import com.opspilot.dto.DockerLogSourceRequest;
import com.opspilot.dto.DockerLogSourceResponse;
import com.opspilot.entity.User;
import com.opspilot.service.DockerLogSourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** CRUD for push-model Docker log sources. Behind JWT; the raw token is returned only on create and rotate. */
@RestController
@RequestMapping({"/api/v1/monitoring/sources", "/api/monitoring/sources"})
@PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
public class DockerLogSourceController {

    private final DockerLogSourceService service;

    public DockerLogSourceController(DockerLogSourceService service) {
        this.service = service;
    }

    @GetMapping
    public List<DockerLogSourceResponse> list(@AuthenticationPrincipal User user) {
        return service.list(user);
    }

    @GetMapping("/{id}")
    public DockerLogSourceResponse get(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return service.get(id, user);
    }

    @GetMapping("/{id}/agent-config")
    public DockerLogSourceResponse getAgentConfig(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return service.getAgentConfig(id, user);
    }

    @PostMapping
    public ResponseEntity<DockerLogSourceResponse> create(@RequestBody DockerLogSourceRequest request,
                                                          @AuthenticationPrincipal User user) {
        return ResponseEntity.status(201).body(service.create(request, user));
    }

    @PutMapping("/{id}")
    public DockerLogSourceResponse update(@PathVariable UUID id, @RequestBody DockerLogSourceRequest request,
                                          @AuthenticationPrincipal User user) {
        return service.update(id, request, user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        service.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/rotate-token")
    public DockerLogSourceResponse rotate(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return service.rotateToken(id, user);
    }
}
