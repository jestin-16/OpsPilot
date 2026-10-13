package com.opspilot.logwatcher;

import com.opspilot.logwatcher.model.ClusterHealthSummaryDto;
import com.opspilot.logwatcher.model.ParsedLogLine;
import com.opspilot.logwatcher.model.PodSummaryDto;
import com.opspilot.logwatcher.service.KubernetesPodWatcher;
import com.opspilot.logwatcher.service.PodLogBufferManager;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "app.auth.enabled=false",
        "eureka.client.enabled=false",
        "kubernetes.watch-namespace=default"
})
class LogWatcherIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private KubernetesPodWatcher podWatcher;

    @Autowired
    private PodLogBufferManager bufferManager;

    @MockBean
    private CoreV1Api coreV1Api;

    @BeforeEach
    void setUp() throws Exception {
        V1Pod pod = new V1Pod()
                .metadata(new V1ObjectMeta()
                        .name("django-showcase-app")
                        .namespace("default")
                        .creationTimestamp(OffsetDateTime.now().minusMinutes(5))
                        .labels(Map.of("app", "django")))
                .spec(new V1PodSpec()
                        .nodeName("ip-172-31-0-10")
                        .containers(List.of(new V1Container().name("web").image("django:4.2"))))
                .status(new V1PodStatus()
                        .phase("Running")
                        .podIP("10.42.0.15")
                        .containerStatuses(List.of(
                                new V1ContainerStatus()
                                        .name("web")
                                        .ready(true)
                                        .restartCount(0)
                                        .state(new V1ContainerState().running(new V1ContainerStateRunning()))
                        )));

        V1PodList podList = new V1PodList().items(List.of(pod));
        CoreV1Api.APIlistNamespacedPodRequest mockReq = org.mockito.Mockito.mock(CoreV1Api.APIlistNamespacedPodRequest.class);
        when(coreV1Api.listNamespacedPod(any())).thenReturn(mockReq);
        when(mockReq.labelSelector(any())).thenReturn(mockReq);
        when(mockReq.execute()).thenReturn(podList);

        podWatcher.handlePodAddOrModify(pod);

        bufferManager.appendLog("default", "django-showcase-app",
                new ParsedLogLine("2026-10-13T12:00:00Z", Instant.now(), "default", "django-showcase-app", "web", "INFO", "Django application initialized", "raw"));
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
        assertFalse(response.getBody().isEmpty());

        PodSummaryDto pod = response.getBody().get(0);
        assertEquals("django-showcase-app", pod.getName());
        assertEquals("Running", pod.getStatus());
        assertEquals("1/1", pod.getReady());
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
        assertEquals(10, response.getBody().getWindowMinutes());
        assertTrue(response.getBody().getTotalPods() >= 1);
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
        assertFalse(response.getBody().isEmpty());
        assertEquals("Django application initialized", response.getBody().get(0).getMessage());
    }
}
