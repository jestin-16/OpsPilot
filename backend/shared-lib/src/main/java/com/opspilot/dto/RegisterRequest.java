package com.opspilot.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import com.opspilot.validation.ValidationRules;
import com.opspilot.validation.Utf8Size;

public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must be 255 characters or fewer")
    @Pattern(regexp = ValidationRules.PERSON_NAME, message = "Use letters, spaces, apostrophes, periods or hyphens for your name")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must be 255 characters or fewer")
    @Pattern(regexp = ValidationRules.EMAIL, message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Utf8Size
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$", message = "Password must contain at least one uppercase letter, one lowercase letter, and one digit")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "Developer|DevOps", message = "Choose Developer or DevOps")
    private String role; // Developer, DevOps Engineer, Administrator

    public RegisterRequest() {
    }

    public RegisterRequest(String name, String email, String password, String role) {
        this.name = name == null ? null : name.trim();
        this.email = email == null ? null : email.trim();
        this.password = password;
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
