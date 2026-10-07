package com.opspilot.controller;

import com.opspilot.entity.PipelineSource;
import com.opspilot.service.SourceWebhookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public (no JWT) per-source webhook receiver; authentication is the HMAC signature (GitHub) or shared token (Jenkins).
 * Unknown sources return 404 and nothing is auto-created.
 */
@RestController
@RequestMapping({"/api/v1/cicd/webhooks", "/api/cicd/webhooks"})
public class SourceWebhookController {

    @Autowired
    private SourceWebhookService webhookService;

    @PostMapping("/{provider}/{sourceId}")
    public ResponseEntity<Map<String, Object>> receive(
            @PathVariable String provider,
            @PathVariable Long sourceId,
            @RequestHeader(value = "X-GitHub-Event", required = false) String githubEvent,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestHeader(value = "X-Jenkins-Token", required = false) String jenkinsToken,
            @RequestBody byte[] rawBody) {

        PipelineSource source = webhookService.resolveSource(provider, sourceId);
        if (PipelineSource.GITHUB_ACTIONS.equals(source.getProvider())) {
            return ResponseEntity.ok(webhookService.handleGithub(source, githubEvent, signature, rawBody));
        }
        return ResponseEntity.ok(webhookService.handleJenkins(source, jenkinsToken, rawBody));
    }
}
