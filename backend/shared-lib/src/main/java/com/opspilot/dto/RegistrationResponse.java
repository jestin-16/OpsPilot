package com.opspilot.dto;

public class RegistrationResponse {
    private String email;
    private String message;
    private boolean verificationRequired;

    public RegistrationResponse() {
    }

    public RegistrationResponse(String email, String message, boolean verificationRequired) {
        this.email = email;
        this.message = message;
        this.verificationRequired = verificationRequired;
    }

    public String getEmail() {
        return email;
    }

    public String getMessage() {
        return message;
    }

    public boolean isVerificationRequired() {
        return verificationRequired;
    }
}
