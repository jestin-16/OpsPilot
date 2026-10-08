package com.opspilot.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@SpringBootTest
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
}
