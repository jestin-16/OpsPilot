package com.opspilot.repository;

import com.opspilot.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByProject_IdOrderByCreatedAtDesc(Long projectId);
    List<Incident> findAllByOrderByCreatedAtDesc();
    void deleteByProject_Id(Long projectId);

    @Query("SELECT i FROM Incident i WHERE (i.project.id = :projectId OR (:projectId IS NULL AND i.project IS NULL)) AND i.title = :title AND i.status IN :statuses")
    List<Incident> findActiveCorrelationIncidents(
            @Param("title") String title, 
            @Param("projectId") Long projectId, 
            @Param("statuses") List<String> statuses
    );
}
