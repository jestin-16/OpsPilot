package com.opspilot.connector;

import com.opspilot.enums.ProviderType;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

/**
 * Strategy for one integration type. Implementations are stateless Spring beans; everything they need arrives in the
 * {@link ConnectorConfig}. Implementations must never log or return the config's secrets.
 */
public interface IntegrationConnector {

    ProviderType type();

    /** Cheap reachability/credential check. Must not throw; report problems in the result. */
    ConnectionResult testConnection(ConnectorConfig config);

    /** Live log stream. Completes or errors when the source goes away; the caller decides whether to reconnect. */
    Flux<LogEntry> streamLogs(ConnectorConfig config, LogFilters filters);

    /** One page (0-based) of recent entries, newest first. */
    List<LogEntry> fetchHistory(ConnectorConfig config, LogFilters filters, int page);

    /** Items the UI can pick from (containers, namespaces, pods ...). Empty when not applicable. */
    default List<Map<String, Object>> discoverResources(ConnectorConfig config, String kind) {
        return List.of();
    }

    /** True for connectors fed by pushes (APP_LOGS): there is nothing to pull or follow. */
    default boolean isPushBased() {
        return false;
    }
}
