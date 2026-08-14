package com.opspilot.service;

import com.opspilot.config.JwtTokenProvider;
import com.opspilot.dto.AuthRequest;
import com.opspilot.dto.AuthResponse;
import com.opspilot.dto.RegisterRequest;
import com.opspilot.entity.RefreshToken;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.exception.UnauthorizedException;
import com.opspilot.repository.RefreshTokenRepository;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
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

        List<String> roleAuthorities = savedUser.getRoles().stream()
                .map(r -> "ROLE_" + r.getRoleName().toUpperCase().replace(" ", "_"))
                .collect(Collectors.toList());

        String accessToken = tokenProvider.generateTokenFromEmail(savedUser.getEmail(), roleAuthorities);

        Set<String> roleNames = savedUser.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toSet());

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.opspilot.event.AuditEvent(
                    this, savedUser, "USER_REGISTER", "USER", savedUser.getId().toString(), "User registered successfully: " + savedUser.getEmail()
            ));
        }

        return new AuthResponse(accessToken, savedUser.getId(), savedUser.getName(), savedUser.getEmail(), roleNames);
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            meterRegistry.counter("auth.login.failure").increment();
            throw new IllegalArgumentException("Invalid email or password");
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
}
