package com.opspilot.repository;

import java.util.List;
import com.opspilot.event.InfrastructureEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InfrastructureEventRepository extends JpaRepository<InfrastructureEvent, String> {

    // Scoped list for non-privileged users (ProjectScope.visibleProjectIds).
    List<InfrastructureEvent> findByProjectIdIn(java.util.Collection<Long> projectIds);
}
