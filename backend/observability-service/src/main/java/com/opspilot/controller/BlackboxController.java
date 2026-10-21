package com.opspilot.controller;

import com.opspilot.service.BlackboxService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/monitoring", "/api/monitoring"})
public class BlackboxController {

    private final BlackboxService blackboxService;

    @Autowired
    public BlackboxController(BlackboxService blackboxService) {
        this.blackboxService = blackboxService;
    }

    // The /blackbox page is DevOps-only; the service also refuses non-public targets.
    @PreAuthorize("hasRole('DEVOPS') or hasRole('ADMIN')")
    @GetMapping("/probe")
    public ResponseEntity<Map<String, Object>> probeUrl(@RequestParam String url) {
        return ResponseEntity.ok(blackboxService.probeUrl(url));
    }
}
