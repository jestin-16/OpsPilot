package com.opspilot.service;

import com.opspilot.dto.AdminOverviewResponse;
import com.opspilot.dto.AuditLogResponse;
import com.opspilot.entity.AuditLog;
import com.opspilot.entity.PlatformIntegration;
import com.opspilot.entity.PlatformSetting;
import com.opspilot.entity.User;
import com.opspilot.event.AuditEvent;
import com.opspilot.repository.AuditLogRepository;
import com.opspilot.repository.PlatformIntegrationRepository;
import com.opspilot.repository.PlatformSettingRepository;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AdminGovernanceService {
    private final UserRepository users;
    private final ProjectRepository projects;
    private final AuditLogRepository auditLogs;
    private final PlatformIntegrationRepository integrations;
    private final PlatformSettingRepository settings;
    private final ApplicationEventPublisher events;
    public AdminGovernanceService(UserRepository users, ProjectRepository projects, AuditLogRepository auditLogs, PlatformIntegrationRepository integrations, PlatformSettingRepository settings, ApplicationEventPublisher events) {
        this.users = users; this.projects = projects; this.auditLogs = auditLogs; this.integrations = integrations; this.settings = settings; this.events = events;
    }
    public AdminOverviewResponse overview() { return new AdminOverviewResponse(users.count(), users.findAll().stream().filter(u -> !Boolean.FALSE.equals(u.getIsActive())).count(), projects.count(), integrations.count(), auditLogs.count()); }
    public List<AuditLogResponse> auditLogs() { return auditLogs.findTop100ByOrderByTimestampDesc().stream().map(this::mapAudit).toList(); }
    public List<PlatformIntegration> integrations() { return integrations.findAll(); }
    @Transactional public PlatformIntegration saveIntegration(PlatformIntegration value, User actor) {
        PlatformIntegration target = value.getId() == null ? new PlatformIntegration() : integrations.findById(value.getId()).orElseThrow(() -> new IllegalArgumentException("Integration not found"));
        target.setName(value.getName()); target.setProviderType(value.getProviderType()); target.setConfigJson(value.getConfigJson()); target.setActive(value.getActive() == null || value.getActive());
        PlatformIntegration saved = integrations.save(target); audit(actor, "INTEGRATION_SAVE", "INTEGRATION", saved.getId().toString(), "Saved integration: " + saved.getName()); return saved;
    }
    @Transactional public void deleteIntegration(Long id, User actor) { integrations.deleteById(id); audit(actor, "INTEGRATION_DELETE", "INTEGRATION", id.toString(), "Deleted integration"); }
    public List<PlatformSetting> settings() { return settings.findAll(); }
    @Transactional public PlatformSetting saveSetting(String key, String value, User actor) {
        PlatformSetting setting = settings.findBySettingKey(key).orElseGet(() -> new PlatformSetting(key, value)); setting.setSettingValue(value); setting.setUpdatedAt(java.time.LocalDateTime.now());
        PlatformSetting saved = settings.save(setting); audit(actor, "PLATFORM_SETTING_UPDATE", "SETTING", key, "Updated platform setting"); return saved;
    }
    private AuditLogResponse mapAudit(AuditLog log) { User actor = log.getUser(); return new AuditLogResponse(log.getId(), actor == null ? "System" : actor.getName(), actor == null ? null : actor.getEmail(), log.getAction(), log.getResourceType(), log.getResourceId(), log.getDetails(), log.getTimestamp()); }
    private void audit(User actor, String action, String type, String id, String details) { events.publishEvent(new AuditEvent(this, actor, action, type, id, details)); }
}
