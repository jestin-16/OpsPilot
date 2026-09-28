package com.opspilot.notification;

import com.opspilot.entity.NotificationPolicy;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class WebhookNotificationChannel implements NotificationChannel {

    private final RestTemplate restTemplate;

    public WebhookNotificationChannel() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.WEBHOOK;
    }

    @Override
    public boolean deliver(String message, NotificationPolicy policy, Object context) throws Exception {
        // Typically, webhook URL would be configured in the policy or project settings.
        // We'll simulate a delivery failure if not configured.
        throw new UnsupportedOperationException("Webhook URL is not configured for this policy");
    }
}
