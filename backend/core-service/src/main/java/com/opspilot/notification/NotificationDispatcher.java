package com.opspilot.notification;

import com.opspilot.entity.Alert;
import com.opspilot.entity.Incident;
import com.opspilot.entity.NotificationDelivery;
import com.opspilot.entity.NotificationPolicy;
import com.opspilot.messaging.EventEnvelope;
import com.opspilot.messaging.EventSubscriber;
import com.opspilot.repository.NotificationDeliveryRepository;
import com.opspilot.repository.NotificationPolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationDispatcher implements EventSubscriber {
    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);
    
    private final NotificationPolicyRepository policyRepository;
    private final NotificationDeliveryRepository deliveryRepository;
    private final Map<ChannelType, NotificationChannel> channels;

    public NotificationDispatcher(
            NotificationPolicyRepository policyRepository, 
            NotificationDeliveryRepository deliveryRepository, 
            List<NotificationChannel> channelList) {
        this.policyRepository = policyRepository;
        this.deliveryRepository = deliveryRepository;
        this.channels = channelList.stream().collect(Collectors.toMap(NotificationChannel::getChannelType, c -> c));
    }

    @Override
    @EventListener
    public void onEvent(EventEnvelope event) {
        if ("ALERT_TRIGGERED".equals(event.getEventType().name()) && event.getPayload() instanceof Alert) {
            processAlert((Alert) event.getPayload());
        }
    }

    private void processAlert(Alert alert) {
        List<NotificationPolicy> policies = policyRepository.findByEnabledTrue();
        for (NotificationPolicy policy : policies) {
            if (matches(policy, alert)) {
                dispatchToChannels(policy, "alert-" + alert.getId(), alert.getMessage(), alert);
            }
        }
    }

    private boolean matches(NotificationPolicy policy, Alert alert) {
        if (policy.getProjectId() != null && !policy.getProjectId().equals(alert.getProjectId())) return false;
        if (policy.getEventType() != null && !policy.getEventType().equals(alert.getEventType())) return false;
        return true;
    }

    private void dispatchToChannels(NotificationPolicy policy, String eventId, String message, Object context) {
        if (policy.getSelectedChannels() == null) return;
        
        String[] selectedChannels = policy.getSelectedChannels().split(",");
        for (String ch : selectedChannels) {
            ChannelType channelType;
            try {
                channelType = ChannelType.valueOf(ch.trim());
            } catch (Exception e) {
                continue;
            }
            
            // Deduplication and cooldown check
            List<NotificationDelivery> recentDeliveries = deliveryRepository.findByPolicyIdAndChannelAndLastAttemptAtAfter(
                    policy.getId(), 
                    channelType.name(), 
                    LocalDateTime.now().minusMinutes(policy.getCooldown() > 0 ? policy.getCooldown() : 1)
            );
            
            if (!recentDeliveries.isEmpty() || deliveryRepository.existsByEventIdAndPolicyIdAndChannel(eventId, policy.getId(), channelType.name())) {
                log.debug("Skipping notification delivery for event {} on channel {} due to deduplication/cooldown", eventId, channelType);
                continue;
            }
            
            NotificationDelivery delivery = new NotificationDelivery();
            delivery.setPolicyId(policy.getId());
            delivery.setEventId(eventId);
            delivery.setChannel(channelType.name());
            delivery.setStatus("PENDING");
            delivery.setMessage(message);
            delivery.setLastAttemptAt(LocalDateTime.now());
            deliveryRepository.save(delivery);
            
            attemptDelivery(delivery, policy, context);
        }
    }

    private void attemptDelivery(NotificationDelivery delivery, NotificationPolicy policy, Object context) {
        ChannelType channelType = ChannelType.valueOf(delivery.getChannel());
        NotificationChannel channel = channels.get(channelType);
        
        if (channel == null) {
            delivery.setStatus("FAILED");
            delivery.setErrorMessage("Channel implementation not found");
            deliveryRepository.save(delivery);
            return;
        }
        
        delivery.setLastAttemptAt(LocalDateTime.now());
        delivery.setRetryCount(delivery.getRetryCount() + 1);
        
        try {
            boolean success = channel.deliver(delivery.getMessage(), policy, context);
            if (success) {
                delivery.setStatus("DELIVERED");
                delivery.setErrorMessage(null);
            } else {
                delivery.setStatus("FAILED");
                delivery.setErrorMessage("Channel returned false");
            }
        } catch (Exception e) {
            delivery.setStatus("FAILED");
            delivery.setErrorMessage("Delivery failed due to exception");
            log.warn("Delivery failed for channel {} on event {}", channelType, delivery.getEventId());
        }
        
        deliveryRepository.save(delivery);
    }
    
    @Scheduled(fixedDelay = 60000)
    public void retryFailedDeliveries() {
        List<NotificationDelivery> failedDeliveries = deliveryRepository.findByStatusAndRetryCountLessThan("FAILED", 3);
        for (NotificationDelivery delivery : failedDeliveries) {
            // Re-fetch policy for retry context
            NotificationPolicy policy = policyRepository.findById(delivery.getPolicyId()).orElse(null);
            if (policy != null) {
                attemptDelivery(delivery, policy, null);
            }
        }
    }
}
