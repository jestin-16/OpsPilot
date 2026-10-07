package com.opspilot.service;

import com.opspilot.entity.Incident;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.PipelineSource;
import com.opspilot.repository.IncidentRepository;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.repository.UserRepository;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Incident> getAllIncidents() {
        return incidentRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Incident> getIncidentsByProject(Long projectId) {
        return incidentRepository.findByProject_IdOrderByCreatedAtDesc(projectId);
    }

    public Optional<Incident> getIncidentById(Long id) {
        return incidentRepository.findById(id);
    }

    @Transactional
    public Incident createIncident(Long projectId, String title, String description, String severity, String affectedService, Long deploymentId, Long pipelineRunId, String userEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        Deployment deployment = null;
        if (deploymentId != null) {
            deployment = deploymentRepository.findById(deploymentId).orElse(null);
        }

        PipelineRunEntity pipelineRun = null;
        if (pipelineRunId != null) {
            pipelineRun = pipelineRunRepository.findById(pipelineRunId).orElse(null);
        }

        Incident incident = new Incident();
        incident.setProject(project);
        incident.setTitle(title);
        incident.setDescription(description);
        incident.setSeverity(severity);
        incident.setStatus("OPEN");
        incident.setAffectedService(affectedService);
        incident.setCreatedBy(user);
        incident.setRelatedDeployment(deployment);
        incident.setRelatedPipelineRun(pipelineRun);

        Incident saved = incidentRepository.save(incident);
        
        try {
            com.opspilot.entity.NotificationEntity notif = new com.opspilot.entity.NotificationEntity();
            notif.setUser(project.getOwner());
            notif.setDeployment(deployment);
            notif.setMessage("Incident Reported: " + title + " (" + severity + ")");
            notif.setType("INCIDENT_OPENED");
            notificationRepository.save(notif);
        } catch(Exception e) {
            System.err.println("Failed to emit notification: " + e.getMessage());
        }

        return saved;
    }

    /** Creates an incident for a failed pipeline run of a standalone source; the project is optional. */
    @Transactional
    public Incident createSourceIncident(PipelineSource source, Project project, String title, String description, String severity, String affectedService, Long pipelineRunId) {
        Incident incident = new Incident();
        incident.setProject(project);
        incident.setSource(source);
        incident.setTitle(title);
        incident.setDescription(description);
        incident.setSeverity(severity);
        incident.setStatus("OPEN");
        incident.setAffectedService(affectedService);
        if (pipelineRunId != null) {
            incident.setRelatedPipelineRun(pipelineRunRepository.findById(pipelineRunId).orElse(null));
        }
        Incident saved = incidentRepository.save(incident);

        try {
            com.opspilot.entity.NotificationEntity notif = new com.opspilot.entity.NotificationEntity();
            notif.setUser(project != null ? project.getOwner() : null);
            notif.setMessage("Incident Reported: " + title + " (" + severity + ")");
            notif.setType("INCIDENT_OPENED");
            notificationRepository.save(notif);
        } catch (Exception e) {
            System.err.println("Failed to emit notification: " + e.getMessage());
        }
        return saved;
    }

    @Transactional
    public Incident updateIncidentStatus(Long id, String status) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found"));
        
        incident.setStatus(status);
        if ("RESOLVED".equals(status) && incident.getResolvedAt() == null) {
            incident.setResolvedAt(LocalDateTime.now());
            
            try {
                com.opspilot.entity.NotificationEntity notif = new com.opspilot.entity.NotificationEntity();
                notif.setUser(incident.getProject() != null ? incident.getProject().getOwner() : null);
                notif.setDeployment(incident.getRelatedDeployment());
                notif.setMessage("Incident Resolved: " + incident.getTitle());
                notif.setType("INCIDENT_RESOLVED");
                notificationRepository.save(notif);
            } catch(Exception e) {
                System.err.println("Failed to emit notification: " + e.getMessage());
            }
        }
        
        return incidentRepository.save(incident);
    }
}
