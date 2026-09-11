package com.opspilot.provider;

import com.opspilot.entity.LogEntity;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
public class LokiLogProvider implements LogProvider {
    private final WebClient client;
    private final String url;
    private final boolean enabled;

    public LokiLogProvider(WebClient monitoringWebClient,
                           @Value("${monitoring.loki.url}") String url,
                           @Value("${monitoring.loki.enabled:false}") boolean enabled) {
        this.client = monitoringWebClient;
        this.url = url.replaceAll("/$", "");
        this.enabled = enabled;
    }

    @Override
    public String getProviderName() {
        return "loki";
    }

    @Override
    public List<LogEntity> fetchLogs(String sourceService, String logLevel, String query) {
        if (!enabled) return new ArrayList<>();
        try {
            String selector = "{}";
            if (sourceService != null && !sourceService.isBlank()) selector = "{pod=\"" + sourceService.replace("\"", "") + "\"}";
            String logQuery = selector + (query == null || query.isBlank() ? "" : " |= \"" + query.replace("\"", "") + "\"");
            JsonNode root = client.get().uri(url + "/loki/api/v1/query_range?query="
                    + java.net.URLEncoder.encode(logQuery, java.nio.charset.StandardCharsets.UTF_8)
                    + "&limit=200&direction=backward").retrieve().bodyToMono(JsonNode.class).block();
            List<LogEntity> logs = new ArrayList<>();
            for (JsonNode stream : root.path("data").path("result")) {
                String service = stream.path("stream").path("pod").asText(sourceService == null ? "kubernetes" : sourceService);
                for (JsonNode value : stream.path("values")) {
                    String message = value.get(1).asText();
                    String level = detectLevel(message, logLevel);
                    if (logLevel == null || logLevel.isBlank() || logLevel.equalsIgnoreCase(level)) {
                        LogEntity log = new LogEntity(null, service, level, message);
                        log.setTimestamp(Instant.ofEpochSecond(Long.parseLong(value.get(0).asText()) / 1_000_000_000L).atZone(ZoneOffset.UTC).toLocalDateTime());
                        log.setProviderSource("loki");
                        logs.add(log);
                    }
                }
            }
            return logs;
        } catch (Exception ignored) {
            return new ArrayList<>();
        }
    }

    private String detectLevel(String message, String requested) {
        if (requested != null && !requested.isBlank()) return requested.toUpperCase();
        String upper = message.toUpperCase();
        if (upper.contains("ERROR") || upper.contains("FATAL")) return "ERROR";
        if (upper.contains("WARN")) return "WARN";
        return "INFO";
    }
}
