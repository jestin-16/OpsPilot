package com.opspilot.notification;

import com.opspilot.entity.NotificationPolicy;

public interface NotificationChannel {
    ChannelType getChannelType();
    boolean deliver(String message, NotificationPolicy policy, Object context) throws Exception;
}
