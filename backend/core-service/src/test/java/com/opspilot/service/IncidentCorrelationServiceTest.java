package com.opspilot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.Alert;
import com.opspilot.entity.Incident;
import com.opspilot.entity.Project;
import com.opspilot.event.EventType;
import com.opspilot.messaging.EventEnvelope;
import com.opspilot.repository.IncidentRepository;
import com.opspilot.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IncidentCorrelationServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private IncidentCorrelationService incidentCorrelationService;

    private Alert sampleAlert;
    private Project sampleProject;
    private String expectedTitle;

    @BeforeEach
    void setUp() {
        sampleProject = new Project();
        sampleProject.setId(100L);

        sampleAlert = new Alert();
        sampleAlert.setId(1L);
        sampleAlert.setEventType(EventType.POD_CRASHED.name());
        sampleAlert.setProjectId(100L);
        sampleAlert.setResource("pod-123");
        sampleAlert.setSeverity("CRITICAL");
        sampleAlert.setMessage("Pod crashed unexpectedly");
        sampleAlert.setCreatedAt(LocalDateTime.now());
        
        expectedTitle = "Alert: POD_CRASHED on pod-123";
    }

    @Test
    void testNewIncidentCreated() {
        when(incidentRepository.findActiveCorrelationIncidents(eq(expectedTitle), eq(100L), any())).thenReturn(Collections.emptyList());
        when(projectRepository.findById(100L)).thenReturn(Optional.of(sampleProject));

        EventEnvelope event = new EventEnvelope();
        event.setEventType(EventType.ALERT_TRIGGERED);
        event.setPayload(sampleAlert);

        incidentCorrelationService.onEvent(event);

        ArgumentCaptor<Incident> incidentCaptor = ArgumentCaptor.forClass(Incident.class);
        verify(incidentRepository, times(1)).save(incidentCaptor.capture());

        Incident savedIncident = incidentCaptor.getValue();
        assertEquals(expectedTitle, savedIncident.getTitle());
        assertEquals("OPEN", savedIncident.getStatus());
        assertEquals("pod-123", savedIncident.getAffectedResources());
        assertEquals(1, savedIncident.getAlertCount());
        assertNotNull(savedIncident.getProject());
        assertTrue(savedIncident.getTimeline().contains("automatically created"));
    }

    @Test
    void testAlertAddedToExistingIncident_DuplicateAlert() {
        Incident existingIncident = new Incident();
        existingIncident.setId(10L);
        existingIncident.setTitle(expectedTitle);
        existingIncident.setStatus("OPEN");
        existingIncident.setAlertCount(1);
        existingIncident.setTimeline("[\"Initial timeline event\"]");

        when(incidentRepository.findActiveCorrelationIncidents(eq(expectedTitle), eq(100L), any()))
                .thenReturn(Collections.singletonList(existingIncident));

        EventEnvelope event = new EventEnvelope();
        event.setEventType(EventType.ALERT_TRIGGERED);
        event.setPayload(sampleAlert);

        incidentCorrelationService.onEvent(event);

        ArgumentCaptor<Incident> incidentCaptor = ArgumentCaptor.forClass(Incident.class);
        verify(incidentRepository, times(1)).save(incidentCaptor.capture());

        Incident updatedIncident = incidentCaptor.getValue();
        assertEquals(2, updatedIncident.getAlertCount()); // Incremented
        assertTrue(updatedIncident.getTimeline().contains("Duplicate alert triggered"));
        
        // Ensure ProjectRepository was not queried since it reuses the existing incident
        verify(projectRepository, never()).findById(any());
    }

    @Test
    void testIncidentResolution() {
        Incident existingIncident = new Incident();
        existingIncident.setId(10L);
        existingIncident.setTitle(expectedTitle);
        existingIncident.setStatus("OPEN");
        existingIncident.setAlertCount(3);
        existingIncident.setTimeline("[]");

        when(incidentRepository.findActiveCorrelationIncidents(eq(expectedTitle), eq(100L), any()))
                .thenReturn(Collections.singletonList(existingIncident));

        EventEnvelope event = new EventEnvelope();
        event.setEventType(EventType.ALERT_RESOLVED);
        event.setPayload(sampleAlert);

        incidentCorrelationService.onEvent(event);

        ArgumentCaptor<Incident> incidentCaptor = ArgumentCaptor.forClass(Incident.class);
        verify(incidentRepository, times(1)).save(incidentCaptor.capture());

        Incident updatedIncident = incidentCaptor.getValue();
        assertEquals("RESOLVED", updatedIncident.getStatus());
        assertNotNull(updatedIncident.getResolvedAt());
        assertTrue(updatedIncident.getTimeline().contains("resolved automatically"));
    }
}
