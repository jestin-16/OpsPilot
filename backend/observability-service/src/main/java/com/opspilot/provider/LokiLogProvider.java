package com.opspilot.provider;

import com.opspilot.entity.LogEntity;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class LokiLogProvider implements LogProvider {

    @Override
    public String getProviderName() {
        return "loki";
    }

    @Override
    public List<LogEntity> fetchLogs(String sourceService, String logLevel, String query) {
        // TODO: Implement WebClient call to Grafana Loki HTTP API /loki/api/v1/query
        return new ArrayList<>();
    }
}
