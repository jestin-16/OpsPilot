package com.opspilot.messaging.impl;

import com.opspilot.messaging.EventEnvelope;
import com.opspilot.messaging.EventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class InProcessEventPublisher implements EventPublisher {
    
    private static final Logger log = LoggerFactory.getLogger(InProcessEventPublisher.class);
    private final ApplicationEventPublisher applicationEventPublisher;

    public InProcessEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public void publish(EventEnvelope event) {
        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID().toString());
        }
        if (event.getCorrelationId() == null) {
            event.setCorrelationId(UUID.randomUUID().toString());
        }
        if (event.getTimestamp() == null) {
            event.setTimestamp(LocalDateTime.now());
        }
        
        log.debug("Publishing event: {} - {}", event.getEventType(), event.getEventId());
        
        // Use Spring's internal event bus for the in-process implementation
        applicationEventPublisher.publishEvent(event);
    }
}
