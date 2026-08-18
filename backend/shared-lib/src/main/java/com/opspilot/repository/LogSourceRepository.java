package com.opspilot.repository;

import com.opspilot.entity.LogSourceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogSourceRepository extends JpaRepository<LogSourceEntity, Long> {
    List<LogSourceEntity> findByProject_Id(Long projectId);
    List<LogSourceEntity> findByIngestionModeAndIsActiveTrue(String ingestionMode);
}
