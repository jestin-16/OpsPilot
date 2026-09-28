package com.opspilot.repository;

import com.opspilot.entity.NotificationDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, Long> {
    boolean existsByEventIdAndPolicyIdAndChannel(String eventId, Long policyId, String channel);
    List<NotificationDelivery> findByStatusAndRetryCountLessThan(String status, Integer retryCount);
    
    // For cooldown checking:
    List<NotificationDelivery> findByPolicyIdAndChannelAndLastAttemptAtAfter(Long policyId, String channel, LocalDateTime time);
}
