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
            @RequestBody Map<String, Object> payload) {
        
        String repoUrl = "";
        
        if (payload.containsKey("repository") && payload.get("repository") instanceof Map) {
            Map<?, ?> repository = (Map<?, ?>) payload.get("repository");
            if (repository.get("clone_url") != null) {
                repoUrl = repository.get("clone_url").toString();
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
            
            PipelineRunEntity run = ciCdService.trackExternalPipelineRun(
                    repoUrl, "workflow_run", branch, commitSha, commitMessage, author, finalStatus, logs, null
            );
            
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
}
