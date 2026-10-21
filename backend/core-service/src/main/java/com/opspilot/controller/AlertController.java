package com.opspilot.controller;

import com.opspilot.entity.Alert;
import com.opspilot.repository.AlertRepository;
import com.opspilot.entity.User;
import com.opspilot.security.ProjectScope;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private ProjectScope projectScope;

    @GetMapping
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<Alert>> getAllAlerts(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectScope.visibleProjectIds(currentUser)
                .map(ids -> ids.isEmpty() ? List.<Alert>of() : alertRepository.findByProjectIdIn(ids))
                .orElseGet(alertRepository::findAll));
    }
}
