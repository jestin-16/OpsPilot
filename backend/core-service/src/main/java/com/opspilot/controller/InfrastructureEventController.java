package com.opspilot.controller;

import com.opspilot.event.InfrastructureEvent;
import com.opspilot.repository.InfrastructureEventRepository;
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

    @GetMapping
    @PreAuthorize("hasRole('DEVELOPER') or hasRole('DEVOPS') or hasRole('ADMIN')")
    public ResponseEntity<List<InfrastructureEvent>> getAllEvents() {
        return ResponseEntity.ok(eventRepository.findAll());
    }
}
