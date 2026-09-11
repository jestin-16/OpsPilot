package com.opspilot.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_verification_otps")
public class EmailVerificationOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public EmailVerificationOtp() {
    }

    public EmailVerificationOtp(User user, String otpHash, LocalDateTime expiresAt) {
        this.user = user;
        this.otpHash = otpHash;
        this.expiresAt = expiresAt;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public int getAttempts() {
        return attempts;
    }

    public void incrementAttempts() {
        attempts++;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(boolean used) {
        this.used = used;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
