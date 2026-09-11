package com.opspilot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class MonitoringClientConfig {

    @Bean
    WebClient monitoringWebClient(WebClient.Builder builder) {
        return builder.build();
    }
}