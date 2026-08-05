package com.opspilot.config;

import com.opspilot.entity.Role;
import com.opspilot.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        List<Role> initialRoles = List.of(
            new Role("Developer", "Software Developer role with standard access to projects and deployments"),
            new Role("DevOps Engineer", "DevOps Engineer role with deployment management capabilities"),
            new Role("Administrator", "Administrator role with full system access and management privileges")
        );

        for (Role role : initialRoles) {
            if (roleRepository.findByRoleName(role.getRoleName()).isEmpty()) {
                roleRepository.save(role);
            }
        }
    }
}
