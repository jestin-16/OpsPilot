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
import com.opspilot.entity.CommitLogEntity;
import com.opspilot.repository.CommitLogRepository;
import com.opspilot.event.InfrastructureEvent;
import com.opspilot.event.EventType;
import com.opspilot.enums.ProviderType;
import com.opspilot.messaging.EventPublisher;
import com.opspilot.messaging.EventEnvelope;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.util.WebhookSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.time.LocalDateTime;

import java.util.HashMap;
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

    @Autowired
    private CommitLogRepository commitLogRepository;

    @Autowired
    private EventPublisher eventPublisher;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${GITHUB_WEBHOOK_SECRET:}")
    private String githubWebhookSecret;

    @PostMapping("/github")
    public ResponseEntity<Map<String, Object>> handleGitHubWebhook(
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "push") String eventType,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody byte[] rawBody
    ) {
        // Fail closed: this endpoint is public, so the HMAC signature is the only thing proving GitHub sent it.
        if (githubWebhookSecret == null || githubWebhookSecret.isBlank()) {
            return ResponseEntity.status(503).body(Map.of("message",
                    "GitHub webhook secret is not configured (set GITHUB_WEBHOOK_SECRET), or use a project integration's webhook URL"));
        }
        if (!WebhookSignature.verify(githubWebhookSecret, rawBody, signature)) {
            return ResponseEntity.status(401).body(Map.of("message", "Missing or invalid X-Hub-Signature-256"));
        }
        WebhookPayload payload;
        try {
            payload = objectMapper.readValue(rawBody, WebhookPayload.class);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid JSON payload"));
        }

        String repoName = payload.getRepository() != null ? payload.getRepository().getName() : "unknown-repo";
        // Events without a head commit (ping, tag, branch delete) are recorded as such, not with invented values.
        String branch = payload.getRef() != null ? payload.getRef().replace("refs/heads/", "") : "unknown";
        String headId = payload.getHeadCommit() != null ? payload.getHeadCommit().getId() : null;
        String commitSha = headId != null ? headId.substring(0, Math.min(7, headId.length())) : "none";
        String commitMessage = payload.getHeadCommit() != null && payload.getHeadCommit().getMessage() != null
                ? payload.getHeadCommit().getMessage() : "(no commit)";
        String author = (payload.getHeadCommit() != null && payload.getHeadCommit().getAuthor() != null)
                ? payload.getHeadCommit().getAuthor().getName()
                : "unknown";

        // Exact repository match in the database; substring matching filed "api" under "payment-api-gateway".
        // No match means no project: never attach another repository's events to an unrelated project.
        Project matchedProject = projectRepository.findByRepositoryName(repoName.toLowerCase()).stream()
                .findFirst()
                .orElse(null);

        PipelineRunEntity run = new PipelineRunEntity(
                matchedProject,
                eventType,
                branch,
                commitSha,
                commitMessage,
                author,
                "RECEIVED" // a push says nothing about whether a pipeline passed
        );

        PipelineRunEntity savedRun = pipelineRunRepository.save(run);

        // Emit Log
        logRepository.save(new LogEntity(
                null,
                "cicd-webhook-service",
                "INFO",
                "GitHub Webhook [" + eventType + "] received for repo: " + repoName + " branch: " + branch + " commit: " + commitSha
        ));

        // Save Commit Log
        commitLogRepository.save(new CommitLogEntity(
                matchedProject,
                commitSha,
                branch,
                author,
                commitMessage
        ));

        // Emit Notification
        notificationRepository.save(new NotificationEntity(
                matchedProject != null ? matchedProject.getOwner() : null,
                null,
                "GitHub " + eventType + " received on " + branch + " [" + commitSha + "] (run #" + savedRun.getRunId() + ")",
                "SYSTEM_ALERT"
        ));

        // Emit Normalized Infrastructure Event
        String eventId = "github-" + repoName + "-" + commitSha + "-" + eventType;
        
        InfrastructureEvent infraEvent = new InfrastructureEvent();
        infraEvent.setId(eventId);
        infraEvent.setTimestamp(LocalDateTime.now());
        infraEvent.setProjectId(matchedProject != null ? matchedProject.getId() : null);
        infraEvent.setProvider(ProviderType.GITHUB);
        infraEvent.setResourceId(repoName + "/" + branch);
        infraEvent.setEventType(EventType.DEPLOYMENT_STARTED); // default map for webhook push
        infraEvent.setSeverity("INFO");
        infraEvent.setMessage("GitHub Webhook [" + eventType + "] received for repo: " + repoName);
        infraEvent.setMetadata("commitSha: " + commitSha + ", branch: " + branch);

        EventEnvelope envelope = new EventEnvelope();
        envelope.setEventId(eventId);
        envelope.setEventType(EventType.DEPLOYMENT_STARTED);
        envelope.setProjectId(matchedProject != null ? matchedProject.getId() : null);
        envelope.setSource("github-webhook");
        envelope.setPayload(infraEvent);
        
        eventPublisher.publish(envelope);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "processed");
        response.put("runId", savedRun.getRunId());
        response.put("eventType", eventType);
        response.put("commitSha", commitSha);
        return ResponseEntity.ok(response);
    }
}
