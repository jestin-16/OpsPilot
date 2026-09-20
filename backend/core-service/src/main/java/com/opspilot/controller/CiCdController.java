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
    public ResponseEntity<Map<String, Object>> handleGithubWebhook(@RequestBody Map<String, Object> payload) {
        String repoUrl = "";
        String branch = "main";
        String commitSha = "sha-" + System.currentTimeMillis();
        String commitMessage = "";
        String author = "GitHub Webhook";

        if (payload.containsKey("repository") && payload.get("repository") instanceof Map) {
            Map<?, ?> repository = (Map<?, ?>) payload.get("repository");
            if (repository.get("clone_url") != null) {
                repoUrl = repository.get("clone_url").toString();
            }
        }

        if (payload.containsKey("ref") && payload.get("ref") != null) {
            branch = payload.get("ref").toString().replace("refs/heads/", "");
        }

        if (payload.containsKey("head_commit") && payload.get("head_commit") instanceof Map) {
            Map<?, ?> headCommit = (Map<?, ?>) payload.get("head_commit");
            if (headCommit.get("id") != null) commitSha = headCommit.get("id").toString();
            if (headCommit.get("message") != null) commitMessage = headCommit.get("message").toString();
            if (headCommit.get("author") instanceof Map) {
                Map<?, ?> authorMap = (Map<?, ?>) headCommit.get("author");
                if (authorMap.get("name") != null) author = authorMap.get("name").toString();
            }
        }

        if (!CiCdService.isAllowlisted(repoUrl)) {
            throw new ForbiddenException("Repository URL '" + repoUrl + "' is not allowlisted for CI/CD execution");
        }

        PipelineRunEntity run = ciCdService.processGitHubWebhook(repoUrl, branch, commitSha, commitMessage, author);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Webhook received and pipeline triggered");
        response.put("runId", run.getRunId());
        response.put("status", run.getStatus());
        return ResponseEntity.ok(response);
    }
}
