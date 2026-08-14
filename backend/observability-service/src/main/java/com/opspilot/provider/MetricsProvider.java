package com.opspilot.provider;

public interface MetricsProvider {
    String getProviderName();
    Object fetchMetrics(String metricName);
}
