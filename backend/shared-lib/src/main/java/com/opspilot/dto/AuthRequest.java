package com.opspilot.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.opspilot.validation.ValidationRules;
import com.opspilot.validation.Utf8Size;

public class AuthRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must be 255 characters or fewer")
    @Pattern(regexp = ValidationRules.EMAIL, message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Utf8Size
    private String password;

    public AuthRequest() {
    }

    public AuthRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim();
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
