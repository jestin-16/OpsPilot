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

    @GetMapping
    public ResponseEntity<List<NotificationEntity>> getNotifications(Authentication authentication) {
        User currentUser = null;
        if (authentication != null && authentication.getName() != null) {
            currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        }
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationEntity> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }
}
