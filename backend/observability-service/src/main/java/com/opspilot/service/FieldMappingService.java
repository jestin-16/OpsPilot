package com.opspilot.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.PathNotFoundException;
import com.opspilot.entity.LogEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class FieldMappingService {

    private static final Logger logger = LoggerFactory.getLogger(FieldMappingService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Maps a raw JSON payload into a normalized LogEntity using the provided JSONPath mapping.
     * @param rawPayload The raw JSON string from the webhook or polling endpoint.
     * @param fieldMappingJson The JSON string containing key-value pairs (internalField -> jsonPath).
     * @param defaultSourceService Default source name if the mapping doesn't provide one.
     * @return LogEntity with extracted fields, or empty if mapping completely fails.
     */
    public Optional<LogEntity> mapPayload(String rawPayload, String fieldMappingJson, String defaultSourceService) {
        try {
            Map<String, String> fieldMapping = objectMapper.readValue(fieldMappingJson, new TypeReference<Map<String, String>>() {});
            DocumentContext context = JsonPath.parse(rawPayload);

            String message = extractField(context, fieldMapping.get("message"), "No message");
            String logLevel = extractField(context, fieldMapping.get("logLevel"), "INFO");
            String sourceService = extractField(context, fieldMapping.get("sourceService"), defaultSourceService);
            
            // Timestamp handling could be more complex, but we'll extract as string and let LogEntity set default to now() if missing
            // In a full implementation, we'd parse the string to LocalDateTime.
            String timestampStr = extractField(context, fieldMapping.get("timestamp"), null);

            LogEntity log = new LogEntity();
            log.setMessage(message);
            log.setLogLevel(logLevel);
            log.setSourceService(sourceService);
            log.setProviderSource("generic-ingest");
            // If timestampStr is valid, we'd parse it here. For now, rely on LogEntity's default constructor which sets it to now().
            
            return Optional.of(log);

        } catch (Exception e) {
            logger.warn("Malformed payload or invalid field mapping. Payload: {}", rawPayload, e);
            return Optional.empty(); // Graceful handling of bad records
        }
    }

    private String extractField(DocumentContext context, String jsonPath, String defaultValue) {
        if (jsonPath == null || jsonPath.trim().isEmpty()) {
            return defaultValue;
        }
        try {
            Object result = context.read(jsonPath);
            return result != null ? result.toString() : defaultValue;
        } catch (PathNotFoundException e) {
            logger.warn("JSONPath {} not found in payload.", jsonPath);
            return defaultValue;
        } catch (Exception e) {
            logger.warn("Error evaluating JSONPath {}: {}", jsonPath, e.getMessage());
            return defaultValue;
        }
    }
}
