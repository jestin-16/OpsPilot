package com.opspilot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.converter.SecretEncryptionConverter;
import com.opspilot.controller.SourceWebhookController;
import com.opspilot.dto.PipelineSourceRequest;
import com.opspilot.dto.PipelineSourceResponse;
import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.PipelineSource;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.GlobalExceptionHandler;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.PipelineSourceRepository;
import com.opspilot.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SourceWebhookTest {

    private static final String SECRET = "test-secret-value";
    private static final String BODY = "{\"workflow_run\":{\"id\":42,\"status\":\"completed\",\"conclusion\":\"failure\","
            + "\"head_branch\":\"main\",\"head_sha\":\"abc1234\",\"html_url\":\"https://github.com/o/r/actions/runs/42\"}}";

    @Mock private PipelineSourceRepository sourceRepository;
    @Mock private CiCdService ciCdService;

    @InjectMocks private SourceWebhookService webhookService;

    private PipelineSource githubSource;

    @BeforeEach
    void setUp() {
        githubSource = new PipelineSource();
        githubSource.setId(7L);
        githubSource.setName("gh");
        githubSource.setProvider(PipelineSource.GITHUB_ACTIONS);
        githubSource.setRepoFullName("o/r");
        githubSource.setWebhookSecret(SECRET);
        githubSource.setAccessToken("ghp_supersecret");
    }

    private static String sign(String secret, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        StringBuilder sb = new StringBuilder("sha256=");
        for (byte b : mac.doFinal(body.getBytes(StandardCharsets.UTF_8))) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    @Test
    void validHmacIsAccepted() throws Exception {
        assertTrue(SourceWebhookService.verifyGithubSignature(SECRET, BODY.getBytes(StandardCharsets.UTF_8), sign(SECRET, BODY)));
    }

    @Test
    void invalidHmacIsRejected() throws Exception {
        byte[] body = BODY.getBytes(StandardCharsets.UTF_8);
        assertFalse(SourceWebhookService.verifyGithubSignature(SECRET, body, sign("other-secret", BODY)));
        assertFalse(SourceWebhookService.verifyGithubSignature(SECRET, body, "sha256=zz"));
        assertFalse(SourceWebhookService.verifyGithubSignature(SECRET, body, null));
        assertFalse(SourceWebhookService.verifyGithubSignature(SECRET, "tampered".getBytes(StandardCharsets.UTF_8), sign(SECRET, BODY)));
    }

    @Test
    void invalidSignatureYields401AndNothingIsSaved() {
        assertThrows(com.opspilot.exception.UnauthorizedException.class,
                () -> webhookService.handleGithub(githubSource, "workflow_run", "sha256=00", BODY.getBytes(StandardCharsets.UTF_8)));
        verifyNoInteractions(ciCdService);
    }

    @Test
    void unknownSourceIdIs404() {
        when(sourceRepository.findById(999L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> webhookService.resolveSource("github", 999L));
        verify(sourceRepository, never()).save(any());
    }

    @Test
    void disabledSourceIsForbidden() {
        githubSource.setEnabled(false);
        when(sourceRepository.findById(7L)).thenReturn(Optional.of(githubSource));
        assertThrows(ForbiddenException.class, () -> webhookService.resolveSource("github", 7L));
    }

    @Test
    void wrongProviderSegmentIs404() {
        when(sourceRepository.findById(7L)).thenReturn(Optional.of(githubSource));
        assertThrows(ResourceNotFoundException.class, () -> webhookService.resolveSource("jenkins", 7L));
    }

    @Test
    void nonWorkflowRunEventIsIgnoredWith200Semantics() throws Exception {
        String body = "{\"zen\":\"hi\"}";
        var res = webhookService.handleGithub(githubSource, "ping", sign(SECRET, body), body.getBytes(StandardCharsets.UTF_8));
        assertTrue(res.get("message").toString().contains("ignored"));
        verifyNoInteractions(ciCdService);
    }

    @Test
    void workflowRunIsTrackedAgainstSource() throws Exception {
        PipelineRunEntity saved = new PipelineRunEntity(null, "workflow_run", "main", "abc1234", "m", "a", "FAILED");
        saved.setRunId(1L);
        when(ciCdService.trackSourceRun(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(saved);

        webhookService.handleGithub(githubSource, "workflow_run", sign(SECRET, BODY), BODY.getBytes(StandardCharsets.UTF_8));

        verify(ciCdService).trackSourceRun(eq(githubSource), eq("workflow_run"), eq("main"), eq("abc1234"), any(), any(),
                eq("FAILED"), any(), isNull(), eq("42"), eq("https://github.com/o/r"));
        // Per-source token is handed to the async log fetch
        verify(ciCdService).fetchAndSaveGitHubLogsAsync(1L, "o", "r", 42L, "ghp_supersecret");
    }

    @Test
    void jenkinsRequiresMatchingToken() {
        PipelineSource j = new PipelineSource();
        j.setId(8L);
        j.setProvider(PipelineSource.JENKINS);
        j.setWebhookSecret(SECRET);
        byte[] body = "{\"build\":{\"phase\":\"STARTED\"}}".getBytes(StandardCharsets.UTF_8);
        assertThrows(com.opspilot.exception.UnauthorizedException.class, () -> webhookService.handleJenkins(j, "wrong", body));
        assertThrows(com.opspilot.exception.UnauthorizedException.class, () -> webhookService.handleJenkins(j, null, body));
    }

    @Test
    void controllerMaps404AndSignatureFailureTo401() throws Exception {
        SourceWebhookController controller = new SourceWebhookController();
        ReflectionTestUtils.setField(controller, "webhookService", webhookService);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GlobalExceptionHandler()).build();

        when(sourceRepository.findById(999L)).thenReturn(Optional.empty());
        mvc.perform(post("/api/v1/cicd/webhooks/github/999").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isNotFound());

        when(sourceRepository.findById(7L)).thenReturn(Optional.of(githubSource));
        mvc.perform(post("/api/v1/cicd/webhooks/github/7").contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "workflow_run").header("X-Hub-Signature-256", "sha256=00").content(BODY))
                .andExpect(status().isUnauthorized());
    }

    // ---- CiCdService.trackSourceRun ----

    @Mock private ProjectRepository projectRepository;
    @Mock private PipelineRunRepository pipelineRunRepository;
    @Mock private IncidentService incidentService;

    @Test
    void runIsSavedWithNullProjectAndFailureCreatesIncident() {
        CiCdService real = new CiCdService();
        ReflectionTestUtils.setField(real, "projectRepository", projectRepository);
        ReflectionTestUtils.setField(real, "pipelineRunRepository", pipelineRunRepository);
        ReflectionTestUtils.setField(real, "incidentService", incidentService);
        when(pipelineRunRepository.findFirstBySource_IdAndExternalRunId(7L, "42")).thenReturn(Optional.empty());
        when(pipelineRunRepository.save(any())).thenAnswer(i -> {
            PipelineRunEntity r = i.getArgument(0);
            r.setRunId(5L);
            return r;
        });

        PipelineRunEntity run = real.trackSourceRun(githubSource, "workflow_run", "main", "abc", "msg", "me", "FAILED", "logs", null, "42", "https://github.com/o/r");

        ArgumentCaptor<PipelineRunEntity> cap = ArgumentCaptor.forClass(PipelineRunEntity.class);
        verify(pipelineRunRepository).save(cap.capture());
        assertNull(cap.getValue().getProject());
        assertSame(githubSource, cap.getValue().getSource());
        assertEquals(5L, run.getRunId());
        verify(incidentService).createSourceIncident(eq(githubSource), isNull(), contains("#5"), anyString(), eq("HIGH"), anyString(), eq(5L));
    }

    @Test
    void repeatedFailedEventDoesNotDuplicateIncident() {
        CiCdService real = new CiCdService();
        ReflectionTestUtils.setField(real, "projectRepository", projectRepository);
        ReflectionTestUtils.setField(real, "pipelineRunRepository", pipelineRunRepository);
        ReflectionTestUtils.setField(real, "incidentService", incidentService);
        PipelineRunEntity existing = new PipelineRunEntity(null, "workflow_run", "main", "abc", "m", "a", "FAILED");
        existing.setRunId(5L);
        when(pipelineRunRepository.findFirstBySource_IdAndExternalRunId(7L, "42")).thenReturn(Optional.of(existing));
        when(pipelineRunRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        real.trackSourceRun(githubSource, "workflow_run", "main", "abc", "m", "a", "FAILED", null, null, "42", "u");

        verifyNoInteractions(incidentService);
    }

    // ---- secrets ----

    @Test
    void responsesMaskSecretsAndOnlyCreateRevealsWebhookSecret() throws Exception {
        PipelineSourceResponse masked = PipelineSourceResponse.from(githubSource, null);
        String json = new ObjectMapper().findAndRegisterModules().writeValueAsString(masked);
        assertFalse(json.contains("ghp_supersecret"));
        assertFalse(json.contains(SECRET));
        assertFalse(json.contains("webhookSecret"));
        assertTrue(json.contains(PipelineSourceResponse.MASK));
        assertTrue(json.contains("/api/v1/cicd/webhooks/github/7"));

        String once = new ObjectMapper().findAndRegisterModules().writeValueAsString(masked.withWebhookSecret(SECRET));
        assertTrue(once.contains(SECRET));
        assertFalse(once.contains("ghp_supersecret"));
    }

    @Test
    void entityNeverSerializesSecrets() throws Exception {
        String json = new ObjectMapper().findAndRegisterModules().writeValueAsString(githubSource);
        assertFalse(json.contains("ghp_supersecret"));
        assertFalse(json.contains(SECRET));
    }

    @Test
    void createGeneratesStrongSecretAndMasksTokens() {
        PipelineSourceService svc = new PipelineSourceService();
        ReflectionTestUtils.setField(svc, "sourceRepository", sourceRepository);
        ReflectionTestUtils.setField(svc, "pipelineRunRepository", pipelineRunRepository);
        when(sourceRepository.save(any())).thenAnswer(i -> {
            PipelineSource s = i.getArgument(0);
            s.setId(3L);
            return s;
        });
        PipelineSourceRequest req = new PipelineSourceRequest();
        req.setName("n");
        req.setProvider("GITHUB_ACTIONS");
        req.setRepoFullName("o/r");
        req.setAccessToken("ghp_xyz");

        PipelineSourceResponse res = svc.create(req);

        assertNotNull(res.getWebhookSecret());
        assertTrue(res.getWebhookSecret().length() >= 43); // 32 random bytes, base64url
        assertEquals(PipelineSourceResponse.MASK, res.getAccessToken());
        assertNotEquals("ghp_xyz", res.getAccessToken());
    }

    @Test
    void secretConverterRoundTripsAndDoesNotStorePlaintext() {
        SecretEncryptionConverter c = new SecretEncryptionConverter();
        String enc = c.convertToDatabaseColumn("hunter2");
        assertNotNull(enc);
        assertFalse(enc.contains("hunter2"));
        assertEquals("hunter2", c.convertToEntityAttribute(enc));
        assertNotEquals(enc, c.convertToDatabaseColumn("hunter2")); // random IV
        assertEquals("legacy", c.convertToEntityAttribute("legacy"));
    }
}
