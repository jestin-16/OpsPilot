package com.opspilot.service;

import com.opspilot.dto.UpdateUserRoleRequest;
import com.opspilot.dto.UpdateUserRequest;
import com.opspilot.dto.CreateUserRequest;
import com.opspilot.dto.UserResponse;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.opspilot.event.AuditEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Transactional
    public UserResponse createUser(CreateUserRequest request, User actor) {
        if (request.getName() == null || request.getName().isBlank() || request.getEmail() == null || request.getEmail().isBlank() || request.getPassword() == null || request.getPassword().length() < 8) {
            throw new IllegalArgumentException("Name, email, and a password of at least 8 characters are required");
        }
        if (userRepository.findByEmail(request.getEmail().trim()).isPresent()) throw new IllegalArgumentException("A user with this email already exists");
        Set<String> requestedRoles = request.getRoles() == null || request.getRoles().isEmpty() ? Set.of("DEVELOPER") : request.getRoles();
        Set<Role> roles = requestedRoles.stream().map(role -> roleRepository.findByRoleName(normalizeRoleName(role)).orElseThrow(() -> new ResourceNotFoundException("Role not found: " + role))).collect(Collectors.toSet());
        User user = new User(request.getName().trim(), request.getEmail().trim(), passwordEncoder.encode(request.getPassword()), roles);
        User saved = userRepository.save(user);
        eventPublisher.publishEvent(new AuditEvent(this, actor, "USER_CREATE", "USER", saved.getId().toString(), "Created user: " + saved.getEmail()));
        return mapToResponse(saved);
    }

    @Transactional
    public UserResponse setUserActive(Long id, boolean active, User actor) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        if (user.getId().equals(actor.getId()) && !active) throw new IllegalArgumentException("Administrators cannot disable their own account");
        user.setIsActive(active);
        User saved = userRepository.save(user);
        eventPublisher.publishEvent(new AuditEvent(this, actor, active ? "USER_ENABLE" : "USER_DISABLE", "USER", id.toString(), (active ? "Enabled " : "Disabled ") + saved.getEmail()));
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateUserRoles(Long id, UpdateUserRoleRequest request, User actor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        Set<Role> roles = request.getRoles().stream()
            .map(roleName -> roleRepository.findByRoleName(normalizeRoleName(roleName))
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName)))
                .collect(Collectors.toSet());

        user.setRoles(roles);
        User updatedUser = userRepository.save(user);
        eventPublisher.publishEvent(new AuditEvent(this, actor, "USER_ROLE_UPDATE", "USER", id.toString(), "Updated roles for " + updatedUser.getEmail()));
        return mapToResponse(updatedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, User actor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getName() == null || request.getName().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Name and email are required");
        }

        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim());
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> roles = request.getRoles().stream()
                    .map(roleName -> roleRepository.findByRoleName(normalizeRoleName(roleName))
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);
        eventPublisher.publishEvent(new AuditEvent(this, actor, "USER_UPDATE", "USER", id.toString(), "Updated user: " + updatedUser.getEmail()));
        return mapToResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id, User actor) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        if (user.getId().equals(actor.getId())) throw new IllegalArgumentException("Administrators cannot delete their own account");
        eventPublisher.publishEvent(new AuditEvent(this, actor, "USER_DELETE", "USER", id.toString(), "Deleted user: " + user.getEmail()));
        userRepository.delete(user);
    }

    private UserResponse mapToResponse(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toSet());

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getIsActive(),
                user.getCreatedAt(),
                roles
        );
    }

    private String normalizeRoleName(String roleName) {
        String normalized = roleName.trim().toUpperCase().replace(" ", "_");
        if (normalized.equals("ADMIN") || normalized.equals("ROLE_ADMIN") || normalized.equals("ADMINISTRATOR") || normalized.equals("ROLE_ADMINISTRATOR")) {
            return roleRepository.findByRoleName("ADMIN").isPresent() ? "ADMIN" : "Administrator";
        }
        if (normalized.equals("DEVOPS") || normalized.equals("ROLE_DEVOPS") || normalized.equals("DEVOPS_ENGINEER")) {
            return roleRepository.findByRoleName("DEVOPS").isPresent() ? "DEVOPS" : "DevOps Engineer";
        }
        if (normalized.equals("DEVELOPER") || normalized.equals("ROLE_DEVELOPER")) {
            return "DEVELOPER";
        }
        return roleName.trim();
    }
}
