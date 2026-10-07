package com.opspilot.repository;

import com.opspilot.entity.DockerLogSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DockerLogSourceRepository extends JpaRepository<DockerLogSource, UUID> {
    Optional<DockerLogSource> findByTokenHash(String tokenHash);

    List<DockerLogSource> findAllByOrderByCreatedAtDesc();

    List<DockerLogSource> findByProjectIdInOrderByCreatedAtDesc(Collection<Long> projectIds);

    @Transactional
    @Modifying
    @Query("update DockerLogSource s set s.lastSeenAt = :seenAt, s.status = 'ACTIVE' where s.id = :id")
    int markSeen(@Param("id") UUID id, @Param("seenAt") LocalDateTime seenAt);

    @Transactional
    @Modifying
    @Query("update DockerLogSource s set s.status = 'STALE' where s.status = 'ACTIVE' and s.lastSeenAt < :cutoff")
    int markStale(@Param("cutoff") LocalDateTime cutoff);
}
