package com.opspilot.controller;

import com.opspilot.dto.WebhookPayload;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.NotificationEntity;
import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.Project;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.NotificationRepository;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/webhooks", "/api/webhooks"})
public class WebhookController {

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @PostMapping("/github")
    public ResponseEntity<Map<String, Object>> handleGitHubWebhook(
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "push") String eventType,
            @RequestBody WebhookPayload payload
    ) {
        String repoName = payload.getRepository() != null ? payload.getRepository().getName() : "unknown-repo";
        String branch = payload.getRef() != null ? payload.getRef().replace("refs/heads/", "") : "main";
        String commitSha = payload.getHeadCommit() != null ? payload.getHeadCommit().getId().substring(0, 7) : "a1b2c3d";
        String commitMessage = payload.getHeadCommit() != null ? payload.getHeadCommit().getMessage() : "Automated webhook push trigger";
        String author = (payload.getHeadCommit() != null && payload.getHeadCommit().getAuthor() != null)
                ? payload.getHeadCommit().getAuthor().getName()
                : "GitHub Actions Bot";

        // Find matching project by repository URL or name
        List<Project> projects = projectRepository.findAll();
        Project matchedProject = projects.stream()
                .filter(p -> p.getRepositoryUrl().toLowerCase().contains(repoName.toLowerCase()) || p.getProjectName().toLowerCase().replaceAll("\\s+", "-").contains(repoName.toLowerCase()))
                .findFirst()
                .orElse(projects.isEmpty() ? null : projects.get(0));

        PipelineRunEntity run = new PipelineRunEntity(
                matchedProject,
                eventType,
                branch,
                commitSha,
                commitMessage,
                author,
                "SUCCESS"
        );

        PipelineRunEntity savedRun = pipelineRunRepository.save(run);

        // Emit Log
        logRepository.save(new LogEntity(
                null,
                "cicd-webhook-service",
                "INFO",
                "GitHub Webhook [" + eventType + "] received for repo: " + repoName + " branch: " + branch + " commit: " + commitSha
        ));

        // Emit Notification
        notificationRepository.save(new NotificationEntity(
                matchedProject != null ? matchedProject.getOwner() : null,
                null,
                "CI/CD Pipeline Run #" + savedRun.getRunId() + " (" + eventType + ") passed on " + branch + " [" + commitSha + "]",
                "SYSTEM_ALERT"
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("status", "processed");
        response.put("runId", savedRun.getRunId());
        response.put("eventType", eventType);
        response.put("commitSha", commitSha);
        return ResponseEntity.ok(response);
    }
}
