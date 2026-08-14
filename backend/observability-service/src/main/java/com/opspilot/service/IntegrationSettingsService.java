package com.opspilot.service;

import com.opspilot.entity.IntegrationSettings;
import com.opspilot.repository.IntegrationSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class IntegrationSettingsService {
    private final IntegrationSettingsRepository repository;

    public List<IntegrationSettings> getAllIntegrations() {
        return repository.findAll();
    }

    public IntegrationSettings saveIntegration(IntegrationSettings settings) {
        Optional<IntegrationSettings> existing = repository.findByProviderType(settings.getProviderType());
        if (existing.isPresent()) {
            IntegrationSettings toUpdate = existing.get();
            toUpdate.setName(settings.getName());
            toUpdate.setConfigJson(settings.getConfigJson());
            toUpdate.setActive(settings.isActive());
            return repository.save(toUpdate);
        }
        return repository.save(settings);
    }
}
