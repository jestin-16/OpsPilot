package com.opspilot.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@SpringBootTest(properties = "app.jwt.secret=integration-test-secret-longer-than-32-bytes")
@AutoConfigureMockMvc
public class IngestSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testLokiIngestWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/ingest/loki/push")
                .contentType("application/json")
                .content("{}"))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    public void testMetricsIngestWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/ingest/metrics/push")
                .contentType("application/x-protobuf")
                .content(""))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    public void testProjectIngestWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/ingest/7")
                .contentType("application/json")
                .content("[{\"message\":\"hi\"}]"))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    public void testProjectIngestWithGarbageTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/ingest/7")
                .header("Authorization", "Bearer opl_not-a-real-token")
                .contentType("application/json")
                .content("[{\"message\":\"hi\"}]"))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    public void testProjectLogsRequireAuthentication() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/projects/7/logs"))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
        mockMvc.perform(MockMvcRequestBuilders.get("/api/projects/7/logs/stream"))
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }
}
