package com.opspilot.connector.impl;

import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.IntegrationConnector;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.enums.ProviderType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * Logs shipped from an application by an agent or plain HTTP POST to /api/ingest/{projectId}. There is nothing to pull:
 * entries arrive through the ingest endpoint, are stored, and are served from the log store.
 */
@Component
public class AppLogsConnector implements IntegrationConnector {

    @Override
    public ProviderType type() {
        return ProviderType.APP_LOGS;
    }

    @Override
    public boolean isPushBased() {
        return true;
    }

    @Override
    public ConnectionResult testConnection(ConnectorConfig config) {
        // Reachability is the sender's concern; the service layer reports the time of the last received entry.
        return ConnectionResult.success("Push endpoint ready: send logs with the integration's ingest token");
    }

    @Override
    public Flux<LogEntry> streamLogs(ConnectorConfig config, LogFilters filters) {
        return Flux.empty();
    }

    @Override
    public List<LogEntry> fetchHistory(ConnectorConfig config, LogFilters filters, int page) {
        return List.of();
    }
}
