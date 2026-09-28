package com.opspilot.repository;

import com.opspilot.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    
    @Query("SELECT a FROM Alert a WHERE " +
           "(:projectId IS NULL AND a.projectId IS NULL OR a.projectId = :projectId) AND " +
           "(:resource IS NULL AND a.resource IS NULL OR a.resource = :resource) AND " +
           "a.eventType = :eventType AND " +
           "a.status = :status " +
           "ORDER BY a.createdAt DESC")
    List<Alert> findMatchingAlerts(
            @Param("projectId") Long projectId,
            @Param("resource") String resource,
            @Param("eventType") String eventType,
            @Param("status") String status
    );
}
