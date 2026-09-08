package com.opspilot.controller;

import com.opspilot.dto.UpdateUserRoleRequest;
import com.opspilot.dto.UpdateUserRequest;
import com.opspilot.dto.UserResponse;
import com.opspilot.dto.CreateUserRequest;
import com.opspilot.dto.UserStatusRequest;
import com.opspilot.entity.User;
import com.opspilot.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/users", "/api/v1/users"})
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(201).body(userService.createUser(request, currentUser));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> setUserStatus(@PathVariable Long id, @RequestBody UserStatusRequest request, @AuthenticationPrincipal User currentUser) {
        if (request.getActive() == null) throw new IllegalArgumentException("Active status is required");
        return ResponseEntity.ok(userService.setUserActive(id, request.getActive(), currentUser));
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserRoles(
            @PathVariable Long id,
            @RequestBody UpdateUserRoleRequest request, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.updateUserRoles(id, request, currentUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.updateUser(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        userService.deleteUser(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
