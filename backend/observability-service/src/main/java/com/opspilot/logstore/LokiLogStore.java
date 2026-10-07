package com.opspilot.logstore;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Pushes streams to Loki's /loki/api/v1/push using the JSON format. */
@Service
public class LokiLogStore implements LogStore {

    private final WebClient client;
    private final ObjectMapper mapper;
    private final String url;
    private final boolean enabled;
    private final String username;
    private final String password;
    private final Duration timeout;

    public LokiLogStore(WebClient monitoringWebClient,
                        ObjectMapper mapper,
                        @Value("${monitoring.loki.url}") String url,
                        @Value("${monitoring.loki.enabled:false}") boolean enabled,
                        @Value("${monitoring.loki.username:}") String username,
                        @Value("${monitoring.loki.password:}") String password,
                        @Value("${monitoring.loki.push-timeout:10s}") Duration timeout) {
        this.client = monitoringWebClient;
        this.mapper = mapper;
        this.url = url.replaceAll("/+$", "");
        this.enabled = enabled;
        this.username = username;
        this.password = password;
        this.timeout = timeout;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public void push(List<LogStream> streams) {
        if (streams.isEmpty()) return;
        String body = toPushJson(streams);
        try {
            client.post()
                    .uri(url + "/loki/api/v1/push")
                    .headers(h -> {
                        h.setContentType(MediaType.APPLICATION_JSON);
                        if (username != null && !username.isBlank()) h.setBasicAuth(username, password);
                    })
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block(timeout);
        } catch (WebClientResponseException e) {
            boolean client4xx = e.getStatusCode().is4xxClientError() && e.getStatusCode().value() != 429;
            throw new LogStoreException("Loki rejected push: HTTP " + e.getStatusCode().value(), client4xx, e);
        } catch (Exception e) {
            throw new LogStoreException("Loki unreachable: " + e.getClass().getSimpleName(), false, e);
        }
    }

    @Override
    public List<LogStream> query(String logql, Instant start, Instant end, int limit) {
        if (!enabled) return List.of();
        try {
            JsonNode root = client.get()
                    .uri(url, b -> b.path("/loki/api/v1/query_range")
                            .queryParam("query", "{q}")
                            .queryParam("start", "{s}")
                            .queryParam("end", "{e}")
                            .queryParam("limit", "{l}")
                            .queryParam("direction", "backward")
                            .build(Map.of("q", logql, "s", toNanos(start), "e", toNanos(end), "l", limit)))
                    .headers(h -> {
                        if (username != null && !username.isBlank()) h.setBasicAuth(username, password);
                    })
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(timeout);
            List<LogStream> out = new ArrayList<>();
            if (root == null) return out;
            for (JsonNode r : root.path("data").path("result")) {
                Map<String, String> labels = new LinkedHashMap<>();
                r.path("stream").fields().forEachRemaining(e -> labels.put(e.getKey(), e.getValue().asText()));
                List<LogLine> lines = new ArrayList<>();
                for (JsonNode v : r.path("values")) {
                    lines.add(new LogLine(Long.parseLong(v.get(0).asText()), v.get(1).asText()));
                }
                out.add(new LogStream(labels, lines));
            }
            return out;
        } catch (WebClientResponseException e) {
            throw new LogStoreException("Loki query failed: HTTP " + e.getStatusCode().value(),
                    e.getStatusCode().is4xxClientError(), e);
        } catch (Exception e) {
            throw new LogStoreException("Loki unreachable: " + e.getClass().getSimpleName(), false, e);
        }
    }

    private static long toNanos(Instant i) {
        return i.getEpochSecond() * 1_000_000_000L + i.getNano();
    }

    String toPushJson(List<LogStream> streams) {
        ObjectNode root = mapper.createObjectNode();
        ArrayNode arr = root.putArray("streams");
        for (LogStream s : streams) {
            ObjectNode node = arr.addObject();
            ObjectNode labels = node.putObject("stream");
            for (Map.Entry<String, String> e : s.labels().entrySet()) labels.put(e.getKey(), e.getValue());
            ArrayNode values = node.putArray("values");
            for (LogLine l : s.lines()) {
                values.addArray().add(Long.toString(l.tsNanos())).add(l.line());
            }
        }
        try {
            return mapper.writeValueAsString(root);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }
}
