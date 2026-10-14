package com.opspilot.service;

import com.opspilot.dto.RegisterRequest;
import com.opspilot.entity.Role;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceRoleTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    private void seeded(String name) {
        when(roleRepository.findByRoleName(name)).thenReturn(Optional.of(new Role(name, name + " role")));
    }

    @ParameterizedTest
    @CsvSource({
            "Developer, DEVELOPER",
            "developer, DEVELOPER",
            "DevOps, DEVOPS",
            "DevOps Engineer, DEVOPS",
            "devops_engineer, DEVOPS",
    })
    void selfServiceRolesMapToTheSeededRoles(String requested, String expected) {
        seeded("DEVELOPER");
        seeded("DEVOPS");

        assertEquals(expected, authService.resolveSelfServiceRole(requested).getRoleName());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Admin", "ADMIN", "Administrator", " administrator "})
    void adminCannotBeChosenAtSignUp(String requested) {
        seeded("ADMIN");

        assertThrows(IllegalArgumentException.class, () -> authService.resolveSelfServiceRole(requested));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "SUPERUSER", "ROLE_ADMIN_2"})
    void unknownRolesAreRejectedNotCreated(String requested) {
        assertThrows(IllegalArgumentException.class, () -> authService.resolveSelfServiceRole(requested));

        verify(roleRepository, never()).save(any());
    }

    @Test
    void registeringAsAdminCreatesNoUserAndNoRole() {
        RegisterRequest request = new RegisterRequest("Mallory", "mallory@example.com", "Password123!", "Admin");

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));

        verify(userRepository, never()).save(any());
        verify(roleRepository, never()).save(any());
    }
}
