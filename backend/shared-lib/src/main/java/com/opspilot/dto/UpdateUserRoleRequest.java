package com.opspilot.dto;

import java.util.Set;

public class UpdateUserRoleRequest {
    private Set<String> roles;

    public UpdateUserRoleRequest() {}

    public UpdateUserRoleRequest(Set<String> roles) {
        this.roles = roles;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }
}
