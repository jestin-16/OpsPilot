package com.opspilot.dto;

import java.util.Set;
import jakarta.validation.constraints.*;
import com.opspilot.validation.ValidationRules;
import com.opspilot.validation.Utf8Size;

public class CreateUserRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    @Pattern(regexp = ValidationRules.PERSON_NAME, message = "Name contains invalid characters")
    private String name;
    @NotBlank(message = "Email is required")
    @Size(max = 255)
    @Email
    @Pattern(regexp = ValidationRules.EMAIL, message = "Enter a valid email address")
    private String email;
    @NotBlank(message = "Password is required")
    @Size(min = 8)
    @Utf8Size
    @Pattern(regexp = ValidationRules.PASSWORD, message = "Password must contain uppercase and lowercase letters and a digit")
    private String password;
    @NotEmpty(message = "Select a platform role")
    private Set<String> roles;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
