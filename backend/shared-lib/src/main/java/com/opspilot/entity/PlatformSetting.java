package com.opspilot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_settings")
public class PlatformSetting {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "setting_key", nullable = false, unique = true)
    private String settingKey;
    @Column(name = "setting_value", nullable = false, columnDefinition = "TEXT")
    private String settingValue;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    public PlatformSetting() {}
    public PlatformSetting(String settingKey, String settingValue) { this.settingKey = settingKey; this.settingValue = settingValue; }
    public Long getId() { return id; }
    public String getSettingKey() { return settingKey; }
    public void setSettingKey(String settingKey) { this.settingKey = settingKey; }
    public String getSettingValue() { return settingValue; }
    public void setSettingValue(String settingValue) { this.settingValue = settingValue; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
