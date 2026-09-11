package com.opspilot.service;

import com.opspilot.config.JwtTokenProvider;
import com.opspilot.dto.AuthRequest;
import com.opspilot.dto.AuthResponse;
import com.opspilot.dto.RegisterRequest;
import com.opspilot.dto.RegistrationResponse;
import com.opspilot.dto.ResendOtpRequest;
import com.opspilot.dto.VerifyOtpRequest;
import com.opspilot.entity.EmailVerificationOtp;
import com.opspilot.entity.RefreshToken;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.exception.UnauthorizedException;
import com.opspilot.repository.RefreshTokenRepository;
import com.opspilot.repository.EmailVerificationOtpRepository;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import com.opspilot.exception.EmailDeliveryException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.security.SecureRandom;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Autowired
    private io.micrometer.core.instrument.MeterRegistry meterRegistry;

    @Autowired
    private EmailVerificationOtpRepository emailVerificationOtpRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder otpHashEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.otp.expiration-minutes:5}")
    private long otpExpirationMinutes;

    @org.springframework.beans.factory.annotation.Value("${app.otp.max-attempts:5}")
    private int otpMaxAttempts;

    @org.springframework.beans.factory.annotation.Value("${app.otp.resend-cooldown-seconds:60}")
    private long otpResendCooldownSeconds;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public RegistrationResponse register(RegisterRequest request) {
        String email = request.getEmail().trim();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("Email address is already in use: " + request.getEmail());
        }

        String roleNameStr = request.getRole();
        Role role = roleRepository.findByRoleName(roleNameStr)
                .orElseGet(() -> {
                    return roleRepository.findAll().stream()
                            .filter(r -> r.getRoleName().equalsIgnoreCase(roleNameStr))
                            .findFirst()
                            .orElseGet(() -> roleRepository.save(new Role(roleNameStr, roleNameStr + " role")));
                });

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                roles
        );

        User savedUser = userRepository.save(user);
        savedUser.setIsActive(false);
        savedUser.setEmailVerified(false);
        savedUser = userRepository.save(savedUser);

        issueAndSendOtp(savedUser);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.opspilot.event.AuditEvent(
                    this, savedUser, "USER_REGISTER", "USER", savedUser.getId().toString(), "User registered successfully: " + savedUser.getEmail()
            ));
        }

        return new RegistrationResponse(savedUser.getEmail(), "Verification code sent. Check your email.", true);
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            meterRegistry.counter("auth.login.failure").increment();
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Please verify your email before logging in.");
        }

        if (!user.getIsActive()) {
            throw new IllegalArgumentException("Account is deactivated");
        }

        List<String> roleAuthorities = user.getRoles().stream()
                .map(r -> "ROLE_" + r.getRoleName().toUpperCase().replace(" ", "_"))
                .collect(Collectors.toList());

        String accessToken = tokenProvider.generateTokenFromEmail(user.getEmail(), roleAuthorities);

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toSet());

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.opspilot.event.AuditEvent(
                    this, user, "USER_LOGIN", "USER", user.getId().toString(), "User authenticated successfully: " + user.getEmail()
            ));
        }

        meterRegistry.counter("auth.login.success").increment();

        return new AuthResponse(accessToken, user.getId(), user.getName(), user.getEmail(), roleNames);
    }

    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        refreshTokenRepository.deleteByUser(user);

        String tokenStr = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plusMillis(tokenProvider.getJwtRefreshExpirationMs());

        RefreshToken refreshToken = new RefreshToken(tokenStr, user, expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken verifyRefreshToken(String tokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new UnauthorizedException("Refresh token is not present in database"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token has expired. Please sign in again");
        }

        return refreshToken;
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenStr) {
        RefreshToken refreshToken = verifyRefreshToken(refreshTokenStr);
        User user = refreshToken.getUser();

        if (!Boolean.TRUE.equals(user.getEmailVerified()) || !Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Please verify your email before logging in.");
        }

        List<String> roleAuthorities = user.getRoles().stream()
                .map(r -> "ROLE_" + r.getRoleName().toUpperCase().replace(" ", "_"))
                .collect(Collectors.toList());

        String newAccessToken = tokenProvider.generateTokenFromEmail(user.getEmail(), roleAuthorities);

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toSet());

        return new AuthResponse(newAccessToken, user.getId(), user.getName(), user.getEmail(), roleNames);
    }

    @Transactional
    public void deleteRefreshToken(String refreshTokenStr) {
        refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(refreshTokenRepository::delete);
    }

    @Transactional
    public String verifyOtp(VerifyOtpRequest request) {
        User user = findPendingUser(request.getEmail());
        EmailVerificationOtp otp = emailVerificationOtpRepository.findTopByUserOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new IllegalArgumentException("Verification code is invalid or expired."));

        if (otp.isUsed()) {
            throw new IllegalArgumentException("Verification code is invalid or expired.");
        }
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otp.setUsed(true);
            emailVerificationOtpRepository.save(otp);
            throw new IllegalArgumentException("Verification code has expired. Request a new code.");
        }
        if (otp.getAttempts() >= otpMaxAttempts) {
            otp.setUsed(true);
            emailVerificationOtpRepository.save(otp);
            throw new IllegalArgumentException("Maximum verification attempts exceeded. Request a new code.");
        }
        if (!otpHashEncoder.matches(request.getOtp(), otp.getOtpHash())) {
            otp.incrementAttempts();
            if (otp.getAttempts() >= otpMaxAttempts) {
                otp.setUsed(true);
            }
            emailVerificationOtpRepository.save(otp);
            throw new IllegalArgumentException(otp.isUsed()
                    ? "Maximum verification attempts exceeded. Request a new code."
                    : "Invalid verification code.");
        }

        otp.setUsed(true);
        emailVerificationOtpRepository.save(otp);
        user.setEmailVerified(true);
        user.setIsActive(true);
        userRepository.save(user);
        return "Email verified successfully.";
    }

    @Transactional
    public String resendOtp(ResendOtpRequest request) {
        User user = findPendingUser(request.getEmail());
        EmailVerificationOtp current = emailVerificationOtpRepository.findTopByUserOrderByCreatedAtDesc(user).orElse(null);
        if (current != null && current.getCreatedAt().plusSeconds(otpResendCooldownSeconds).isAfter(LocalDateTime.now())) {
            long remaining = java.time.Duration.between(LocalDateTime.now(), current.getCreatedAt().plusSeconds(otpResendCooldownSeconds)).getSeconds();
            throw new IllegalArgumentException("Please wait " + Math.max(1, remaining) + " seconds before requesting another code.");
        }

        issueAndSendOtp(user);
        return "A new verification code was sent.";
    }

    private User findPendingUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("Verification request could not be completed."));
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Verification request could not be completed.");
        }
        return user;
    }

    private void issueAndSendOtp(User user) {
        emailVerificationOtpRepository.deleteByUser(user);
        String otpValue = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        EmailVerificationOtp otp = emailVerificationOtpRepository.save(new EmailVerificationOtp(
                user,
                otpHashEncoder.encode(otpValue),
                LocalDateTime.now().plusMinutes(otpExpirationMinutes)
        ));
        try {
            emailService.sendVerificationCode(user.getEmail(), user.getName(), otpValue);
        } catch (EmailDeliveryException exception) {
            emailVerificationOtpRepository.delete(otp);
            throw exception;
        }
    }
}
