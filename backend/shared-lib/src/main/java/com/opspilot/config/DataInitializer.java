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
        Role devRole = roleRepository.findByRoleName("DEVELOPER")
                .orElseGet(() -> roleRepository.save(new Role("DEVELOPER", "Software Developer role with standard access")));

        Role devOpsRole = roleRepository.findByRoleName("DEVOPS")
                .orElseGet(() -> roleRepository.save(new Role("DEVOPS", "DevOps role with deployment management capabilities")));

        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ADMIN", "Admin role with full system access")));

        // Seed User Accounts if not present
        if (userRepository.findByEmail("jestinshaji777@gmail.com").isEmpty()) {
            User jestinUser = new User("Jestin Shaji", "jestinshaji777@gmail.com", passwordEncoder.encode("Nitsej@2"), Set.of(adminRole));
            userRepository.save(jestinUser);
        }

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
