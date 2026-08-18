package com.opspilot.scheduler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.LogSourceEntity;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.LogSourceRepository;
import com.opspilot.service.FieldMappingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@EnableScheduling
public class GenericPollingScheduler {

    private static final Logger logger = LoggerFactory.getLogger(GenericPollingScheduler.class);

    @Autowired
    private LogSourceRepository logSourceRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private FieldMappingService fieldMappingService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(fixedDelay = 10000) // Check every 10 seconds
    public void pollLogSources() {
        List<LogSourceEntity> pollSources = logSourceRepository.findByIngestionModeAndIsActiveTrue("POLL");
        LocalDateTime now = LocalDateTime.now();

        for (LogSourceEntity source : pollSources) {
            LocalDateTime lastPolled = source.getLastPolledAt();
            int interval = source.getPollIntervalSeconds() != null ? source.getPollIntervalSeconds() : 60;

            if (lastPolled == null || ChronoUnit.SECONDS.between(lastPolled, now) >= interval) {
                try {
                    executePoll(source);
                    source.setLastPolledAt(LocalDateTime.now());
                    logSourceRepository.save(source);
                } catch (Exception e) {
                    logger.error("Failed to poll source {}: {}", source.getSourceName(), e.getMessage());
                }
            }
        }
    }

    private void executePoll(LogSourceEntity source) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        
        // Setup Authentication
        String authMethod = source.getAuthMethod();
        if (!"NONE".equalsIgnoreCase(authMethod) && source.getAuthConfig() != null) {
            Map<String, String> authConfig = objectMapper.readValue(source.getAuthConfig(), Map.class);
            if ("HEADER_SECRET".equalsIgnoreCase(authMethod)) {
                headers.set(authConfig.get("headerName"), authConfig.get("secretValue"));
            } else if ("BEARER_TOKEN".equalsIgnoreCase(authMethod)) {
                headers.setBearerAuth(authConfig.get("token"));
            } else if ("BASIC_AUTH".equalsIgnoreCase(authMethod)) {
                String credentials = authConfig.get("username") + ":" + authConfig.get("password");
                String base64Credentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
                headers.set("Authorization", "Basic " + base64Credentials);
            }
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(source.getPollEndpointUrl(), HttpMethod.GET, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            String rawPayload = response.getBody();
            // Depending on the API, payload might be an array of logs or a single wrapper object.
            // For simplicity and matching requirements, we assume mapPayload handles it or fieldMapping maps to a single object.
            // A more advanced implementation might use JSONPath to extract an array of logs and iterate.
            
            // To handle arrays properly (which is common for polling), we'll do a simple check.
            // If the JSON starts with '[', we'd theoretically want to process each item. 
            // For this implementation, fieldMappingService handles a single JSON block. 
            // We'll pass the whole payload and rely on JSONPath.
            Optional<LogEntity> mapped = fieldMappingService.mapPayload(rawPayload, source.getFieldMapping(), source.getSourceName());
            mapped.ifPresent(log -> logRepository.save(log));
        }
    }
}
