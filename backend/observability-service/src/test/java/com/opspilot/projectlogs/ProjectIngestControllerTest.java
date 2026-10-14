package com.opspilot.projectlogs;

import com.opspilot.util.WebhookSignature;
import com.opspilot.connector.LogEntry;
import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.security.ingest.ProjectIngestPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ProjectIngestControllerTest {

    private static final String SECRET = "whsec";
    private LogIngestService ingest;
    private IntegrationRepository integrations;
    private ProjectIngestController controller;

    @BeforeEach
    void setUp() {
        ingest = mock(LogIngestService.class);
        when(ingest.ingest(any(), any(), any(), any())).thenAnswer(i -> i.getArgument(3));
        integrations = mock(IntegrationRepository.class);
        controller = new ProjectIngestController(ingest, integrations, 1024);
    }

    private static MockHttpServletRequest request(String body, String contentType) {
        MockHttpServletRequest r = new MockHttpServletRequest("POST", "/api/ingest/7");
        r.setContent(body.getBytes(StandardCharsets.UTF_8));
        r.setContentType(contentType);
        return r;
    }

    private static Integration github(IntegrationStatus status, ProviderType type) {
        Project p = new Project();
        p.setId(7L);
        Integration i = new Integration();
        i.setId(3L);
        i.setProject(p);
        i.setName("repo");
        i.setProvider(type);
        i.setStatus(status);
        i.setConfiguration("{\"repo\":\"acme/shop\"}");
        i.setCredentialReference("{\"webhookSecret\":\"" + SECRET + "\"}");
        return i;
    }

    // ---- POST /api/ingest/{projectId} ----

    @Test
    void pushStoresParsedEntriesUnderTheTokensIntegration() throws Exception {
        ProjectIngestPrincipal who = new ProjectIngestPrincipal(7L, 4L, "django-demo");
        ResponseEntity<Map<String, Object>> res = controller.push(7L, who,
                request("[{\"message\":\"a\"},{\"message\":\"b\"},{\"nothing\":1}]", "application/json"));

        assertEquals(202, res.getStatusCode().value());
        assertEquals(2, res.getBody().get("accepted"));
        assertEquals(1, res.getBody().get("rejected"));
        verify(ingest).ingest(eq(7L), eq(4L), eq("django-demo"), any());
    }

    @Test
    void pushForAnotherProjectIsForbidden() {
        ProjectIngestPrincipal who = new ProjectIngestPrincipal(7L, 4L, "x");
        assertThrows(ForbiddenException.class, () -> controller.push(8L, who, request("hi", "text/plain")));
        assertThrows(ForbiddenException.class, () -> controller.push(7L, null, request("hi", "text/plain")));
        verifyNoInteractions(ingest);
    }

    @Test
    void oversizedBodyIsRejectedBeforeParsing() throws Exception {
        ResponseEntity<Map<String, Object>> res = controller.push(7L, new ProjectIngestPrincipal(7L, 4L, "x"),
                request("x".repeat(2000), "text/plain"));
        assertEquals(413, res.getStatusCode().value());
        verifyNoInteractions(ingest);
    }

    // ---- POST /api/ingest/{projectId}/github/{integrationId} ----

    private ResponseEntity<Map<String, Object>> webhook(String event, String body, String signature) throws Exception {
        return controller.githubWebhook(7L, 3L, event, signature, request(body, "application/json"));
    }

    private static String sign(String body) {
        return WebhookSignature.sign(SECRET, body.getBytes(StandardCharsets.UTF_8));
    }

    private static final String PUSH = "{\"repository\":{\"full_name\":\"acme/shop\"},\"sender\":{\"login\":\"ana\"},\"ref\":\"refs/heads/main\","
            + "\"after\":\"abcdef123456\",\"commits\":[{}],\"head_commit\":{\"message\":\"fix\",\"timestamp\":\"2024-05-01T10:00:00Z\"}}";

    @Test
    void signedPushDeliveryBecomesALogEntry() throws Exception {
        when(integrations.findByIdAndProjectId(3L, 7L)).thenReturn(Optional.of(github(IntegrationStatus.CONNECTED, ProviderType.GITHUB)));

        ResponseEntity<Map<String, Object>> res = webhook("push", PUSH, sign(PUSH));

        assertEquals(202, res.getStatusCode().value());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<LogEntry>> entries = ArgumentCaptor.forClass(List.class);
        verify(ingest).ingest(eq(7L), eq(3L), eq("repo"), entries.capture());
        assertEquals("ana pushed 1 commit(s) to main: fix", entries.getValue().get(0).getMessage());
        assertEquals(ProviderType.GITHUB, entries.getValue().get(0).getSourceType());
    }

    @Test
    void badSignatureAndUnknownIntegrationGetTheSameAnswer() throws Exception {
        when(integrations.findByIdAndProjectId(3L, 7L)).thenReturn(Optional.of(github(IntegrationStatus.CONNECTED, ProviderType.GITHUB)));
        ResponseEntity<Map<String, Object>> bad = webhook("push", PUSH, sign("tampered"));

        when(integrations.findByIdAndProjectId(3L, 7L)).thenReturn(Optional.empty());
        ResponseEntity<Map<String, Object>> unknown = webhook("push", PUSH, sign(PUSH));

        assertEquals(401, bad.getStatusCode().value());
        assertEquals(bad.getStatusCode(), unknown.getStatusCode());
        assertEquals(bad.getBody(), unknown.getBody(), "ids must not be probeable");
        verifyNoInteractions(ingest);
    }

    @Test
    void missingSecretMeansDeliveriesAreRefusedNotTrusted() throws Exception {
        Integration noSecret = github(IntegrationStatus.CONNECTED, ProviderType.GITHUB);
        noSecret.setCredentialReference(null);
        when(integrations.findByIdAndProjectId(3L, 7L)).thenReturn(Optional.of(noSecret));
        assertEquals(401, webhook("push", PUSH, sign(PUSH)).getStatusCode().value());
        assertEquals(401, webhook("push", PUSH, null).getStatusCode().value());
    }

    @Test
    void disconnectedOrWrongTypeIntegrationsDoNotAcceptDeliveries() throws Exception {
        when(integrations.findByIdAndProjectId(3L, 7L)).thenReturn(Optional.of(github(IntegrationStatus.DISCONNECTED, ProviderType.GITHUB)));
        assertEquals(401, webhook("push", PUSH, sign(PUSH)).getStatusCode().value());
        when(integrations.findByIdAndProjectId(3L, 7L)).thenReturn(Optional.of(github(IntegrationStatus.CONNECTED, ProviderType.DOCKER)));
        assertEquals(401, webhook("push", PUSH, sign(PUSH)).getStatusCode().value());
    }

    @Test
    void pingAndUnsupportedEventsAreAcknowledgedWithoutStoring() throws Exception {
        when(integrations.findByIdAndProjectId(3L, 7L)).thenReturn(Optional.of(github(IntegrationStatus.CONNECTED, ProviderType.GITHUB)));
        assertEquals(200, webhook("ping", "{}", sign("{}")).getStatusCode().value());
        assertEquals(200, webhook("star", "{}", sign("{}")).getStatusCode().value());
        verifyNoInteractions(ingest);
    }
}
