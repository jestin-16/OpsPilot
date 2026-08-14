package com.opspilot.provider;

import org.springframework.stereotype.Service;

@Service
public class PrometheusProvider implements MetricsProvider {

    @Override
    public String getProviderName() {
        return "prometheus";
    }

    @Override
    public Object fetchMetrics(String metricName) {
        // TODO: Implement WebClient call to Prometheus HTTP API /api/v1/query
        return null;
    }
}
