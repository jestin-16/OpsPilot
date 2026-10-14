package com.opspilot.config;

import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.repository.RoleRepository;
import com.opspilot.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataInitializerTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DataInitializer initializer;

    @BeforeEach
    void setUp() {
        when(roleRepository.findByRoleName(anyString()))
                .thenAnswer(call -> Optional.of(new Role(call.getArgument(0), "seeded")));
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
    }

    @Test
    void seedsOnlyRolesByDefault() throws Exception {
        initializer.run();

        verify(roleRepository, atLeastOnce()).findByRoleName("ADMIN");
        verify(userRepository, never()).save(any());
    }

    @Test
    void seedsTheDemoAccountsWhenEnabled() throws Exception {
        ReflectionTestUtils.setField(initializer, "demoUsersEnabled", true);

        initializer.run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(4)).save(saved.capture());
        assertFalse(saved.getAllValues().stream().anyMatch(u -> !u.getEmail().endsWith("@opspilot.io")
                && !u.getEmail().endsWith("@example.com")), "only demo addresses are seeded");
    }
}
