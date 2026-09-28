package com.opspilot.alerting;

import com.opspilot.entity.Alert;
import com.opspilot.entity.AlertRule;
import com.opspilot.event.EventType;
import com.opspilot.messaging.EventEnvelope;
import com.opspilot.repository.AlertRepository;
import com.opspilot.repository.AlertRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AlertEvaluatorTest {

    @Mock
    private AlertRuleRepository alertRuleRepository;

    @Mock
    private AlertRepository alertRepository;

    @InjectMocks
    private AlertEvaluator alertEvaluator;

    private AlertRule sampleRule;
    private EventEnvelope sampleEvent;

    @BeforeEach
    void setUp() {
        sampleRule = new AlertRule();
        sampleRule.setId(1L);
        sampleRule.setEventType(EventType.POD_CRASHED.name());
        sampleRule.setSeverity("CRITICAL");
        sampleRule.setThreshold(1);
        sampleRule.setTimeWindow(5);
        sampleRule.setEnabled(true);

        sampleEvent = new EventEnvelope();
        sampleEvent.setEventId("event-1");
        sampleEvent.setEventType(EventType.POD_CRASHED);
        sampleEvent.setProjectId(100L);
        sampleEvent.setSource("pod-123");
        sampleEvent.setTimestamp(LocalDateTime.now());
    }

    @Test
    void testAlertGeneratedOnThresholdMet() {
        when(alertRuleRepository.findByEnabledTrue()).thenReturn(Collections.singletonList(sampleRule));
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("ACTIVE"))).thenReturn(Collections.emptyList());
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("RESOLVED"))).thenReturn(Collections.emptyList());

        alertEvaluator.onEvent(sampleEvent);

        ArgumentCaptor<Alert> alertCaptor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository, times(1)).save(alertCaptor.capture());

        Alert savedAlert = alertCaptor.getValue();
        assertEquals(100L, savedAlert.getProjectId());
        assertEquals("pod-123", savedAlert.getResource());
        assertEquals(EventType.POD_CRASHED.name(), savedAlert.getEventType());
        assertEquals("ACTIVE", savedAlert.getStatus());
    }

    @Test
    void testAlertNotGeneratedIfThresholdNotMet() {
        sampleRule.setThreshold(3);
        when(alertRuleRepository.findByEnabledTrue()).thenReturn(Collections.singletonList(sampleRule));

        alertEvaluator.onEvent(sampleEvent);
        alertEvaluator.onEvent(sampleEvent);

        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void testAlertGeneratedAfterMultipleEventsMeetThreshold() {
        sampleRule.setThreshold(3);
        when(alertRuleRepository.findByEnabledTrue()).thenReturn(Collections.singletonList(sampleRule));
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("ACTIVE"))).thenReturn(Collections.emptyList());
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("RESOLVED"))).thenReturn(Collections.emptyList());

        alertEvaluator.onEvent(sampleEvent);
        alertEvaluator.onEvent(sampleEvent);
        alertEvaluator.onEvent(sampleEvent);

        verify(alertRepository, times(1)).save(any(Alert.class));
    }

    @Test
    void testDeduplication_ActiveAlertExists() {
        when(alertRuleRepository.findByEnabledTrue()).thenReturn(Collections.singletonList(sampleRule));
        
        Alert activeAlert = new Alert();
        activeAlert.setStatus("ACTIVE");
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("ACTIVE"))).thenReturn(Collections.singletonList(activeAlert));

        alertEvaluator.onEvent(sampleEvent);

        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void testCooldown_ResolvedAlertTooRecent() {
        when(alertRuleRepository.findByEnabledTrue()).thenReturn(Collections.singletonList(sampleRule));
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("ACTIVE"))).thenReturn(Collections.emptyList());
        
        Alert resolvedAlert = new Alert();
        resolvedAlert.setStatus("RESOLVED");
        resolvedAlert.setResolvedAt(LocalDateTime.now().minusMinutes(2)); // Resolved 2 mins ago
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("RESOLVED"))).thenReturn(Collections.singletonList(resolvedAlert));

        alertEvaluator.onEvent(sampleEvent);

        verify(alertRepository, never()).save(any(Alert.class)); // 5 min cooldown not met
    }

    @Test
    void testCooldown_ResolvedAlertPassed() {
        when(alertRuleRepository.findByEnabledTrue()).thenReturn(Collections.singletonList(sampleRule));
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("ACTIVE"))).thenReturn(Collections.emptyList());
        
        Alert resolvedAlert = new Alert();
        resolvedAlert.setStatus("RESOLVED");
        resolvedAlert.setResolvedAt(LocalDateTime.now().minusMinutes(6)); // Resolved 6 mins ago (passes 5 min cooldown)
        when(alertRepository.findMatchingAlerts(any(), any(), any(), eq("RESOLVED"))).thenReturn(Collections.singletonList(resolvedAlert));

        alertEvaluator.onEvent(sampleEvent);

        verify(alertRepository, times(1)).save(any(Alert.class));
    }
}
