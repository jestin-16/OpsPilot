package com.opspilot.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.Alert;
import com.opspilot.entity.Incident;
import com.opspilot.entity.Project;
import com.opspilot.messaging.EventEnvelope;
import com.opspilot.messaging.EventSubscriber;
import com.opspilot.repository.IncidentRepository;
import com.opspilot.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class IncidentCorrelationService implements EventSubscriber {

    private static final Logger log = LoggerFactory.getLogger(IncidentCorrelationService.class);
    
    private final IncidentRepository incidentRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    public IncidentCorrelationService(IncidentRepository incidentRepository, ProjectRepository projectRepository, ObjectMapper objectMapper) {
        this.incidentRepository = incidentRepository;
        this.projectRepository = projectRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @EventListener
    public void onEvent(EventEnvelope event) {
        if ("ALERT_TRIGGERED".equals(event.getEventType().name()) && event.getPayload() instanceof Alert) {
            Alert alert = (Alert) event.getPayload();
            correlateAlertToIncident(alert);
        } else if ("ALERT_RESOLVED".equals(event.getEventType().name()) && event.getPayload() instanceof Alert) {
            Alert alert = (Alert) event.getPayload();
            resolveIncident(alert);
        }
    }

    public void correlateAlertToIncident(Alert alert) {
        String title = String.format("Alert: %s on %s", alert.getEventType(), alert.getResource());
        
        List<Incident> activeIncidents = incidentRepository.findActiveCorrelationIncidents(
                title, 
                alert.getProjectId(), 
                Arrays.asList("OPEN", "INVESTIGATING")
        );

        Incident incident;
        if (!activeIncidents.isEmpty()) {
            incident = activeIncidents.get(0);
            log.info("Correlating alert {} to existing incident {}", alert.getId(), incident.getId());
            incident.setAlertCount(incident.getAlertCount() + 1);
            appendTimeline(incident, String.format("Duplicate alert triggered at %s", LocalDateTime.now().toString()));
        } else {
            log.info("Creating new incident for alert {}", alert.getId());
            incident = new Incident();
            incident.setTitle(title);
            incident.setDescription(alert.getMessage());
            incident.setSeverity(alert.getSeverity());
            incident.setStatus("OPEN");
            incident.setAffectedResources(alert.getResource());
            incident.setStartedAt(alert.getCreatedAt() != null ? alert.getCreatedAt() : LocalDateTime.now());
            incident.setAlertCount(1);
            
            if (alert.getProjectId() != null) {
                Project project = projectRepository.findById(alert.getProjectId()).orElse(null);
                incident.setProject(project);
            }
            appendTimeline(incident, String.format("Incident automatically created from Alert %s", alert.getEventType()));
        }
        
        incidentRepository.save(incident);
    }
    
    public void resolveIncident(Alert alert) {
        String title = String.format("Alert: %s on %s", alert.getEventType(), alert.getResource());
        
        List<Incident> activeIncidents = incidentRepository.findActiveCorrelationIncidents(
                title, 
                alert.getProjectId(), 
                Arrays.asList("OPEN", "INVESTIGATING", "MITIGATED")
        );
        
        for (Incident incident : activeIncidents) {
            incident.setStatus("RESOLVED");
            incident.setResolvedAt(LocalDateTime.now());
            appendTimeline(incident, "Incident resolved automatically by Alert Engine.");
            incidentRepository.save(incident);
        }
    }

    private void appendTimeline(Incident incident, String eventMsg) {
        try {
            List<String> timelineEvents;
            if (incident.getTimeline() == null || incident.getTimeline().equals("[]") || incident.getTimeline().trim().isEmpty()) {
                timelineEvents = new ArrayList<>();
            } else {
                timelineEvents = objectMapper.readValue(incident.getTimeline(), new TypeReference<List<String>>() {});
            }
            timelineEvents.add(eventMsg);
            incident.setTimeline(objectMapper.writeValueAsString(timelineEvents));
        } catch (Exception e) {
            log.error("Failed to append timeline event", e);
        }
    }
}
