package com.opspilot.messaging;

public interface EventSubscriber {
    void onEvent(EventEnvelope event);
}
