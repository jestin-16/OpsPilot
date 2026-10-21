package com.opspilot.controller;

import com.opspilot.event.InfrastructureEvent;
import com.opspilot.repository.InfrastructureEventRepository;
import com.opspilot.entity.User;
import com.opspilot.security.ProjectScope;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
public class InfrastructureEventController {

    @Autowired
    private InfrastructureEventRepository eventRepository;

    @Autowired
    private ProjectScope projectScope;

    @GetMapping
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<InfrastructureEvent>> getAllEvents(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(projectScope.visibleProjectIds(currentUser)
                .map(ids -> ids.isEmpty() ? List.<InfrastructureEvent>of() : eventRepository.findByProjectIdIn(ids))
                .orElseGet(eventRepository::findAll));
    }
}
