package com.opspilot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_integrations")
public class PlatformIntegration {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "provider_type", nullable = false)
    private String providerType;
    @Column(nullable = false)
    private String name;
    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;
    @Column(nullable = false)
    private Boolean active = true;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    public PlatformIntegration() {}
    public Long getId() { return id; }
    public String getProviderType() { return providerType; }
    public void setProviderType(String providerType) { this.providerType = providerType; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
