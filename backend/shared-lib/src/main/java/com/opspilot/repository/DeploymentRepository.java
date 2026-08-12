package com.opspilot.repository;

import com.opspilot.entity.Deployment;
import com.opspilot.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, Long> {
    List<Deployment> findByProjectIdOrderByDeployedAtDesc(Long projectId);
    List<Deployment> findByProjectOrderByDeployedAtDesc(Project project);
}
