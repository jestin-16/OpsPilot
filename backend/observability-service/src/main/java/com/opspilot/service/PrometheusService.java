package com.opspilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.OptionalDouble;

@Service
public class PrometheusService {
    private final WebClient client;
    private final String url;
    private final boolean enabled;
    private final Duration timeout;
    private volatile String lastError;

    public PrometheusService(WebClient monitoringWebClient,
                             @Value("${monitoring.prometheus.url}") String url,
                             @Value("${monitoring.prometheus.enabled:true}") boolean enabled,
                             @Value("${monitoring.prometheus.username:}") String username,
                             @Value("${monitoring.prometheus.password:}") String password,
                             @Value("${monitoring.prometheus.timeout:3s}") Duration timeout) {
        WebClient.Builder builder = monitoringWebClient.mutate();
        if (!username.isBlank()) {
            String credentials = Base64.getEncoder().encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + credentials);
        }
        this.client = builder.build();
        this.url = url.replaceAll("/$", "");
        this.enabled = enabled;
        this.timeout = timeout;
    }

    public OptionalDouble query(String promQl) {
        if (!enabled) {
            lastError = "Prometheus integration is disabled";
            return OptionalDouble.empty();
        }
        try {
            JsonNode root = client.get()
                    .uri(url + "/api/v1/query?query=" + java.net.URLEncoder.encode(promQl, StandardCharsets.UTF_8))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(timeout)
                    .block();
            OptionalDouble result = extractScalar(root);
            lastError = result.isPresent() ? null : "Prometheus returned no scalar result for the query";
            return result;
        } catch (Exception error) {
            lastError = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            return OptionalDouble.empty();
        }
    }

    public String getLastError() {
        return lastError;
    }

    public boolean isAvailable() {
        if (!enabled) return false;
        try {
            return client.get().uri(url + "/-/ready").retrieve().toBodilessEntity().timeout(timeout).block() != null;
        } catch (Exception error) {
            lastError = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            return false;
        }
    }

    private OptionalDouble extractScalar(JsonNode root) {
        if (root == null || !"success".equals(root.path("status").asText())) return OptionalDouble.empty();
        JsonNode result = root.path("data").path("result");
        if (!result.isArray() || result.isEmpty()) return OptionalDouble.empty();
        JsonNode value = result.get(0).path("value");
        if (!value.isArray() || value.size() < 2) return OptionalDouble.empty();
        try {
            return OptionalDouble.of(Double.parseDouble(value.get(1).asText()));
        } catch (NumberFormatException ignored) {
            return OptionalDouble.empty();
        }
    }
}