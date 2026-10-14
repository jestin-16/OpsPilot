package com.opspilot.config;

import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    static final String DEMO_PASSWORD = "Password123!";

    @Value("${app.seed.demo-users:false}")
    private boolean demoUsersEnabled;

    @Override
    public void run(String... args) throws Exception {
        // Seed Initial Roles
        Role devRole = roleRepository.findByRoleName("DEVELOPER")
                .orElseGet(() -> roleRepository.save(new Role("DEVELOPER", "Software Developer role with standard access")));

        Role devOpsRole = roleRepository.findByRoleName("DEVOPS")
                .orElseGet(() -> roleRepository.save(new Role("DEVOPS", "DevOps role with deployment management capabilities")));

        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("ADMIN", "Admin role with full system access")));

        if (!demoUsersEnabled) {
            return;
        }

        // Demo accounts behind the login page's demo buttons. Their passwords are public, so they are only
        // created when DEMO_USERS_ENABLED=true (local development); never enable this on a shared deployment.
        seedUser("System Administrator", "admin@opspilot.io", adminRole);
        seedUser("Lead Developer", "developer@opspilot.io", devRole);
        seedUser("DevOps Lead", "devops@opspilot.io", devOpsRole);
        seedUser("Audit Other", "opspilot-audit-other@example.com", devRole);
    }

    private void seedUser(String name, String email, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            userRepository.save(new User(name, email, passwordEncoder.encode(DEMO_PASSWORD), Set.of(role)));
        }
    }
}
