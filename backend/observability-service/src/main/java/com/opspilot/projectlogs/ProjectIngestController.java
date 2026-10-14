package com.opspilot.projectlogs;

import com.opspilot.util.WebhookSignature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.impl.GitHubEventMapper;
import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.security.ingest.ProjectIngestPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Push endpoints.
 * POST /api/ingest/{projectId}: application logs, Bearer ingest token of an APP_LOGS integration (checked by IngestTokenFilter).
 * POST /api/ingest/{projectId}/github/{integrationId}: GitHub webhook deliveries, authenticated by the HMAC signature.
 */
@RestController
@RequestMapping({"/api/ingest", "/api/v1/ingest"})
public class ProjectIngestController {

    private static final ObjectMapper JSON = new ObjectMapper();
    static final int MAX_ENTRIES_PER_REQUEST = 1000;

    private final LogIngestService ingestService;
    private final IntegrationRepository integrationRepository;
    private final int maxBodyBytes;

    public ProjectIngestController(LogIngestService ingestService, IntegrationRepository integrationRepository,
                                   @Value("${ingest.max-body-bytes:5242880}") int maxBodyBytes) {
        this.ingestService = ingestService;
        this.integrationRepository = integrationRepository;
        this.maxBodyBytes = maxBodyBytes;
    }

    @PostMapping("/{projectId}")
    public ResponseEntity<Map<String, Object>> push(@PathVariable Long projectId,
                                                    @AuthenticationPrincipal ProjectIngestPrincipal principal,
                                                    HttpServletRequest request) throws IOException {
        if (principal == null || !projectId.equals(principal.projectId())) {
            throw new ForbiddenException("Token does not belong to this project");
        }
        byte[] body = readBounded(request.getInputStream());
        if (body == null) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of("error", "Body exceeds " + maxBodyBytes + " bytes"));
        }
        IngestPayloadParser.Result parsed = IngestPayloadParser.parse(body, request.getContentType(), MAX_ENTRIES_PER_REQUEST);
        List<LogEntry> stored = ingestService.ingest(projectId, principal.integrationId(), principal.integrationName(), parsed.entries());
        return ResponseEntity.accepted().body(Map.of("accepted", stored.size(), "rejected", parsed.rejected()));
    }

    @PostMapping("/{projectId}/github/{integrationId}")
    public ResponseEntity<Map<String, Object>> githubWebhook(@PathVariable Long projectId, @PathVariable Long integrationId,
                                                             @RequestHeader(value = "X-GitHub-Event", required = false) String event,
                                                             @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
                                                             HttpServletRequest request) throws IOException {
        Optional<Integration> found = integrationRepository.findByIdAndProjectId(integrationId, projectId)
                .filter(i -> i.getProvider() == ProviderType.GITHUB || i.getProvider() == ProviderType.CICD)
                .filter(i -> i.getStatus() != IntegrationStatus.DISCONNECTED);
        byte[] body = readBounded(request.getInputStream());
        if (body == null) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of("error", "Body too large"));
        }
        // Same answer for "no such integration" and "bad signature" so ids can't be probed.
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid signature"));
        }
        Integration integration = found.get();
        ConnectorConfig config = ConnectorConfig.fromJson(projectId, integrationId, integration.getProvider(), integration.getName(),
                integration.getConfiguration(), integration.getCredentialReference());
        if (!WebhookSignature.verify(config.secret("webhookSecret"), body, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid signature"));
        }
        if ("ping".equals(event)) {
            return ResponseEntity.ok(Map.of("accepted", 0, "message", "pong"));
        }
        JsonNode payload;
        try {
            payload = JSON.readTree(body);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Body is not JSON"));
        }
        Optional<LogEntry> entry = GitHubEventMapper.fromWebhook(event, payload, integration.getProvider());
        if (entry.isEmpty()) {
            return ResponseEntity.ok(Map.of("accepted", 0, "message", "Event type ignored"));
        }
        ingestService.ingest(projectId, integrationId, integration.getName(), List.of(entry.get()));
        return ResponseEntity.accepted().body(Map.of("accepted", 1));
    }

    /** Returns null when the body is larger than the limit. */
    private byte[] readBounded(InputStream in) throws IOException {
        byte[] data = in.readNBytes(maxBodyBytes + 1);
        return data.length > maxBodyBytes ? null : data;
    }
}
