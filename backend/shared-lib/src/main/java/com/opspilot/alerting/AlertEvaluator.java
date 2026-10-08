package com.opspilot.alerting;

import com.opspilot.entity.Alert;
import com.opspilot.entity.AlertRule;
import com.opspilot.messaging.EventEnvelope;
import com.opspilot.messaging.EventSubscriber;
import com.opspilot.repository.AlertRepository;
import com.opspilot.repository.AlertRuleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import com.opspilot.messaging.EventPublisher;

@Component
public class AlertEvaluator implements EventSubscriber {

    private static final Logger log = LoggerFactory.getLogger(AlertEvaluator.class);
    
    private final AlertRuleRepository alertRuleRepository;
    private final AlertRepository alertRepository;
    private final EventPublisher eventPublisher;

    // In-memory sliding window for threshold counting: Key -> List of timestamps
    private final Map<String, Deque<LocalDateTime>> eventHistory = new ConcurrentHashMap<>();

    public AlertEvaluator(AlertRuleRepository alertRuleRepository, AlertRepository alertRepository, EventPublisher eventPublisher) {
        this.alertRuleRepository = alertRuleRepository;
        this.alertRepository = alertRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @EventListener
    public void onEvent(EventEnvelope event) {
        List<AlertRule> rules = alertRuleRepository.findByEnabledTrue();
        
        for (AlertRule rule : rules) {
            if (matches(rule, event)) {
                evaluateRule(rule, event);
            }
        }
    }

    private boolean matches(AlertRule rule, EventEnvelope event) {
        if (!rule.getEventType().equals(event.getEventType().name())) {
            return false;
        }
        if (rule.getProjectId() != null && !rule.getProjectId().equals(event.getProjectId())) {
            return false;
        }
        if (rule.getResource() != null && !rule.getResource().equals(event.getSource()) && !rule.getResource().equals(getResourceFromPayload(event))) {
            return false;
        }
        // Could also match on severity if rule defines a minimum severity, but keeping simple for now
        return true;
    }
    
    private String getResourceFromPayload(EventEnvelope event) {
        // Fallback to extract resource from specific payload types if needed
        return event.getSource();
    }

    private void evaluateRule(AlertRule rule, EventEnvelope event) {
        String historyKey = rule.getId() + "-" + event.getProjectId() + "-" + event.getSource();
        
        Deque<LocalDateTime> history = eventHistory.computeIfAbsent(historyKey, k -> new LinkedList<>());
        
        synchronized (history) {
            LocalDateTime now = LocalDateTime.now();
            history.addLast(now);
            
            // Evict old events outside the time window
            LocalDateTime windowStart = now.minusMinutes(rule.getTimeWindow());
            while (!history.isEmpty() && history.peekFirst().isBefore(windowStart)) {
                history.removeFirst();
            }
            
            if (history.size() >= rule.getThreshold()) {
                triggerAlert(rule, event);
                // Clear history after triggering to avoid continuous triggering for every new event
                history.clear();
            }
        }
    }

    private void triggerAlert(AlertRule rule, EventEnvelope event) {
        triggerAlert(rule, event.getProjectId(), event.getSource());
    }

    public void triggerAlert(AlertRule rule, Long projectId, String resource) {
        // Deduplication & Cooldown: Same project + same resource + same alert type
        List<Alert> activeAlerts = alertRepository.findMatchingAlerts(
                projectId, 
                resource, 
                rule.getEventType(), 
                "ACTIVE"
        );
        
        if (!activeAlerts.isEmpty()) {
            log.debug("Alert already ACTIVE for {} / {} / {}", projectId, resource, rule.getEventType());
            return;
        }
        
        // Check cooldown (e.g., 5 minutes since last resolved)
        List<Alert> resolvedAlerts = alertRepository.findMatchingAlerts(
                projectId, 
                resource, 
                rule.getEventType(), 
                "RESOLVED"
        );
        
        if (!resolvedAlerts.isEmpty()) {
            Alert lastResolved = resolvedAlerts.get(0); // ordered by createdAt desc
            if (lastResolved.getResolvedAt() != null && 
                lastResolved.getResolvedAt().plusMinutes(5).isAfter(LocalDateTime.now())) {
                log.debug("Alert in COOLDOWN for {} / {} / {}", projectId, resource, rule.getEventType());
                return;
            }
        }
        
        Alert alert = new Alert();
        alert.setAlertRuleId(rule.getId());
        alert.setProjectId(projectId);
        alert.setResource(resource);
        alert.setEventType(rule.getEventType());
        alert.setSeverity(rule.getSeverity());
        alert.setStatus("ACTIVE");
        alert.setCreatedAt(LocalDateTime.now());
        alert.setMessage(String.format("Alert triggered for rule '%s' on resource '%s'", rule.getEventType(), resource));
        
        alertRepository.save(alert);
        log.info("Triggered Alert: {}", alert.getMessage());
        
        // Publish ALERT_TRIGGERED event for Incident Correlation
        EventEnvelope alertEvent = new EventEnvelope();
        alertEvent.setEventType(com.opspilot.event.EventType.valueOf("ALERT_TRIGGERED"));
        alertEvent.setProjectId(alert.getProjectId());
        alertEvent.setSource(resource);
        alertEvent.setPayload(alert);
        eventPublisher.publish(alertEvent);
    }
}
