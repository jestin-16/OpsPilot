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

    @Query("SELECT l FROM LogEntity l WHERE " +
           "(:sourceService IS NULL OR l.sourceService = :sourceService) AND " +
           "(:logLevel IS NULL OR l.logLevel = :logLevel) AND " +
           "(:query IS NULL OR LOWER(l.message) LIKE :query) " +
           "ORDER BY l.timestamp DESC")
    List<LogEntity> searchLogs(
            @Param("sourceService") String sourceService,
            @Param("logLevel") String logLevel,
            @Param("query") String query
    );
}
