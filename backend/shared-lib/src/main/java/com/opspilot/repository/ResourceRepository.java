package com.opspilot.repository;

import com.opspilot.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByProjectId(Long projectId);
    List<Resource> findByIntegrationId(Long integrationId);
}
