package com.opspilot.event;

import com.opspilot.entity.AuditLog;
import com.opspilot.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AuditEventListener {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @EventListener
    @Transactional
    public void handleAuditEvent(AuditEvent event) {
        AuditLog auditLog = new AuditLog(
                event.getUser(),
                event.getAction(),
                event.getResourceType(),
                event.getResourceId(),
                event.getDetails()
        );
        auditLogRepository.save(auditLog);
    }
}
