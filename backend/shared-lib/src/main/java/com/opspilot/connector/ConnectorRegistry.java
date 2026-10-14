package com.opspilot.connector;

import com.opspilot.enums.ProviderType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class ConnectorRegistry {

    private final Map<ProviderType, IntegrationConnector> connectors = new EnumMap<>(ProviderType.class);

    public ConnectorRegistry(List<IntegrationConnector> all) {
        for (IntegrationConnector c : all) {
            if (connectors.put(c.type(), c) != null) {
                throw new IllegalStateException("Two connectors registered for " + c.type());
            }
        }
    }

    public Optional<IntegrationConnector> find(ProviderType type) {
        return Optional.ofNullable(connectors.get(type));
    }

    public IntegrationConnector require(ProviderType type) {
        return find(type).orElseThrow(() -> new UnsupportedOperationException("No connector for " + type));
    }

    public boolean supports(ProviderType type) {
        return connectors.containsKey(type);
    }
}
