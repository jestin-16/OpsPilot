package com.opspilot.config;

import com.opspilot.converter.SecretEncryptionConverter;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

/** Refuses to start without OPSPILOT_ENCRYPTION_KEY, instead of failing on the first stored secret. */
@Component
public class EncryptionKeyCheck {

    @PostConstruct
    void requireKey() {
        SecretEncryptionConverter.configuredKey();
    }
}
