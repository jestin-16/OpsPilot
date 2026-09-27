package com.opspilot.service;

import com.opspilot.dto.IntegrationRequest;
import com.opspilot.dto.IntegrationResponse;
import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.enums.IntegrationCategory;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IntegrationServiceTest {

    @Mock
    private IntegrationRepository integrationRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private IntegrationService integrationService;

    private User owner;
    private User otherUser;
    private User admin;
    private Project project;
    private Integration integration;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setRoles(Collections.emptySet());

        admin = new User();
        admin.setId(3L);
        Role adminRole = new Role();
        adminRole.setRoleName("ROLE_ADMIN");
        admin.setRoles(Set.of(adminRole));

        project = new Project();
        project.setId(10L);
        project.setOwner(owner);

        integration = new Integration();
        integration.setId(100L);
        integration.setProject(project);
        integration.setProvider(ProviderType.DOCKER);
        integration.setCategory(IntegrationCategory.CONTAINER);
        integration.setName("Local Docker");
        integration.setStatus(IntegrationStatus.CONNECTED);
    }

    @Test
    void createIntegration_Success() {
        IntegrationRequest req = new IntegrationRequest();
        req.setProvider(ProviderType.DOCKER);
        req.setName("Test Docker");
        req.setCategory(IntegrationCategory.CONTAINER);
        
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(integrationRepository.save(any(Integration.class))).thenAnswer(i -> {
            Integration saved = i.getArgument(0);
            saved.setId(101L);
            return saved;
        });

        IntegrationResponse res = integrationService.createIntegration(10L, req, owner);

        assertNotNull(res);
        assertEquals(101L, res.getId());
        assertEquals("Test Docker", res.getName());
        assertEquals(IntegrationStatus.CONNECTING, res.getStatus());
        verify(integrationRepository).save(any(Integration.class));
    }

    @Test
    void createIntegration_Forbidden() {
        IntegrationRequest req = new IntegrationRequest();
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        assertThrows(ForbiddenException.class, () -> integrationService.createIntegration(10L, req, otherUser));
    }

    @Test
    void createIntegration_AdminCanCreate() {
        IntegrationRequest req = new IntegrationRequest();
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(integrationRepository.save(any())).thenReturn(integration);
        
        IntegrationResponse res = integrationService.createIntegration(10L, req, admin);
        assertNotNull(res);
    }

    @Test
    void getIntegrationsByProject_Success() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(integrationRepository.findByProjectId(10L)).thenReturn(List.of(integration));

        List<IntegrationResponse> list = integrationService.getIntegrationsByProject(10L, owner);
        assertEquals(1, list.size());
        assertEquals(100L, list.get(0).getId());
    }

    @Test
    void getIntegrationById_Success() {
        when(integrationRepository.findById(100L)).thenReturn(Optional.of(integration));

        IntegrationResponse res = integrationService.getIntegrationById(100L, owner);
        assertNotNull(res);
        assertEquals(100L, res.getId());
    }

    @Test
    void getIntegrationById_Forbidden() {
        when(integrationRepository.findById(100L)).thenReturn(Optional.of(integration));

        assertThrows(ForbiddenException.class, () -> integrationService.getIntegrationById(100L, otherUser));
    }

    @Test
    void deleteIntegration_Success() {
        when(integrationRepository.findById(100L)).thenReturn(Optional.of(integration));

        integrationService.deleteIntegration(100L, owner);
        verify(integrationRepository).delete(integration);
    }
}
