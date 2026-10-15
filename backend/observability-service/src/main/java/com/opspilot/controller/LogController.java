package com.opspilot.controller;

import com.opspilot.entity.LogEntity;
import com.opspilot.service.LogService;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/logs", "/api/logs"})
public class LogController {

    static final int MAX_LIMIT = 1000;

    @Autowired
    private LogService logService;

    @GetMapping
    public ResponseEntity<List<LogEntity>> getLogs(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String sourceService,
            @RequestParam(required = false) String logLevel,
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "local") String providerName,
            @RequestParam(defaultValue = "500") int limit,
            @AuthenticationPrincipal User currentUser
    ) {
        // Without a cap an unfiltered search returned the whole logs table.
        int bounded = Math.max(1, Math.min(limit, MAX_LIMIT));
        return ResponseEntity.ok(logService.searchLogs(currentUser, projectId, sourceService, logLevel, query, providerName, bounded));
    }

    @PostMapping
    public ResponseEntity<LogEntity> createLog(@RequestBody LogEntity log, @AuthenticationPrincipal User currentUser) {
        throw new ForbiddenException("Direct log creation is disabled; use a project log source or SDK");
    }
}
