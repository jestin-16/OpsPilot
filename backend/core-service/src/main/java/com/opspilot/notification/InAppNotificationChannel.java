package com.opspilot.notification;

import com.opspilot.entity.NotificationEntity;
import com.opspilot.entity.NotificationPolicy;
import com.opspilot.repository.NotificationRepository;
import org.springframework.stereotype.Component;

@Component
public class InAppNotificationChannel implements NotificationChannel {

    private final NotificationRepository notificationRepository;

    public InAppNotificationChannel(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.IN_APP;
    }

    @Override
    public boolean deliver(String message, NotificationPolicy policy, Object context) throws Exception {
        NotificationEntity notification = new NotificationEntity();
        // Global system alert since it's for an incident/alert
        notification.setMessage(message);
        notification.setType("SYSTEM_ALERT");
        notification.setRead(false);
        notificationRepository.save(notification);
        return true;
    }
}
