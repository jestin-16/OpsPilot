package com.opspilot.controller;

import com.opspilot.logstore.LogStore;
import com.opspilot.logstore.LogStore.LogStoreException;
import com.opspilot.logstore.LogStore.LogStream;
import com.opspilot.security.ingest.IngestPrincipal;
import com.opspilot.service.DockerSourceStatusService;
import com.opspilot.service.LogLabelEnforcer;
import com.opspilot.service.LokiPushParser;
import com.opspilot.service.LokiPushParser.PushFormatException;
import com.opspilot.service.LokiPushParser.RawStream;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.zip.GZIPInputStream;

/**
 * Loki-compatible push endpoint for agents (Grafana Alloy, Fluent Bit). Authenticated by {@code IngestTokenFilter};
 * the project/environment/source labels come from the token's source record, never from the request.
 */
@RestController
@RequestMapping({"/api/v1/ingest/loki", "/api/ingest/loki"})
public class LokiPushController {

    private final LokiPushParser parser;
    private final LogLabelEnforcer enforcer;
    private final LogStore logStore;
    private final DockerSourceStatusService statusService;
    private final int maxBodyBytes;
    private final int maxLines;

    public LokiPushController(LokiPushParser parser, LogLabelEnforcer enforcer, LogStore logStore,
                              DockerSourceStatusService statusService,
                              @Value("${ingest.max-body-bytes:5242880}") int maxBodyBytes,
                              @Value("${ingest.max-lines:50000}") int maxLines) {
        this.parser = parser;
        this.enforcer = enforcer;
        this.logStore = logStore;
        this.statusService = statusService;
        this.maxBodyBytes = maxBodyBytes;
        this.maxLines = maxLines;
    }

    @PostMapping("/push")
    public ResponseEntity<Void> push(@AuthenticationPrincipal IngestPrincipal principal, HttpServletRequest request) {
        if (principal == null) return ResponseEntity.status(401).build();
        if (!logStore.isEnabled()) return ResponseEntity.status(503).build();

        byte[] body;
        try {
            body = readBody(request);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
        if (body == null) return ResponseEntity.status(413).build();

        List<RawStream> raw;
        try {
            raw = parser.parse(body, request.getContentType(), maxBodyBytes * 2);
        } catch (PushFormatException e) {
            return ResponseEntity.badRequest().build();
        }
        if (raw.stream().mapToInt(s -> s.lines().size()).sum() > maxLines) return ResponseEntity.status(413).build();

        List<LogStream> streams = enforcer.enforce(principal, raw, Instant.now());
        try {
            logStore.push(streams);
        } catch (LogStoreException e) {
            return ResponseEntity.status(e.isClientError() ? 400 : 502).build();
        }
        statusService.touch(principal.sourceId());
        return ResponseEntity.noContent().build();
    }

    /** Reads the (optionally gzipped) body, or returns null if it exceeds the size cap. */
    private byte[] readBody(HttpServletRequest request) throws IOException {
        InputStream in = request.getInputStream();
        String enc = request.getHeader("Content-Encoding");
        if (enc != null && enc.equalsIgnoreCase("gzip")) in = new GZIPInputStream(in);
        byte[] body = in.readNBytes(maxBodyBytes + 1);
        return body.length > maxBodyBytes ? null : body;
    }
}
