package com.opspilot.controller;

import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.repository.PipelineRunRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import com.opspilot.service.CiCdService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

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

    @PostMapping("/webhooks/github")
    public ResponseEntity<String> handleGithubWebhook(@RequestBody Map<String, Object> payload) {
        try {
            // Simplified webhook parsing (assuming standard GitHub push payload)
            Map<String, Object> repository = (Map<String, Object>) payload.get("repository");
            String repoUrl = (String) repository.get("clone_url");
            
            String ref = (String) payload.get("ref");
            String branch = ref != null ? ref.replace("refs/heads/", "") : "main";
            
            Map<String, Object> headCommit = (Map<String, Object>) payload.get("head_commit");
            String commitSha = (String) headCommit.get("id");
            String commitMessage = (String) headCommit.get("message");
            
            Map<String, Object> authorMap = (Map<String, Object>) headCommit.get("author");
            String author = (String) authorMap.get("name");

            ciCdService.processGitHubWebhook(repoUrl, branch, commitSha, commitMessage, author);
            return ResponseEntity.ok("Webhook received and pipeline triggered");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Invalid webhook payload");
        }
    }
}
