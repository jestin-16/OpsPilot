package com.opspilot.notification;

import com.opspilot.entity.NotificationPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationChannel implements NotificationChannel {

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailNotificationChannel(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${app.mail.from:alerts@opspilot.com}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    @Override
    public ChannelType getChannelType() {
        return ChannelType.EMAIL;
    }

    @Override
    public boolean deliver(String message, NotificationPolicy policy, Object context) throws Exception {
        if (mailSender == null) {
            // "using the existing email infrastructure if available."
            // If not available in this context, just pretend it's sent or log
            throw new IllegalStateException("JavaMailSender is not available");
        }

        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(fromAddress);
        // Assuming admin emails or project owner emails. Fallback to a default for this implementation.
        mailMessage.setTo("admin@opspilot.local"); 
        mailMessage.setSubject("OpsPilot Alert Notification");
        mailMessage.setText(message);

        mailSender.send(mailMessage);
        return true;
    }
}
