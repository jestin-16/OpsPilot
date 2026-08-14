package com.opspilot.provider;

import com.opspilot.entity.LogEntity;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class AwsCloudWatchProvider implements LogProvider, MetricsProvider {

    @Override
    public String getProviderName() {
        return "aws";
    }

    @Override
    public List<LogEntity> fetchLogs(String sourceService, String logLevel, String query) {
        // TODO: Implement AWS CloudWatch Logs SDK call
        return new ArrayList<>();
    }

    @Override
    public Object fetchMetrics(String metricName) {
        // TODO: Implement AWS CloudWatch Metrics SDK call
        return null;
    }
}
