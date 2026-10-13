package com.opspilot.logwatcher;

import com.opspilot.logwatcher.model.ClusterHealthSummaryDto;
import com.opspilot.logwatcher.model.ParsedLogLine;
import com.opspilot.logwatcher.model.PodSummaryDto;
import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.server.mock.EnableKubernetesMockClient;
import io.fabric8.kubernetes.client.server.mock.KubernetesMockServer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@EnableKubernetesMockClient(crud = true)
@TestPropertySource(properties = {
        "app.auth.enabled=false",
        "eureka.client.enabled=false",
        "kubernetes.watch-namespace=default"
})
class LogWatcherIntegrationTest {

    private static KubernetesMockServer server;
    private static KubernetesClient client;

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        // Create mock pod in the in-memory Kubernetes server
        Pod pod = new PodBuilder()
                .withNewMetadata()
                .withName("django-showcase-app")
                .withNamespace("default")
                .withLabels(Map.of("app", "django"))
                .endMetadata()
                .withNewSpec()
                .addNewContainer()
                .withName("web")
                .withImage("django:4.2")
                .endContainer()
                .endSpec()
                .withNewStatus()
                .withPhase("Running")
                .addNewContainerStatus()
                .withName("web")
                .withReady(true)
                .withRestartCount(0)
                .withNewState()
                .withNewRunning()
                .endRunning()
                .endState()
                .endContainerStatus()
                .endStatus()
                .build();

        client.pods().inNamespace("default").resource(pod).createOrReplace();
    }

    @Test
    @DisplayName("Should query /api/pods and retrieve running pods")
    void testGetPodsApi() {
        String url = "http://localhost:" + port + "/api/pods";
        ResponseEntity<List<PodSummaryDto>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<PodSummaryDto>>() {}
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    @DisplayName("Should query /api/health/summary and verify cluster health metrics")
    void testHealthSummaryApi() {
        String url = "http://localhost:" + port + "/api/health/summary?windowMinutes=10";
        ResponseEntity<ClusterHealthSummaryDto> response = restTemplate.getForEntity(
                url,
                ClusterHealthSummaryDto.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getWindowMinutes() == 10);
    }

    @Test
    @DisplayName("Should query /api/logs/{namespace}/{pod} without errors")
    void testGetLogsApi() {
        String url = "http://localhost:" + port + "/api/logs/default/django-showcase-app?tail=10";
        ResponseEntity<List<ParsedLogLine>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<ParsedLogLine>>() {}
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }
}
