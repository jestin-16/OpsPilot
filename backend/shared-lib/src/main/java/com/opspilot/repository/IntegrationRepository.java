package com.opspilot.repository;

import com.opspilot.entity.Integration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IntegrationRepository extends JpaRepository<Integration, Long> {
    List<Integration> findByProjectId(Long projectId);
}
