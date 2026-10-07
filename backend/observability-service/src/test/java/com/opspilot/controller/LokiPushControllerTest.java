package com.opspilot.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.logstore.LogStore;
import com.opspilot.logstore.LogStore.LogStoreException;
import com.opspilot.logstore.LogStore.LogStream;
import com.opspilot.security.ingest.IngestPrincipal;
import com.opspilot.service.DockerSourceStatusService;
import com.opspilot.service.LogLabelEnforcer;
import com.opspilot.service.LokiPushParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LokiPushControllerTest {

    private LogStore store;
    private DockerSourceStatusService status;
    private LokiPushController controller;
    private final UUID sourceId = UUID.randomUUID();
    private final IngestPrincipal principal = new IngestPrincipal(sourceId, 5L, "dev", "laptop");

    @BeforeEach
    void setUp() {
        store = mock(LogStore.class);
        when(store.isEnabled()).thenReturn(true);
        status = mock(DockerSourceStatusService.class);
        controller = new LokiPushController(new LokiPushParser(new ObjectMapper()), new LogLabelEnforcer(), store,
                status, 1024 * 1024, 100);
    }

    private MockHttpServletRequest json(String body) {
        MockHttpServletRequest r = new MockHttpServletRequest("POST", "/api/v1/ingest/loki/push");
        r.setContentType("application/json");
        r.setContent(body.getBytes(StandardCharsets.UTF_8));
        return r;
    }

    private String body(String labelsJson) {
        long ts = Instant.now().getEpochSecond() * 1_000_000_000L;
        return "{\"streams\":[{\"stream\":" + labelsJson + ",\"values\":[[\"" + ts + "\",\"boom\"]]}]}";
    }

    @Test
    @SuppressWarnings("unchecked")
    void forwardsWithEnforcedLabelsAndMarksSourceSeen() {
        ResponseEntity<Void> res = controller.push(principal,
                json(body("{\"container\":\"web\",\"project\":\"999\",\"environment\":\"prod\",\"extra\":\"x\"}")));

        assertEquals(204, res.getStatusCode().value());
        ArgumentCaptor<List<LogStream>> cap = ArgumentCaptor.forClass(List.class);
        verify(store).push(cap.capture());
        assertEquals(Set.of("project", "environment", "source", "container"), cap.getValue().get(0).labels().keySet());
        assertEquals("5", cap.getValue().get(0).labels().get("project"));
        assertEquals("dev", cap.getValue().get(0).labels().get("environment"));
        assertEquals(sourceId.toString(), cap.getValue().get(0).labels().get("source"));
        verify(status).touch(sourceId);
    }

    @Test
    void noPrincipalIsRejected() {
        assertEquals(401, controller.push(null, json(body("{}"))).getStatusCode().value());
        verifyNoInteractions(store);
    }

    @Test
    void disabledStoreReturns503() {
        when(store.isEnabled()).thenReturn(false);
        assertEquals(503, controller.push(principal, json(body("{}"))).getStatusCode().value());
    }

    @Test
    void malformedBodyReturns400AndNothingIsForwarded() {
        assertEquals(400, controller.push(principal, json("{broken")).getStatusCode().value());
        verify(store, never()).push(any());
        verify(status, never()).touch(any());
    }

    @Test
    void oversizedBodyReturns413() {
        LokiPushController tiny = new LokiPushController(new LokiPushParser(new ObjectMapper()), new LogLabelEnforcer(),
                store, status, 10, 100);
        assertEquals(413, tiny.push(principal, json(body("{}"))).getStatusCode().value());
    }

    @Test
    void storeOutageReturns502SoTheAgentRetries() {
        doThrow(new LogStoreException("down", false, null)).when(store).push(any());
        assertEquals(502, controller.push(principal, json(body("{}"))).getStatusCode().value());
        verify(status, never()).touch(any());
    }

    @Test
    void storeRejectionReturns400() {
        doThrow(new LogStoreException("bad", true, null)).when(store).push(any());
        assertEquals(400, controller.push(principal, json(body("{}"))).getStatusCode().value());
    }
}
