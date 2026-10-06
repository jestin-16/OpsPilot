package com.opspilot.service;

import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.Project;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CiCdService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private IncidentService incidentService;

    // Remove isAllowlisted since we aren't executing code locally anymore

    public PipelineRunEntity trackExternalPipelineRun(String repoUrl, String eventType, String branch, String commitSha, String commitMessage, String author, String status, String logs, Long durationMs) {
        List<Project> projects = projectRepository.findByRepositoryUrl(repoUrl);
        Project project = projects.isEmpty() ? 
                projectRepository.findAll().stream().findFirst().orElse(null) : projects.get(0);

        PipelineRunEntity run = new PipelineRunEntity(
                project, eventType, branch != null ? branch : "main",
                commitSha != null ? commitSha : "sha-" + System.currentTimeMillis(),
                commitMessage != null ? commitMessage : "Pipeline update",
                author != null ? author : "System", status != null ? status : "UNKNOWN"
        );
        run.setRepoUrl(repoUrl);
        
        if (logs != null) {
            run.setBuildLogs(logs);
        }
        if (durationMs != null) {
            run.setDurationMs(durationMs);
        }
        
        run = pipelineRunRepository.save(run);

        // Auto-create an incident if the tracked external pipeline failed
        if ("FAILED".equalsIgnoreCase(status) || "failure".equalsIgnoreCase(status)) {
            try {
                incidentService.createIncident(
                    project != null ? project.getId() : null,
                    "External Pipeline Failed: #" + run.getRunId(),
                    "Automated incident created due to external CI/CD failure.\nRepository: " + repoUrl + "\nBranch: " + branch,
                    "HIGH",
                    "CI/CD Pipeline",
                    null,
                    run.getRunId(),
                    null
                );
            } catch (Exception e) {
                System.err.println("Failed to auto-create incident: " + e.getMessage());
            }
        }

        return run;
    }
}
