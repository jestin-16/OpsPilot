package com.opspilot.service;

import com.opspilot.entity.Deployment;
import com.opspilot.entity.NotificationEntity;
import com.opspilot.entity.User;
import com.opspilot.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<NotificationEntity> getUserNotifications(User user) {
        if (user == null) {
            return notificationRepository.findAllByOrderByCreatedAtDesc();
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public NotificationEntity markAsRead(Long notificationId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public NotificationEntity createNotification(User user, Deployment deployment, String message, String type) {
        NotificationEntity notification = new NotificationEntity(user, deployment, message, type);
        return notificationRepository.save(notification);
    }
}
