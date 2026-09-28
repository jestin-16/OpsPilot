package com.opspilot.messaging;

public interface EventPublisher {
    void publish(EventEnvelope event);
}
