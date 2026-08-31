package com.opspilot.repository;

import com.opspilot.entity.CommitLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommitLogRepository extends JpaRepository<CommitLogEntity, Long> {
    List<CommitLogEntity> findByProject_IdOrderByTimestampDesc(Long projectId);
    boolean existsByCommitSha(String commitSha);
}
