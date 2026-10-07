package com.opspilot.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DockerAgentConfigServiceTest {

    @Test
    void testRenderConfig() {
        DockerAgentConfigService service = new DockerAgentConfigService("http://test");
        String cfg = service.renderAlloyConfig("my-token");
        assertTrue(cfg.contains("http://test/api/v1/ingest/loki/push"));
        assertTrue(cfg.contains("http://test/api/v1/ingest/metrics/push"));
        assertTrue(cfg.contains("bearer_token = \"my-token\""));
    }

    @Test
    void testRenderPlaceholder() {
        DockerAgentConfigService service = new DockerAgentConfigService("http://test");
        String cfg = service.renderAlloyConfig("<YOUR_TOKEN>");
        assertTrue(cfg.contains("bearer_token = \"<YOUR_TOKEN>\""));
    }
}
