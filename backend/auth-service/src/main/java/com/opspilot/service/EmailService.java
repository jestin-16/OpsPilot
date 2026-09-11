package com.opspilot.service;

import com.opspilot.exception.EmailDeliveryException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final long expirationMinutes;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from:}") String fromAddress,
                        @Value("${app.otp.expiration-minutes:5}") long expirationMinutes) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.expirationMinutes = expirationMinutes;
    }

    public void sendVerificationCode(String recipient, String name, String otp) {
        if (fromAddress == null || fromAddress.isBlank()) {
            throw new EmailDeliveryException("Email delivery is not configured. Please contact an administrator.", null);
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(recipient);
        message.setSubject("OpsPilot Email Verification Code");
        message.setText("Hello " + name + ",\n\n"
                + "Your OpsPilot verification code is:\n\n"
                + otp + "\n\n"
                + "This code will expire in " + expirationMinutes + " minutes.\n\n"
                + "For your security, do not share this code with anyone.\n\n"
                + "If you did not create an OpsPilot account, you can ignore this email.\n\n"
                + "Regards,\nOpsPilot Team");

        try {
            mailSender.send(message);
        } catch (RuntimeException exception) {
            throw new EmailDeliveryException("We could not send the verification email. Please try again.", exception);
        }
    }
}
