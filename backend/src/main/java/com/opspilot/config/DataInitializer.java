package com.opspilot.config;

import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Initial Roles
        Role devRole = roleRepository.findByRoleName("Developer")
                .orElseGet(() -> roleRepository.save(new Role("Developer", "Software Developer role with standard access")));

        Role devOpsRole = roleRepository.findByRoleName("DevOps Engineer")
                .orElseGet(() -> roleRepository.save(new Role("DevOps Engineer", "DevOps Engineer role with deployment management capabilities")));

        Role adminRole = roleRepository.findByRoleName("Administrator")
                .orElseGet(() -> roleRepository.save(new Role("Administrator", "Administrator role with full system access")));

        // Seed Default Demo Accounts if not present
        if (userRepository.findByEmail("admin@opspilot.io").isEmpty()) {
            User admin = new User("System Administrator", "admin@opspilot.io", passwordEncoder.encode("Password123!"), Set.of(adminRole));
            userRepository.save(admin);
        }

        if (userRepository.findByEmail("developer@opspilot.io").isEmpty()) {
            User dev = new User("Lead Developer", "developer@opspilot.io", passwordEncoder.encode("Password123!"), Set.of(devRole));
            userRepository.save(dev);
        }

        if (userRepository.findByEmail("devops@opspilot.io").isEmpty()) {
            User devops = new User("DevOps Lead", "devops@opspilot.io", passwordEncoder.encode("Password123!"), Set.of(devOpsRole));
            userRepository.save(devops);
        }
    }
}
