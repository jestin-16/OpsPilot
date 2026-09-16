package com.opspilot.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {
    @NotBlank(message = "ID Token is required")
    private String idToken;

    // Optional role for first-time registration
    private String role;

    public GoogleLoginRequest() {}

    public GoogleLoginRequest(String idToken, String role) {
        this.idToken = idToken;
        this.role = role;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
