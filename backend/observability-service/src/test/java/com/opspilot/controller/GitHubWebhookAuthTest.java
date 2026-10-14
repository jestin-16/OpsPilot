package com.opspilot.controller;

import com.opspilot.util.WebhookSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** /api/webhooks/github is a public route: it must refuse deliveries it can't verify, before touching any data. */
class GitHubWebhookAuthTest {

    private static final String BODY = "{\"ref\":\"refs/heads/main\",\"repository\":{\"name\":\"payment-engine\"}}";

    private WebhookController controller;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        controller = new WebhookController(); // no repositories: any write attempt would fail the test
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void isDisabledWhenNoSecretIsConfigured() throws Exception {
        ReflectionTestUtils.setField(controller, "githubWebhookSecret", "");

        mvc.perform(post("/api/webhooks/github").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void rejectsUnsignedAndWronglySignedDeliveries() throws Exception {
        ReflectionTestUtils.setField(controller, "githubWebhookSecret", "webhook-secret");

        mvc.perform(post("/api/webhooks/github").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/webhooks/github")
                        .header("X-Hub-Signature-256", WebhookSignature.sign("not-the-secret", BODY.getBytes(StandardCharsets.UTF_8)))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
    }
}
