package com.opspilot.repository;

import com.opspilot.entity.LogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogRepository extends JpaRepository<LogEntity, Long> {

    List<LogEntity> findAllByOrderByTimestampDesc();
    
    java.util.Optional<LogEntity> findFirstBySourceServiceOrderByTimestampDesc(String sourceService);

    @Query("SELECT l FROM LogEntity l LEFT JOIN l.deployment d LEFT JOIN d.project p WHERE " +
           "(:projectId IS NULL OR p.id = :projectId) AND " +
           "(:sourceService IS NULL OR l.sourceService = :sourceService) AND " +
           "(:logLevel IS NULL OR l.logLevel = :logLevel) AND " +
           "(:query IS NULL OR LOWER(l.message) LIKE :query) " +
           "ORDER BY l.timestamp DESC")
    List<LogEntity> searchLogs(
            @Param("projectId") Long projectId,
            @Param("sourceService") String sourceService,
            @Param("logLevel") String logLevel,
            @Param("query") String query
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
            @Param("query") String query
    );
    
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM LogEntity l WHERE l.deployment.project.id = :projectId OR l.project.id = :projectId")
    void deleteLogsByProjectId(@Param("projectId") Long projectId);
}
