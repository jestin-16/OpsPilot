package com.opspilot.integration;

import com.opspilot.enums.ProviderType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class IntegrationProviderRegistry {

    private final Map<ProviderType, IntegrationAdapter> adapters = new ConcurrentHashMap<>();

    @Autowired
    public IntegrationProviderRegistry(List<IntegrationAdapter> adapterList) {
        for (IntegrationAdapter adapter : adapterList) {
            registerAdapter(adapter);
        }
    }

    public void registerAdapter(IntegrationAdapter adapter) {
        if (adapter == null || adapter.getProviderType() == null) {
            throw new IllegalArgumentException("Adapter and its provider type must not be null");
        }
        adapters.put(adapter.getProviderType(), adapter);
    }

    public Optional<IntegrationAdapter> getAdapter(ProviderType providerType) {
        return Optional.ofNullable(adapters.get(providerType));
    }
}
