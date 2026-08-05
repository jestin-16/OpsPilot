package com.opspilot.repository;

import com.opspilot.entity.PipelineRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineRunRepository extends JpaRepository<PipelineRunEntity, Long> {
    List<PipelineRunEntity> findAllByOrderByCreatedAtDesc();
}
