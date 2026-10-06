package com.opspilot.controller;

import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.service.CiCdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/cicd", "/api/cicd"})
public class CiCdController {

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private CiCdService ciCdService;

    @GetMapping("/runs")
    public ResponseEntity<List<PipelineRunEntity>> getPipelineRuns() {
        return ResponseEntity.ok(pipelineRunRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/runs/{runId}")
    public ResponseEntity<PipelineRunEntity> getPipelineRun(@PathVariable Long runId) {
        PipelineRunEntity run = pipelineRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline run not found with id: " + runId));
        return ResponseEntity.ok(run);
    }

    @GetMapping("/runs/{runId}/logs")
    public ResponseEntity<Map<String, Object>> getPipelineRunLogs(@PathVariable Long runId) {
        PipelineRunEntity run = pipelineRunRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Pipeline run not found with id: " + runId));
        Map<String, Object> response = new HashMap<>();
        response.put("runId", run.getRunId());
        response.put("status", run.getStatus());
        response.put("exitCode", run.getExitCode());
        response.put("logs", run.getBuildLogs() != null ? run.getBuildLogs() : "");
        response.put("durationMs", run.getDurationMs());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhooks/github")
    public ResponseEntity<Map<String, Object>> handleGithubWebhook(
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "push") String githubEvent,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody String rawPayload) {
        
        String secret = System.getenv("GITHUB_WEBHOOK_SECRET");
        if (secret != null && !secret.isEmpty()) {
            if (signature == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Missing signature"));
            }
            try {
                javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
                javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
                mac.init(secretKeySpec);
                byte[] hmacBytes = mac.doFinal(rawPayload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder("sha256=");
                for (byte b : hmacBytes) {
                    sb.append(String.format("%02x", b));
                }
                String expectedSignature = sb.toString();
                if (!expectedSignature.equals(signature)) {
                    return ResponseEntity.status(401).body(Map.of("message", "Invalid signature"));
                }
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("message", "Error verifying signature"));
            }
        }
        
        Map<String, Object> payload;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            payload = mapper.readValue(rawPayload, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid JSON payload"));
        }
        
        String repoUrl = "";
        String owner = "";
        String repo = "";
        
        if (payload.containsKey("repository") && payload.get("repository") instanceof Map) {
            Map<?, ?> repository = (Map<?, ?>) payload.get("repository");
            if (repository.get("clone_url") != null) {
                repoUrl = repository.get("clone_url").toString();
            }
            if (repository.get("name") != null) {
                repo = repository.get("name").toString();
            }
            if (repository.get("owner") instanceof Map) {
                Map<?, ?> ownerMap = (Map<?, ?>) repository.get("owner");
                if (ownerMap.get("login") != null) {
                    owner = ownerMap.get("login").toString();
                }
            }
        }
        
        if ("workflow_run".equals(githubEvent) && payload.containsKey("workflow_run")) {
            Map<?, ?> workflowRun = (Map<?, ?>) payload.get("workflow_run");
            
            String branch = workflowRun.get("head_branch") != null ? workflowRun.get("head_branch").toString() : "main";
            String commitSha = workflowRun.get("head_sha") != null ? workflowRun.get("head_sha").toString() : "";
            
            String commitMessage = "Workflow run";
            String author = "GitHub Actions";
            
            if (workflowRun.get("head_commit") instanceof Map) {
                Map<?, ?> headCommit = (Map<?, ?>) workflowRun.get("head_commit");
                if (headCommit.get("message") != null) commitMessage = headCommit.get("message").toString();
                if (headCommit.get("author") instanceof Map) {
                    Map<?, ?> authorMap = (Map<?, ?>) headCommit.get("author");
                    if (authorMap.get("name") != null) author = authorMap.get("name").toString();
                }
            }
            
            String githubStatus = workflowRun.get("status") != null ? workflowRun.get("status").toString() : "queued";
            String conclusion = workflowRun.get("conclusion") != null ? workflowRun.get("conclusion").toString() : null;
            
            String finalStatus = "IN_PROGRESS";
            if ("completed".equals(githubStatus)) {
                finalStatus = "success".equals(conclusion) ? "SUCCESS" : "FAILED";
            }
            
            String logsUrl = workflowRun.get("html_url") != null ? workflowRun.get("html_url").toString() : null;
            String logs = logsUrl != null ? "Logs available at: " + logsUrl : "No logs URL provided";
            String externalRunId = workflowRun.get("id") != null ? workflowRun.get("id").toString() : null;
            
            PipelineRunEntity run;
            try {
                run = ciCdService.trackExternalPipelineRun(
                        repoUrl, "workflow_run", branch, commitSha, commitMessage, author, finalStatus, logs, null, externalRunId
                );
            } catch (IllegalArgumentException e) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", e.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
            if ("completed".equals(githubStatus) && workflowRun.get("id") != null && !owner.isEmpty() && !repo.isEmpty()) {
                Long workflowRunId = Long.parseLong(workflowRun.get("id").toString());
                ciCdService.fetchAndSaveGitHubLogsAsync(run.getRunId(), owner, repo, workflowRunId);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Workflow run tracked successfully");
            response.put("runId", run.getRunId());
            response.put("status", run.getStatus());
            return ResponseEntity.ok(response);
            
        } else if ("push".equals(githubEvent)) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Push event ignored, waiting for workflow_run event");
            return ResponseEntity.ok(response);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Unsupported event: " + githubEvent);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhooks/jenkins")
    public ResponseEntity<Map<String, Object>> handleJenkinsWebhook(
            @RequestHeader(value = "X-Jenkins-Token", required = false) String jenkinsToken,
            @RequestBody Map<String, Object> payload) {
        
        String secret = System.getenv("JENKINS_WEBHOOK_SECRET");
        if (secret != null && !secret.isEmpty()) {
            if (jenkinsToken == null || !secret.equals(jenkinsToken)) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized Jenkins webhook"));
            }
        }
        
        Map<String, Object> response = new HashMap<>();

        if (!(payload.get("build") instanceof Map)) {
            response.put("message", "Invalid Jenkins payload: missing build object");
            return ResponseEntity.badRequest().body(response);
        }
        Map<?, ?> build = (Map<?, ?>) payload.get("build");

        String phase = build.get("phase") != null ? build.get("phase").toString().toUpperCase() : "";
        String jenkinsStatus = build.get("status") != null ? build.get("status").toString().toUpperCase() : null;
        String buildUrl = build.get("full_url") != null ? build.get("full_url").toString() : null;
        String buildNumber = build.get("number") != null ? build.get("number").toString() : "?";

        // The Notification Plugin sends FINALIZED after COMPLETED; COMPLETED already records the result
        if ("FINALIZED".equals(phase)) {
            response.put("message", "FINALIZED phase ignored, build already tracked on COMPLETED");
            return ResponseEntity.ok(response);
        }

        String repoUrl = buildUrl != null ? buildUrl : "";
        String branch = "main";
        String commitSha = null;

        if (build.get("scm") instanceof Map) {
            Map<?, ?> scm = (Map<?, ?>) build.get("scm");
            if (scm.get("url") != null) repoUrl = scm.get("url").toString();
            if (scm.get("branch") != null) branch = scm.get("branch").toString();
            if (scm.get("commit") != null) commitSha = scm.get("commit").toString();
        }

        boolean completed = "COMPLETED".equals(phase);
        String finalStatus = "IN_PROGRESS";
        if (completed) {
            finalStatus = "SUCCESS".equals(jenkinsStatus) ? "SUCCESS" : "FAILED";
        }

        String logs = buildUrl != null ? "Logs available at: " + (buildUrl.endsWith("/") ? buildUrl : buildUrl + "/") + "console" : "No build URL provided";

        PipelineRunEntity run;
        try {
            run = ciCdService.trackExternalPipelineRun(
                    repoUrl, "jenkins_build", branch, commitSha, "Jenkins build #" + buildNumber, "Jenkins", finalStatus, logs, null, buildUrl
            );
        } catch (IllegalArgumentException e) {
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }

        if (completed && buildUrl != null) {
            ciCdService.fetchAndSaveJenkinsLogsAsync(run.getRunId(), buildUrl);
        }

        response.put("message", "Jenkins build tracked successfully");
        response.put("runId", run.getRunId());
        response.put("status", run.getStatus());
        return ResponseEntity.ok(response);
    }
}
