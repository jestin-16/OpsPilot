package com.opspilot.dto;

import java.util.Set;
import jakarta.validation.constraints.*;
import com.opspilot.validation.ValidationRules;

public class UpdateUserRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    @Pattern(regexp = ValidationRules.PERSON_NAME, message = "Name contains invalid characters")
    private String name;
    @NotBlank(message = "Email is required")
    @Size(max = 255)
    @Email
    @Pattern(regexp = ValidationRules.EMAIL, message = "Enter a valid email address")
    private String email;
    private Set<String> roles;

    public UpdateUserRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
