package com.opspilot.repository;

import com.opspilot.entity.RefreshToken;
import com.opspilot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    /**
     * Delete using a JPQL query with clearAutomatically=true so the DELETE is
     * flushed and committed to the DB before any subsequent INSERT within the
     * same transaction. This prevents duplicate-key violations on the user_id
     * unique constraint when rotating refresh tokens.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = :user")
    void deleteByUser(@Param("user") User user);
}
