package com.opspilot.dto;

import java.time.LocalDateTime;
import java.util.Set;

public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Set<String> roles;

    public UserResponse() {}

    public UserResponse(Long id, String name, String email, Boolean isActive, LocalDateTime createdAt, Set<String> roles) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.roles = roles;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
