package com.opspilot.exception;

public class RoleRequiredException extends RuntimeException {
    public RoleRequiredException(String message) {
        super(message);
    }
}
