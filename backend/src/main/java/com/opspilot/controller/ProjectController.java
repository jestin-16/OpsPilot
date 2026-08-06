package com.opspilot.controller;

import com.opspilot.dto.PagedResponse;
import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.User;
import com.opspilot.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/projects", "/api/projects"})
@Tag(name = "Project Management", description = "Endpoints for microservice project creation, updating, deleting, and paginated listing")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @GetMapping
    @Operation(summary = "Get paginated list of microservice projects for authenticated user")
    public ResponseEntity<PagedResponse<ProjectResponse>> getAllProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @AuthenticationPrincipal User currentUser) {
        PagedResponse<ProjectResponse> projects = projectService.getPaginatedProjectsForUser(currentUser, page, size, sortBy, sortDir);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get microservice project by ID")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        ProjectResponse project = projectService.getProjectById(id, currentUser);
        return ResponseEntity.ok(project);
    }

    @PostMapping
    @Operation(summary = "Register a new microservice project")
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User currentUser) {
        ProjectResponse project = projectService.createProject(request, currentUser);
        return new ResponseEntity<>(project, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing microservice project")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @RequestBody ProjectRequest request,
            @AuthenticationPrincipal User currentUser) {
        ProjectResponse project = projectService.updateProject(id, request, currentUser);
        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a microservice project")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        projectService.deleteProject(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
