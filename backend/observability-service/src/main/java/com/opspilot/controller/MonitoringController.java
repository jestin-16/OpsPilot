package com.opspilot.controller;

import com.opspilot.dto.MetricsResponse;
import com.opspilot.service.MonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/monitoring", "/api/monitoring"})
public class MonitoringController {

    @Autowired
    private MonitoringService monitoringService;

    @GetMapping("/metrics")
    public ResponseEntity<MetricsResponse> getMetrics(
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "local") String providerName
    ) {
        return ResponseEntity.ok(monitoringService.getSystemMetrics(providerName));
    }
}
