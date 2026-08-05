package com.opspilot.repository;

import com.opspilot.entity.PodEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PodRepository extends JpaRepository<PodEntity, Long> {
    List<PodEntity> findByContainerContainerId(Long containerId);
}
