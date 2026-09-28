package com.opspilot.repository;

import com.opspilot.entity.NotificationPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationPolicyRepository extends JpaRepository<NotificationPolicy, Long> {
    List<NotificationPolicy> findByEnabledTrue();
}
