package com.opspilot.controller;

import com.opspilot.entity.NotificationEntity;
import com.opspilot.entity.User;
import com.opspilot.repository.UserRepository;
import com.opspilot.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/notifications", "/api/notifications"})
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication.getPrincipal() instanceof User user) {
            return user;
        }
        String name = authentication.getName();
        if (name != null) {
            return userRepository.findByEmail(name).orElse(null);
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<NotificationEntity>> getNotifications(Authentication authentication) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationEntity> markAsRead(@PathVariable Long id, Authentication authentication) {
        User currentUser = resolveUser(authentication);
        return ResponseEntity.ok(notificationService.markAsRead(id, currentUser));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        User currentUser = resolveUser(authentication);
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok().build();
    }
}
