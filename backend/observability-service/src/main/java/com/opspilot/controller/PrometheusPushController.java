package com.opspilot.controller;

import com.opspilot.security.ingest.IngestPrincipal;
import com.opspilot.service.DockerSourceStatusService;
import com.opspilot.service.PrometheusPushRewriter;
import com.opspilot.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/ingest/metrics", "/api/ingest/metrics"})
public class PrometheusPushController {

    private final PrometheusPushRewriter rewriter;
    private final DockerSourceStatusService statusService;
    private final RateLimitService rateLimitService;
    private final int maxBodyBytes;
    private final int maxSeries;
    private final HttpClient httpClient;
    private final String prometheusWriteUrl;

    public PrometheusPushController(PrometheusPushRewriter rewriter,
                                    DockerSourceStatusService statusService,
                                    RateLimitService rateLimitService,
                                    @Value("${ingest.max-body-bytes:5242880}") int maxBodyBytes,
                                    @Value("${ingest.max-series:100000}") int maxSeries,
                                    @Value("${PROMETHEUS_URL:http://prometheus:9090}") String prometheusUrl) {
        this.rewriter = rewriter;
        this.statusService = statusService;
        this.rateLimitService = rateLimitService;
        this.maxBodyBytes = maxBodyBytes;
        this.maxSeries = maxSeries;
        this.httpClient = HttpClient.newBuilder().build();
        this.prometheusWriteUrl = prometheusUrl + "/api/v1/write";
    }

    @PostMapping("/push")
    public ResponseEntity<Void> push(@AuthenticationPrincipal IngestPrincipal principal, HttpServletRequest request) {
        if (principal == null) return ResponseEntity.status(401).build();

        if (!rateLimitService.resolveBucket(principal.sourceId()).tryConsume(1)) {
            return ResponseEntity.status(429).build();
        }

        byte[] body;
        try {
            body = request.getInputStream().readNBytes(maxBodyBytes + 1);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
        if (body.length > maxBodyBytes) return ResponseEntity.status(413).build();

        Map<String, String> injected = new HashMap<>();
        if (principal.projectId() != null) injected.put("project", principal.projectId().toString());
        if (principal.environment() != null) injected.put("environment", principal.environment());
        if (principal.sourceName() != null) injected.put("source", principal.sourceName());

        int[] stats = new int[2];
        byte[] rewritten;
        try {
            rewritten = rewriter.rewrite(body, injected, maxBodyBytes * 4, stats);
        } catch (PrometheusPushRewriter.RewriteException e) {
            return ResponseEntity.badRequest().build();
        }

        if (stats[0] > maxSeries) {
            return ResponseEntity.status(413).build();
        }

        // Forward to Prometheus
        HttpRequest fwdRequest = HttpRequest.newBuilder()
                .uri(URI.create(prometheusWriteUrl))
                .header("Content-Type", "application/x-protobuf")
                .header("Content-Encoding", "snappy")
                .header("X-Prometheus-Remote-Write-Version", "0.1.0")
                .POST(HttpRequest.BodyPublishers.ofByteArray(rewritten))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(fwdRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                return ResponseEntity.status(502).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(502).build();
        }

        statusService.touch(principal.sourceId());
        return ResponseEntity.noContent().build();
    }
}
