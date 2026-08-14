package com.opspilot.controller;

import com.opspilot.entity.IntegrationSettings;
import com.opspilot.service.IntegrationSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/integrations")
@RequiredArgsConstructor
public class IntegrationSettingsController {
    
    private final IntegrationSettingsService service;

    @GetMapping
    public ResponseEntity<List<IntegrationSettings>> getAllIntegrations() {
        return ResponseEntity.ok(service.getAllIntegrations());
    }

    @PostMapping
    public ResponseEntity<IntegrationSettings> saveIntegration(@RequestBody IntegrationSettings settings) {
        return ResponseEntity.ok(service.saveIntegration(settings));
    }
}
