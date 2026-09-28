package com.opspilot.integration.adapters;

import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import com.opspilot.event.EventCollector;
import com.opspilot.event.EventType;
import com.opspilot.event.InfrastructureEvent;
import com.opspilot.integration.IntegrationAdapter;
import com.opspilot.log.LogCollector;
import com.opspilot.log.LogRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Component
public class VercelIntegrationAdapter implements IntegrationAdapter, LogCollector, EventCollector {

    private static final Logger log = LoggerFactory.getLogger(VercelIntegrationAdapter.class);
    private static final String VERCEL_API_BASE = "https://api.vercel.com";

    private final RestTemplate restTemplate;

    public VercelIntegrationAdapter() {
        this.restTemplate = new RestTemplate();
    }
    
    // Package-private constructor for testing
    VercelIntegrationAdapter(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public ProviderType getProviderType() {
        return ProviderType.VERCEL;
    }

    @Override
    public Set<IntegrationCapability> getCapabilities() {
        return EnumSet.of(
            IntegrationCapability.RESOURCE_DISCOVERY,
            IntegrationCapability.LOGS,
            IntegrationCapability.EVENTS
        );
    }

    private HttpHeaders createHeaders(Integration integration) {
        String token = null;
        try {
            if (integration.getCredentialReference() != null && !integration.getCredentialReference().isEmpty()) {
                Map<String, Object> secrets = new com.fasterxml.jackson.databind.ObjectMapper().readValue(integration.getCredentialReference(), Map.class);
                token = (String) secrets.get("token");
            }
        } catch (Exception e) {
            log.error("Failed to parse Vercel secrets", e);
        }
        if (token == null || token.isEmpty()) {
            throw new IllegalArgumentException("Vercel token is missing");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        return headers;
    }

    private String getTeamId(Integration integration) {
        try {
            if (integration.getConfiguration() != null && !integration.getConfiguration().isEmpty()) {
                Map<String, Object> config = new com.fasterxml.jackson.databind.ObjectMapper().readValue(integration.getConfiguration(), Map.class);
                return (String) config.get("teamId");
            }
        } catch (Exception e) {
            log.error("Failed to parse Vercel configuration", e);
        }
        return null;
    }
    
    private String appendTeamId(String url, String teamId) {
        if (teamId != null && !teamId.isEmpty()) {
            return url + (url.contains("?") ? "&" : "?") + "teamId=" + teamId;
        }
        return url;
    }

    @Override
    public boolean testConnection(Integration integration) {
        try {
            String url = VERCEL_API_BASE + "/v2/user";
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders(integration));
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().containsKey("user");
        } catch (HttpClientErrorException e) {
            log.error("Vercel testConnection failed with status {}", e.getStatusCode());
            return false;
        } catch (Exception e) {
            log.error("Vercel testConnection failed", e);
            return false;
        }
    }

    @Override
    public boolean checkHealth(Integration integration) {
        return testConnection(integration);
    }

    @Override
    public List<Map<String, Object>> discoverResources(Integration integration) {
        List<Map<String, Object>> resources = new ArrayList<>();
        String teamId = getTeamId(integration);
        HttpEntity<Void> entity = new HttpEntity<>(createHeaders(integration));

        // 1. Discover Projects
        try {
            String url = appendTeamId(VERCEL_API_BASE + "/v9/projects", teamId);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getBody() != null && response.getBody().containsKey("projects")) {
                List<Map<String, Object>> projects = (List<Map<String, Object>>) response.getBody().get("projects");
                for (Map<String, Object> p : projects) {
                    Map<String, Object> res = new HashMap<>();
                    res.put("resourceId", p.get("id"));
                    res.put("type", "VERCEL_PROJECT");
                    res.put("name", p.get("name"));
                    resources.add(res);
                }
            }
        } catch (Exception e) {
            log.error("Failed to discover Vercel projects", e);
        }

        // 2. Discover Deployments
        try {
            String url = appendTeamId(VERCEL_API_BASE + "/v6/deployments?limit=20", teamId);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            if (response.getBody() != null && response.getBody().containsKey("deployments")) {
                List<Map<String, Object>> deployments = (List<Map<String, Object>>) response.getBody().get("deployments");
                for (Map<String, Object> d : deployments) {
                    Map<String, Object> res = new HashMap<>();
                    res.put("resourceId", d.get("uid"));
                    res.put("type", "VERCEL_DEPLOYMENT");
                    res.put("name", d.get("name"));
                    res.put("status", d.get("state"));
                    resources.add(res);
                }
            }
        } catch (Exception e) {
            log.error("Failed to discover Vercel deployments", e);
        }

        return resources;
    }

    @Override
    public List<LogRecord> collect(Integration integration, Map<String, Object> params) {
        return query(integration, params);
    }

    @Override
    public List<LogRecord> query(Integration integration, Map<String, Object> queryParams) {
        List<LogRecord> logs = new ArrayList<>();
        String deploymentId = (String) queryParams.get("deploymentId");
        if (deploymentId == null) {
            return logs;
        }

        try {
            String teamId = getTeamId(integration);
            String url = appendTeamId(VERCEL_API_BASE + "/v2/deployments/" + deploymentId + "/events", teamId);
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders(integration));
            
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            if (response.getBody() != null) {
                for (Map<String, Object> event : response.getBody()) {
                    LogRecord lr = new LogRecord();
                    // Assuming Vercel events return a created/timestamp field and payload text
                    Number timestampNum = (Number) event.get("created");
                    if (timestampNum != null) {
                        lr.setTimestamp(LocalDateTime.ofInstant(Instant.ofEpochMilli(timestampNum.longValue()), ZoneId.systemDefault()));
                    } else {
                        lr.setTimestamp(LocalDateTime.now());
                    }
                    
                    Map<String, Object> payload = (Map<String, Object>) event.get("payload");
                    if (payload != null && payload.containsKey("text")) {
                        lr.setMessage((String) payload.get("text"));
                    } else {
                        lr.setMessage(event.toString());
                    }
                    
                    lr.setService("vercel-" + deploymentId);
                    lr.setProvider(ProviderType.VERCEL);
                    lr.setIntegrationId(integration.getId());
                    lr.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                    logs.add(lr);
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch Vercel logs", e);
        }

        return logs;
    }

    @Override
    public List<InfrastructureEvent> collectEvents(Integration integration, Map<String, Object> params) {
        List<InfrastructureEvent> events = new ArrayList<>();
        List<Map<String, Object>> rawEvents = getEvents(integration, params);
        for (Map<String, Object> e : rawEvents) {
            InfrastructureEvent evt = new InfrastructureEvent();
            evt.setId(e.get("id") != null ? e.get("id").toString() : UUID.randomUUID().toString());
            // Map event timestamp
            Object tsObj = e.get("timestamp");
            if (tsObj instanceof Number) {
                evt.setTimestamp(LocalDateTime.ofInstant(Instant.ofEpochMilli(((Number) tsObj).longValue()), ZoneId.systemDefault()));
            } else {
                evt.setTimestamp(LocalDateTime.now());
            }
            evt.setProvider(ProviderType.VERCEL);
            evt.setIntegrationId(integration.getId());
            evt.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
            evt.setEventType(EventType.DEPLOYMENT_SUCCEEDED); // Simplification for demo mapping
            evt.setSeverity("INFO");
            evt.setMessage(e.get("type") + " event occurred");
            events.add(evt);
        }
        return events;
    }

    @Override
    public List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams) {
        List<Map<String, Object>> events = new ArrayList<>();
        
        try {
            String teamId = getTeamId(integration);
            // Using /v3/events to get project/team events
            String url = appendTeamId(VERCEL_API_BASE + "/v3/events?limit=50", teamId);
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders(integration));
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getBody() != null && response.getBody().containsKey("events")) {
                List<Map<String, Object>> rawEvents = (List<Map<String, Object>>) response.getBody().get("events");
                for (Map<String, Object> e : rawEvents) {
                    Map<String, Object> evt = new HashMap<>();
                    evt.put("id", e.get("id"));
                    evt.put("type", e.get("type"));
                    evt.put("timestamp", e.get("createdAt"));
                    evt.put("payload", e.get("payload"));
                    events.add(evt);
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch Vercel events", e);
        }
        
        return events;
    }
}
