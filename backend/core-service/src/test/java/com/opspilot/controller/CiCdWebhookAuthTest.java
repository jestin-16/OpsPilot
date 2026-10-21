package com.opspilot.controller;

import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.service.CiCdService;
import com.opspilot.util.WebhookSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The global CI/CD webhooks are public routes, so they must refuse anything they can't authenticate. */
class CiCdWebhookAuthTest {

    private static final String SECRET = "webhook-secret";
    private static final String BODY = "{\"zen\":\"Keep it logically awesome.\"}";

    private CiCdController controller;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        controller = new CiCdController();
        ReflectionTestUtils.setField(controller, "pipelineRunRepository", mock(PipelineRunRepository.class));
        ReflectionTestUtils.setField(controller, "ciCdService", mock(CiCdService.class));
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private void secrets(String github, String jenkins) {
        ReflectionTestUtils.setField(controller, "githubWebhookSecret", github);
        ReflectionTestUtils.setField(controller, "jenkinsWebhookSecret", jenkins);
    }

    @Test
    void githubWebhookIsDisabledWhenNoSecretIsConfigured() throws Exception {
        secrets("", "");

        mvc.perform(post("/api/v1/cicd/webhooks/github").header("X-GitHub-Event", "ping")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void githubWebhookRejectsMissingAndWrongSignatures() throws Exception {
        secrets(SECRET, "");

        mvc.perform(post("/api/v1/cicd/webhooks/github").header("X-GitHub-Event", "ping")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/cicd/webhooks/github").header("X-GitHub-Event", "ping")
                        .header("X-Hub-Signature-256", WebhookSignature.sign("some-other-secret", BODY.getBytes(StandardCharsets.UTF_8)))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void githubWebhookAcceptsACorrectlySignedDelivery() throws Exception {
        secrets(SECRET, "");

        mvc.perform(post("/api/v1/cicd/webhooks/github").header("X-GitHub-Event", "ping")
                        .header("X-Hub-Signature-256", WebhookSignature.sign(SECRET, BODY.getBytes(StandardCharsets.UTF_8)))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk());
    }

    @Test
    void jenkinsWebhookIsDisabledWhenNoTokenIsConfigured() throws Exception {
        secrets("", "");

        mvc.perform(post("/api/v1/cicd/webhooks/jenkins")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"build\":{\"phase\":\"COMPLETED\"}}"))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void jenkinsWebhookRejectsAWrongToken() throws Exception {
        secrets("", "jenkins-token");

        mvc.perform(post("/api/v1/cicd/webhooks/jenkins").header("X-Jenkins-Token", "guess")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"build\":{\"phase\":\"COMPLETED\"}}"))
                .andExpect(status().isUnauthorized());
    }
}
