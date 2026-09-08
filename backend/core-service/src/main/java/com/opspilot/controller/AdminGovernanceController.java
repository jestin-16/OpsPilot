package com.opspilot.controller;

import com.opspilot.dto.AdminOverviewResponse;
import com.opspilot.dto.AuditLogResponse;
import com.opspilot.entity.PlatformIntegration;
import com.opspilot.entity.PlatformSetting;
import com.opspilot.entity.User;
import com.opspilot.service.AdminGovernanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
@PreAuthorize("hasRole('ADMIN')")
public class AdminGovernanceController {
    private final AdminGovernanceService service;
    public AdminGovernanceController(AdminGovernanceService service) { this.service = service; }
    @GetMapping("/overview") public AdminOverviewResponse overview() { return service.overview(); }
    @GetMapping("/audit-logs") public List<AuditLogResponse> auditLogs() { return service.auditLogs(); }
    @GetMapping("/integrations") public List<PlatformIntegration> integrations() { return service.integrations(); }
    @PostMapping("/integrations") public PlatformIntegration saveIntegration(@RequestBody PlatformIntegration value, @AuthenticationPrincipal User actor) { return service.saveIntegration(value, actor); }
    @DeleteMapping("/integrations/{id}") public ResponseEntity<Void> deleteIntegration(@PathVariable Long id, @AuthenticationPrincipal User actor) { service.deleteIntegration(id, actor); return ResponseEntity.noContent().build(); }
    @GetMapping("/settings") public List<PlatformSetting> settings() { return service.settings(); }
    @PutMapping("/settings/{key}") public PlatformSetting saveSetting(@PathVariable String key, @RequestBody Map<String, String> body, @AuthenticationPrincipal User actor) { return service.saveSetting(key, body.getOrDefault("value", ""), actor); }
}
