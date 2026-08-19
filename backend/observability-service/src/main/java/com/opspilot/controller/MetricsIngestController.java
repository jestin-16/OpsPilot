package com.opspilot.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Tags;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/v1/ingest")
public class MetricsIngestController {

    @Autowired
    private MeterRegistry meterRegistry;

    @Autowired
    private ObjectMapper objectMapper;

    // We use thread-safe references to hold the latest reported values for gauges
    private final java.util.Map<String, AtomicLong> memoryGauges = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.Map<String, AtomicReference<Double>> cpuGauges = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.Map<String, AtomicLong> requestGauges = new java.util.concurrent.ConcurrentHashMap<>();

    @PostMapping("/metrics/{sourceId}")
    public ResponseEntity<String> handleMetrics(@PathVariable Long sourceId, @RequestBody String rawPayload) {
        
        CompletableFuture.runAsync(() -> {
            try {
                JsonNode payload = objectMapper.readTree(rawPayload);
                String sourceService = payload.has("sourceService") ? payload.get("sourceService").asText() : "unknown";
                
                String tagKey = sourceId + "-" + sourceService;

                if (payload.has("memoryBytes")) {
                    long memory = payload.get("memoryBytes").asLong();
                    memoryGauges.computeIfAbsent(tagKey, k -> {
                        AtomicLong ref = new AtomicLong(0);
                        meterRegistry.gauge("opspilot.app.memory.bytes", Tags.of("source_id", String.valueOf(sourceId), "service", sourceService), ref);
                        return ref;
                    }).set(memory);
                }

                if (payload.has("cpuPercent")) {
                    double cpu = payload.get("cpuPercent").asDouble();
                    cpuGauges.computeIfAbsent(tagKey, k -> {
                        AtomicReference<Double> ref = new AtomicReference<>(0.0);
                        // Micrometer gauge with Number returning
                        meterRegistry.gauge("opspilot.app.cpu.percent", Tags.of("source_id", String.valueOf(sourceId), "service", sourceService), ref, AtomicReference::get);
                        return ref;
                    }).set(cpu);
                }

                if (payload.has("activeRequests")) {
                    long activeRequests = payload.get("activeRequests").asLong();
                    requestGauges.computeIfAbsent(tagKey, k -> {
                        AtomicLong ref = new AtomicLong(0);
                        meterRegistry.gauge("opspilot.app.requests.active", Tags.of("source_id", String.valueOf(sourceId), "service", sourceService), ref);
                        return ref;
                    }).set(activeRequests);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        return ResponseEntity.ok("Accepted Metrics");
    }
}
