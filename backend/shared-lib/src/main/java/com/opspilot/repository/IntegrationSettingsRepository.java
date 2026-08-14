package com.opspilot.repository;

import com.opspilot.entity.IntegrationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IntegrationSettingsRepository extends JpaRepository<IntegrationSettings, Long> {
    Optional<IntegrationSettings> findByProviderType(String providerType);
}
