package com.opspilot.config;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.ClientBuilder;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class KubernetesClientConfig {
    @Bean
    ApiClient kubernetesApiClient() {
        ApiClient client;
        try {
            client = ClientBuilder.defaultClient();
        } catch (Exception ignored) {
            client = new ApiClient();
        }
        Configuration.setDefaultApiClient(client);
        return client;
    }
}