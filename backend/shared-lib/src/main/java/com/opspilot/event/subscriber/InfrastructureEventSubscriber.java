package com.opspilot.event.subscriber;

import com.opspilot.event.InfrastructureEvent;
import com.opspilot.messaging.EventEnvelope;
import com.opspilot.messaging.EventSubscriber;
import com.opspilot.repository.InfrastructureEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class InfrastructureEventSubscriber implements EventSubscriber {

    private static final Logger log = LoggerFactory.getLogger(InfrastructureEventSubscriber.class);
    private final InfrastructureEventRepository repository;

    public InfrastructureEventSubscriber(InfrastructureEventRepository repository) {
        this.repository = repository;
    }

    @Override
    @EventListener
    public void onEvent(EventEnvelope event) {
        if (event.getPayload() instanceof InfrastructureEvent) {
            InfrastructureEvent infraEvent = (InfrastructureEvent) event.getPayload();
            handleInfrastructureEvent(infraEvent, event.getCorrelationId());
        }
    }

    private void handleInfrastructureEvent(InfrastructureEvent infraEvent, String correlationId) {
        try {
            if (infraEvent.getId() == null) {
                log.warn("InfrastructureEvent is missing ID, cannot ensure idempotency. CorrelationId: {}", correlationId);
                return;
            }
            
            // Idempotency check
            if (repository.existsById(infraEvent.getId())) {
                log.debug("InfrastructureEvent {} already processed, skipping. CorrelationId: {}", infraEvent.getId(), correlationId);
                return;
            }
            
            repository.save(infraEvent);
            log.info("Successfully processed and saved InfrastructureEvent {}. CorrelationId: {}", infraEvent.getId(), correlationId);
        } catch (Exception e) {
            log.error("Error processing InfrastructureEvent {}. CorrelationId: {}", infraEvent.getId(), correlationId, e);
            // Error handling/retry logic can be extended here
        }
    }
}
