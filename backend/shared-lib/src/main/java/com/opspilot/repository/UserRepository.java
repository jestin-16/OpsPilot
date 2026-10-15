package com.opspilot.repository;

import com.opspilot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Boolean existsByEmail(String email);

    // Active means anything but an explicit false, matching the authentication filter.
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) FROM User u WHERE u.isActive IS NULL OR u.isActive = true")
    long countActive();
}
