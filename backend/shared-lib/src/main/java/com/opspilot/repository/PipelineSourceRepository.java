package com.opspilot.repository;

import com.opspilot.entity.PipelineSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineSourceRepository extends JpaRepository<PipelineSource, Long> {
    List<PipelineSource> findAllByOrderByCreatedAtDesc();
}
