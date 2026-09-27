package com.opspilot.repository;

import com.opspilot.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByProject_IdOrderByCreatedAtDesc(Long projectId);
    List<Incident> findAllByOrderByCreatedAtDesc();
    void deleteByProject_Id(Long projectId);
}
