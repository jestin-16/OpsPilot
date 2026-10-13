package com.opspilot.logwatcher.controller;

import com.opspilot.logwatcher.model.ParsedLogLine;
import com.opspilot.logwatcher.service.KubernetesLogStreamer;
import com.opspilot.logwatcher.service.PodLogBufferManager;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping({"/api/logs", "/api/v1/logs"})
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LogController {

    private final PodLogBufferManager bufferManager;
    private final KubernetesLogStreamer logStreamer;

    public LogController(PodLogBufferManager bufferManager, KubernetesLogStreamer logStreamer) {
        this.bufferManager = bufferManager;
        this.logStreamer = logStreamer;
    }

    /**
     * REST endpoint to fetch buffered logs for a pod.
     * GET /api/logs/{namespace}/{pod}?container=&tail=&since=&level=
     */
    @GetMapping("/{namespace}/{pod}")
    public ResponseEntity<List<ParsedLogLine>> getLogs(
            @PathVariable String namespace,
            @PathVariable String pod,
            @RequestParam(required = false) String container,
            @RequestParam(required = false, defaultValue = "500") int tail,
            @RequestParam(required = false) String since,
            @RequestParam(required = false) String level) {

        Instant sinceInstant = parseSince(since);
        List<ParsedLogLine> logs = bufferManager.getLogs(namespace, pod, container, level, sinceInstant, tail);
        return ResponseEntity.ok(logs);
    }

    /**
     * Real-time SSE stream endpoint for pod logs.
     * GET /api/logs/{namespace}/{pod}/stream?container=&tail=
     */
    @GetMapping(value = "/{namespace}/{pod}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLogs(
            @PathVariable String namespace,
            @PathVariable String pod,
            @RequestParam(required = false) String container,
            @RequestParam(required = false, defaultValue = "100") int tail) {

        return logStreamer.subscribe(namespace, pod, container, tail);
    }

    private Instant parseSince(String since) {
        if (since == null || since.isBlank()) {
            return null;
        }

        try {
            // Check if epoch milliseconds
            if (since.matches("^\\d+$")) {
                return Instant.ofEpochMilli(Long.parseLong(since));
            }

            // Check if duration format, e.g. "5m", "1h", "30s"
            if (since.endsWith("m") || since.endsWith("h") || since.endsWith("s")) {
                long amount = Long.parseLong(since.substring(0, since.length() - 1));
                char unit = since.charAt(since.length() - 1);
                Duration d = switch (unit) {
                    case 's' -> Duration.ofSeconds(amount);
                    case 'm' -> Duration.ofMinutes(amount);
                    case 'h' -> Duration.ofHours(amount);
                    default -> Duration.ZERO;
                };
                return Instant.now().minus(d);
            }

            // Otherwise parse ISO-8601
            return Instant.parse(since);
        } catch (DateTimeParseException | NumberFormatException e) {
            return null;
        }
    }
}
