package com.opspilot.repository;

import com.opspilot.entity.EmailVerificationOtp;
import com.opspilot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, Long> {
    Optional<EmailVerificationOtp> findTopByUserOrderByCreatedAtDesc(User user);
    @Transactional
    void deleteByUser(User user);
}
