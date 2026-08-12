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

    public Map<String, Object> probeUrl(String url) {
        String probeUrl = BLACKBOX_URL + "?module=http_2xx&target=" + url;
        Map<String, Object> result = new HashMap<>();
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(probeUrl, String.class);
            String body = response.getBody();
            if (body != null) {
                result.put("success", parseMetric(body, "probe_success"));
                result.put("duration", parseMetric(body, "probe_duration_seconds"));
                result.put("httpStatus", parseMetric(body, "probe_http_status_code"));
                result.put("sslExpiry", parseMetric(body, "probe_ssl_earliest_cert_expiry"));
            }
        } catch (Exception e) {
            result.put("success", 0.0);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    private Double parseMetric(String prometheusText, String metricName) {
        String[] lines = prometheusText.split("\n");
        for (String line : lines) {
            if (line.startsWith(metricName + " ")) {
                try {
                    return Double.parseDouble(line.split(" ")[1]);
                } catch (NumberFormatException e) {
                    return null;
                }
            }
        }
        return null;
    }
}
