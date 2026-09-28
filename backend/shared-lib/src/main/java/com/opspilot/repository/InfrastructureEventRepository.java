package com.opspilot.repository;

import com.opspilot.event.InfrastructureEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InfrastructureEventRepository extends JpaRepository<InfrastructureEvent, String> {
}
