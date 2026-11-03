package com.opspilot.service;

import com.opspilot.config.JwtTokenProvider;
import com.opspilot.dto.AuthRequest;
import com.opspilot.dto.RegisterRequest;
import com.opspilot.dto.RegistrationResponse;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.repository.EmailVerificationOtpRepository;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DataJpaTest(showSql = false, properties = {
        "spring.datasource.url=jdbc:h2:mem:registration;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.hbm2ddl.halt_on_error=true"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(AuthService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class RegistrationTest {
    @Autowired private AuthService authService;
    @Autowired private UserRepository users;
    @Autowired private RoleRepository roles;
    @Autowired private EmailVerificationOtpRepository otps;
    @Autowired private DataSource dataSource;
    @MockBean private PasswordEncoder encoder;
    @MockBean private JwtTokenProvider tokenProvider;
    @MockBean private MeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        roles.findByRoleName("DEVELOPER").orElseGet(() -> roles.save(new Role("DEVELOPER", "Developer")));
        when(encoder.encode(anyString())).thenReturn("hashed-value");
        when(encoder.matches(eq("Password123!"), eq("hashed-value"))).thenReturn(true);
        when(tokenProvider.generateTokenFromEmail(anyString(), anyList())).thenReturn("access-token");
        when(meterRegistry.counter(anyString())).thenReturn(mock(Counter.class));
    }

    @Test
    void signupNeedsNoMailConfigurationAndCanSignInImmediately() {
        long otpCount = otps.count();
        RegisterRequest request = new RegisterRequest("Test User", " immediate@example.com ", "Password123!", "Developer");

        RegistrationResponse response = authService.register(request);

        assertFalse(response.isVerificationRequired());
        assertEquals("immediate@example.com", response.getEmail());
        User user = users.findByEmailIgnoreCase(response.getEmail()).orElseThrow();
        assertTrue(user.getIsActive());
        assertTrue(user.getEmailVerified());
        assertEquals("hashed-value", user.getPasswordHash());
        assertEquals(otpCount, otps.count());
        assertEquals("access-token", authService.login(new AuthRequest(response.getEmail(), "Password123!")).getToken());
        assertThrows(IllegalArgumentException.class,
                () -> authService.login(new AuthRequest(response.getEmail(), "WrongPassword!")));
    }

    @Test
    void duplicateSignupStillFails() {
        RegisterRequest request = new RegisterRequest("Test User", "duplicate@example.com", "Password123!", "Developer");
        authService.register(request);

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
    }

    @Test
    void migrationActivatesPendingAccountsAndPreservesDisabledAccounts() {
        User pending = new User("Pending", "pending@example.com", "hashed-value", Set.of());
        pending.setEmailVerified(false);
        pending.setIsActive(false);
        users.save(pending);
        User disabled = new User("Disabled", "disabled@example.com", "hashed-value", Set.of());
        disabled.setIsActive(false);
        users.save(disabled);

        new ResourceDatabasePopulator(new ClassPathResource(
                "db/migration/V22__remove_registration_email_verification.sql")).execute(dataSource);

        User activated = users.findByEmailIgnoreCase(pending.getEmail()).orElseThrow();
        assertTrue(activated.getIsActive());
        assertTrue(activated.getEmailVerified());
        assertEquals("access-token", authService.login(new AuthRequest(activated.getEmail(), "Password123!")).getToken());
        assertFalse(users.findByEmailIgnoreCase(disabled.getEmail()).orElseThrow().getIsActive());
        assertThrows(IllegalArgumentException.class,
                () -> authService.login(new AuthRequest(disabled.getEmail(), "Password123!")));
    }
}
