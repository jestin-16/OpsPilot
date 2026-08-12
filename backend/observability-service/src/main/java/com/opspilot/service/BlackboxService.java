package com.opspilot.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

@Service
public class BlackboxService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String BLACKBOX_URL = "http://localhost:9115/probe";

    /**
     * Probe a URL using the Prometheus Blackbox Exporter.
     * Uses http_2xx module but treats any HTTP response (including 403, 301, etc.)
     * as "reachable" — probe_success=0 just means status wasn't 2xx.
     * We return the raw metrics so the frontend can decide how to display them.
     */
    public Map<String, Object> probeUrl(String url) {
        // http_2xx module: probes the URL, returns metrics regardless of status code
        String probeUrl = BLACKBOX_URL + "?module=http_2xx&target=" + url;
        Map<String, Object> result = new HashMap<>();

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(probeUrl, String.class);
            String body = response.getBody();
            if (body != null) {
                double httpStatus = parseMetricOrZero(body, "probe_http_status_code");
                double durationSecs = parseMetricOrZero(body, "probe_duration_seconds");
                double dnsSeconds = parseMetricOrZero(body, "probe_dns_lookup_time_seconds");
                double sslExpiry = parseMetricOrZero(body, "probe_ssl_earliest_cert_expiry");
                double probeSuccess = parseMetricOrZero(body, "probe_success");
                double connectSeconds = parsePhaseMetric(body, "probe_http_duration_seconds", "connect");
                double tlsSeconds = parsePhaseMetric(body, "probe_http_duration_seconds", "tls");

                result.put("duration", durationSecs);
                result.put("dnsSeconds", dnsSeconds);
                result.put("connectSeconds", connectSeconds);
                result.put("tlsSeconds", tlsSeconds);
                result.put("httpStatus", httpStatus);
                result.put("sslExpiry", sslExpiry);
                result.put("probeSuccess", probeSuccess);

                // "reachable" means we got ANY HTTP response back (even 403/301)
                boolean reachable = httpStatus > 0;
                result.put("success", reachable ? 1.0 : 0.0);

                // Human-readable status
                if (!reachable) {
                    result.put("statusLabel", "TIMEOUT / UNREACHABLE");
                } else if (httpStatus >= 200 && httpStatus < 300) {
                    result.put("statusLabel", "OK");
                } else if (httpStatus >= 300 && httpStatus < 400) {
                    result.put("statusLabel", "REDIRECT");
                } else if (httpStatus == 403) {
                    result.put("statusLabel", "BOT BLOCKED (403)");
                } else if (httpStatus >= 400 && httpStatus < 500) {
                    result.put("statusLabel", "CLIENT ERROR");
                } else if (httpStatus >= 500) {
                    result.put("statusLabel", "SERVER ERROR");
                } else {
                    result.put("statusLabel", "UNKNOWN");
                }
            }
        } catch (Exception e) {
            result.put("success", 0.0);
            result.put("httpStatus", 0.0);
            result.put("duration", 0.0);
            result.put("statusLabel", "UNREACHABLE");
            result.put("error", e.getMessage());
        }

        return result;
    }

    private double parseMetricOrZero(String prometheusText, String metricName) {
        Double val = parseMetric(prometheusText, metricName + " ");
        return val != null ? val : 0.0;
    }

    /** Parse a simple gauge metric: "metric_name value" */
    private Double parseMetric(String prometheusText, String prefix) {
        for (String line : prometheusText.split("\n")) {
            if (line.startsWith(prefix) && !line.startsWith("#")) {
                try {
                    return Double.parseDouble(line.substring(prefix.length()).trim());
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    /** Parse a labeled gauge: probe_http_duration_seconds{phase="connect"} 0.05 */
    private double parsePhaseMetric(String prometheusText, String metricName, String phase) {
        String search = metricName + "{phase=\"" + phase + "\"}";
        for (String line : prometheusText.split("\n")) {
            if (line.startsWith(search)) {
                try {
                    return Double.parseDouble(line.substring(search.length()).trim());
                } catch (NumberFormatException ignored) {}
            }
        }
        return 0.0;
    }
}
