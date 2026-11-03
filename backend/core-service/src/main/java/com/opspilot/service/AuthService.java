package com.opspilot.service;

import com.opspilot.config.JwtTokenProvider;
import com.opspilot.dto.AuthRequest;
import com.opspilot.dto.AuthResponse;
import com.opspilot.dto.RegisterRequest;
import com.opspilot.dto.RegistrationResponse;
import com.opspilot.entity.RefreshToken;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.exception.UnauthorizedException;
import com.opspilot.repository.RefreshTokenRepository;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import com.opspilot.dto.GoogleLoginRequest;
import com.opspilot.exception.RoleRequiredException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
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

    @org.springframework.beans.factory.annotation.Value("${app.google.client-id:}")
    private String googleClientId;

    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalArgumentException("Google login is not configured on this server");
        }
        
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
                
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(request.getIdToken());
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid Google ID token");
        }
        
        if (idToken == null) {
            throw new UnauthorizedException("Invalid Google ID token");
        }
        
        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            if (request.getRole() == null || request.getRole().isBlank()) {
                throw new RoleRequiredException("Role is required for first-time Google login");
            }
            
            Role role = resolveSelfServiceRole(request.getRole());

            Set<Role> roles = new HashSet<>();
            roles.add(role);

            user = new User(
                    name != null ? name : "Google User",
                    email,
                    passwordEncoder.encode(UUID.randomUUID().toString()),
                    roles
            );
            user.setEmailVerified(true);
            user.setIsActive(true);
            user = userRepository.save(user);
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
                    this, user, "USER_LOGIN_GOOGLE", "USER", user.getId().toString(), "User authenticated via Google: " + user.getEmail()
            ));
        }

        meterRegistry.counter("auth.login.google.success").increment();

        return new AuthResponse(accessToken, user.getId(), user.getName(), user.getEmail(), roleNames);
    }

    /**
     * Maps the role a user picked at sign-up to one of the seeded roles. Only DEVELOPER and DEVOPS can be
     * self-selected; ADMIN is granted by an existing administrator (PUT /api/users/{id}/roles), and unknown
     * names are rejected rather than created.
     */
    Role resolveSelfServiceRole(String requested) {
        String normalized = requested == null ? "" : requested.trim().toUpperCase().replaceAll("[\\s_-]+", "");
        String roleName = switch (normalized) {
            case "DEVELOPER" -> "DEVELOPER";
            case "DEVOPS", "DEVOPSENGINEER" -> "DEVOPS";
            case "ADMIN", "ADMINISTRATOR" -> throw new IllegalArgumentException(
                    "Administrator access can't be chosen at sign-up; ask an existing administrator to grant it");
            default -> throw new IllegalArgumentException("Role must be Developer or DevOps");
        };
        return roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new IllegalStateException("Role " + roleName + " is not seeded"));
    }

    @Transactional
    public RegistrationResponse register(RegisterRequest request) {
        String email = request.getEmail().trim();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("Email address is already in use: " + request.getEmail());
        }

        Role role = resolveSelfServiceRole(request.getRole());

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User user = new User(
                request.getName(),
                email,
                passwordEncoder.encode(request.getPassword()),
                roles
        );

        user.setIsActive(true);
        user.setEmailVerified(true);
        User savedUser = userRepository.save(user);

        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.opspilot.event.AuditEvent(
                    this, savedUser, "USER_REGISTER", "USER", savedUser.getId().toString(), "User registered successfully: " + savedUser.getEmail()
            ));
        }

        return new RegistrationResponse(savedUser.getEmail(), "Account created. Sign in to continue.", false);
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

        String tokenStr = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plusMillis(tokenProvider.getJwtRefreshExpirationMs());

        RefreshToken refreshToken = refreshTokenRepository.findByUser(user).orElse(new RefreshToken());
        refreshToken.setToken(tokenStr);
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(expiryDate);
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

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Account is deactivated");
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

}
