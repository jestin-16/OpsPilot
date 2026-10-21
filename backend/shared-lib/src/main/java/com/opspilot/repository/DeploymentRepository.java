package com.opspilot.repository;

import com.opspilot.entity.Deployment;
import com.opspilot.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import com.opspilot.entity.User;
import java.util.Optional;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, Long> {
    List<Deployment> findByProjectIdOrderByDeployedAtDesc(Long projectId);
    List<Deployment> findByProjectOrderByDeployedAtDesc(Project project);
    List<Deployment> findAllByOrderByDeployedAtDesc();
    Optional<Deployment> findFirstByOrderByDeployedAtDesc();
    Optional<Deployment> findFirstByProject_OwnerOrderByDeployedAtDesc(User owner);
    void deleteByProjectId(Long projectId);

    // Scoped list for non-privileged users (ProjectScope.visibleProjectIds).
    List<Deployment> findByProject_IdInOrderByDeployedAtDesc(java.util.Collection<Long> projectIds);

    /** A provider-reported deployment (e.g. GitHub's deployment id), so its status updates hit the same row. */
    Optional<Deployment> findByProject_IdAndSourceAndExternalId(Long projectId, String source, String externalId);
}
