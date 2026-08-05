package com.opspilot.service;

import com.opspilot.config.JwtTokenProvider;
import com.opspilot.dto.AuthRequest;
import com.opspilot.dto.AuthResponse;
import com.opspilot.dto.RegisterRequest;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email address is already in use: " + request.getEmail());
        }

        String roleNameStr = request.getRole();
        Role role = roleRepository.findByRoleName(roleNameStr)
                .orElseGet(() -> {
                    // Try case-insensitive or default matching
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

        String token = tokenProvider.generateTokenFromEmail(savedUser.getEmail(), roleAuthorities);

        Set<String> roleNames = savedUser.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toSet());

        return new AuthResponse(token, savedUser.getId(), savedUser.getName(), savedUser.getEmail(), roleNames);
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new IllegalArgumentException("Account is deactivated");
        }

        List<String> roleAuthorities = user.getRoles().stream()
                .map(r -> "ROLE_" + r.getRoleName().toUpperCase().replace(" ", "_"))
                .collect(Collectors.toList());

        String token = tokenProvider.generateTokenFromEmail(user.getEmail(), roleAuthorities);

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toSet());

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), roleNames);
    }
}
