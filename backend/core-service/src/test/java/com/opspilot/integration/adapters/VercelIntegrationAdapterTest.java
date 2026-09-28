package com.opspilot.integration.adapters;

import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.enums.ProviderType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class VercelIntegrationAdapterTest {

    @Mock
    private RestTemplate restTemplate;

    private VercelIntegrationAdapter adapter;
    private Integration integration;

    @BeforeEach
    void setUp() {
        adapter = new VercelIntegrationAdapter(restTemplate);

        Project project = new Project();
        project.setId(1L);

        integration = new Integration();
        integration.setId(100L);
        integration.setProject(project);
        integration.setProvider(ProviderType.VERCEL);

        integration.setConfiguration("{\"teamId\": \"team_123\"}");
        integration.setCredentialReference("{\"token\": \"VERCEL_DUMMY_TOKEN\"}");
    }

    @Test
    void testGetProviderType() {
        assertEquals(ProviderType.VERCEL, adapter.getProviderType());
    }

    @Test
    void testConnectionSuccess() {
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("user", new HashMap<>());
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(responseBody, HttpStatus.OK);

        when(restTemplate.exchange(
                eq("https://api.vercel.com/v2/user"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(responseEntity);

        assertTrue(adapter.testConnection(integration));
    }

    @Test
    void testConnectionFailure() {
        when(restTemplate.exchange(
                eq("https://api.vercel.com/v2/user"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenThrow(new RuntimeException("Unauthorized"));

        assertFalse(adapter.testConnection(integration));
    }

    @Test
    void testDiscoverResourcesGracefulFailure() {
        // Will throw exceptions when calling restTemplate since it's mocked and not stubbed
        when(restTemplate.exchange(
                any(String.class),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenThrow(new RuntimeException("API Error"));

        assertTrue(adapter.discoverResources(integration).isEmpty());
    }
}
