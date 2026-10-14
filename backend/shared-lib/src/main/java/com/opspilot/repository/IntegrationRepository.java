package com.opspilot.repository;

import com.opspilot.entity.Integration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IntegrationRepository extends JpaRepository<Integration, Long> {
    List<Integration> findByProjectId(Long projectId);

    java.util.Optional<Integration> findByIdAndProjectId(Long id, Long projectId);

    java.util.Optional<Integration> findByIngestTokenHash(String ingestTokenHash);

    List<Integration> findByStatus(com.opspilot.enums.IntegrationStatus status);
}
