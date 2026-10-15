
package com.opspilot.repository;

import com.opspilot.entity.Deployment;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogRepository extends JpaRepository<LogEntity, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<LogEntity> {

    List<LogEntity> findAllByOrderByTimestampDesc();
    
    List<LogEntity> findByDeploymentOrderByTimestampAsc(Deployment deployment);
    
    java.util.Optional<LogEntity> findFirstBySourceServiceOrderByTimestampDesc(String sourceService);

    /** One project's logs (attached directly or through a deployment) in a time window, newest first. */
    @Query("SELECT l FROM LogEntity l LEFT JOIN l.deployment d WHERE " +
           "(l.project.id = :projectId OR d.project.id = :projectId) AND " +
           "l.timestamp BETWEEN :from AND :to AND " +
           "(:errorsOnly = false OR UPPER(l.logLevel) IN ('ERROR', 'WARN', 'WARNING')) " +
           "ORDER BY l.timestamp DESC")
    List<LogEntity> findProjectLogsBetween(
            @Param("projectId") Long projectId,
            @Param("from") java.time.LocalDateTime from,
            @Param("to") java.time.LocalDateTime to,
            @Param("errorsOnly") boolean errorsOnly,
            org.springframework.data.domain.Pageable page);

    @Query("SELECT l FROM LogEntity l LEFT JOIN l.deployment d LEFT JOIN d.project deploymentProject LEFT JOIN l.project directProject WHERE " +
           "(:projectId IS NULL OR deploymentProject.id = :projectId OR directProject.id = :projectId) AND " +
           "(:sourceService IS NULL OR l.sourceService = :sourceService) AND " +
           "(:logLevel IS NULL OR l.logLevel = :logLevel) AND " +
           "(:query IS NULL OR LOWER(l.message) LIKE :query) " +
           "ORDER BY l.timestamp DESC")
    List<LogEntity> searchLogs(
            @Param("projectId") Long projectId,
            @Param("sourceService") String sourceService,
            @Param("logLevel") String logLevel,
            @Param("query") String query,
            org.springframework.data.domain.Pageable page
    );

            @Query("SELECT l FROM LogEntity l LEFT JOIN l.deployment d LEFT JOIN d.project deploymentProject LEFT JOIN l.project directProject WHERE " +
                "(deploymentProject.owner.id = :ownerId OR directProject.owner.id = :ownerId) AND " +
                "(:projectId IS NULL OR deploymentProject.id = :projectId OR directProject.id = :projectId) AND " +
           "(:sourceService IS NULL OR l.sourceService = :sourceService) AND " +
           "(:logLevel IS NULL OR l.logLevel = :logLevel) AND " +
           "(:query IS NULL OR LOWER(l.message) LIKE :query) " +
           "ORDER BY l.timestamp DESC")
    List<LogEntity> searchLogsForOwner(
            @Param("ownerId") Long ownerId,
            @Param("projectId") Long projectId,
            @Param("sourceService") String sourceService,
            @Param("logLevel") String logLevel,
            @Param("query") String query,
            org.springframework.data.domain.Pageable page
    );
    
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM LogEntity l WHERE l.deployment.id IN (SELECT d.id FROM Deployment d WHERE d.project.id = :projectId) OR l.project.id = :projectId")
    void deleteLogsByProjectId(@Param("projectId") Long projectId);
}
