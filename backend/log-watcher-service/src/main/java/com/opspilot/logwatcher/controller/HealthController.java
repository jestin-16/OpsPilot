package com.opspilot.logwatcher.controller;

import com.opspilot.logwatcher.model.ClusterHealthSummaryDto;
import com.opspilot.logwatcher.service.ClusterHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/health", "/api/v1/health"})
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class HealthController {

    private final ClusterHealthService healthService;

    public HealthController(ClusterHealthService healthService) {
        this.healthService = healthService;
    }

    /**
     * REST endpoint to fetch cluster and pod health summary signals.
     * GET /api/health/summary?windowMinutes=15
     */
    @GetMapping("/summary")
    public ResponseEntity<ClusterHealthSummaryDto> getHealthSummary(
            @RequestParam(required = false, defaultValue = "15") int windowMinutes) {
        return ResponseEntity.ok(healthService.getSummary(windowMinutes));
    }
}
