package com.opspilot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.LogSourceEntity;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.LogSourceRepository;
import com.opspilot.service.FieldMappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/v1/ingest")
public class GenericWebhookIngestController {

    @Autowired
    private LogSourceRepository logSourceRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private FieldMappingService fieldMappingService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/webhook/{sourceId}")
    public ResponseEntity<String> handleWebhook(
            @PathVariable Long sourceId,
            @RequestBody String rawPayload,
            HttpServletRequest request
    ) {
        Optional<LogSourceEntity> sourceOpt = logSourceRepository.findById(sourceId);
        if (sourceOpt.isEmpty() || !sourceOpt.get().getIsActive()) {
            return ResponseEntity.notFound().build();
        }

        LogSourceEntity source = sourceOpt.get();
        if (!"WEBHOOK".equalsIgnoreCase(source.getIngestionMode())) {
            return ResponseEntity.badRequest().body("Source is not configured for WEBHOOK mode");
        }

        // Validate Authentication
        if (!validateAuth(source, request)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        // Process async to return 200 OK immediately
        CompletableFuture.runAsync(() -> {
            try {
                if (rawPayload.trim().startsWith("[")) {
                    com.fasterxml.jackson.databind.JsonNode arrayNode = objectMapper.readTree(rawPayload);
                    for (com.fasterxml.jackson.databind.JsonNode node : arrayNode) {
                        Optional<LogEntity> mapped = fieldMappingService.mapPayload(node.toString(), source.getFieldMapping(), source.getSourceName());
                        mapped.ifPresent(log -> {
                            log.setDeployment(null);
                            logRepository.save(log);
                        });
                    }
                } else {
                    Optional<LogEntity> mapped = fieldMappingService.mapPayload(rawPayload, source.getFieldMapping(), source.getSourceName());
                    mapped.ifPresent(log -> {
                        log.setDeployment(null);
                        logRepository.save(log);
                    });
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        return ResponseEntity.ok("Accepted");
    }

    private boolean validateAuth(LogSourceEntity source, HttpServletRequest request) {
        String authMethod = source.getAuthMethod();
        if ("NONE".equalsIgnoreCase(authMethod)) {
            return true;
        }

        try {
            String configJson = source.getAuthConfig();
            Map<String, String> authConfig = objectMapper.readValue(configJson, Map.class);

            if ("HEADER_SECRET".equalsIgnoreCase(authMethod)) {
                String headerName = authConfig.get("headerName");
                String expectedValue = authConfig.get("secretValue");
                String actualValue = request.getHeader(headerName);
                return expectedValue != null && expectedValue.equals(actualValue);
            } else if ("BEARER_TOKEN".equalsIgnoreCase(authMethod)) {
                String expectedToken = authConfig.get("token");
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    return expectedToken != null && expectedToken.equals(authHeader.substring(7));
                }
                return false;
            } else if ("BASIC_AUTH".equalsIgnoreCase(authMethod)) {
                String expectedUser = authConfig.get("username");
                String expectedPass = authConfig.get("password");
                String expectedBase64 = Base64.getEncoder().encodeToString((expectedUser + ":" + expectedPass).getBytes(StandardCharsets.UTF_8));
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Basic ")) {
                    return expectedBase64.equals(authHeader.substring(6));
                }
                return false;
            }
        } catch (Exception e) {
            // Log warning, fail validation
        }
        return false;
    }
}
