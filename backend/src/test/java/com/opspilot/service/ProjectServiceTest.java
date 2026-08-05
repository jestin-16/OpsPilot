package com.opspilot.service;

import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.Project;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    private User ownerUser;
    private User otherUser;
    private User adminUser;
    private Project testProject;

    @BeforeEach
    void setUp() {
        Role devRole = new Role("Developer", "Dev");
        Role adminRole = new Role("Administrator", "Admin");

        ownerUser = new User("Owner", "owner@example.com", "pass", Set.of(devRole));
        ownerUser.setId(1L);

        otherUser = new User("Other", "other@example.com", "pass", Set.of(devRole));
        otherUser.setId(2L);

        adminUser = new User("Admin", "admin@example.com", "pass", Set.of(adminRole));
        adminUser.setId(3L);

        testProject = new Project("Test App", "Description", "https://github.com/test/app", ownerUser, "Active");
        testProject.setId(100L);
    }

    @Test
    void createProject_Success() {
        ProjectRequest request = new ProjectRequest("Test App", "Description", "https://github.com/test/app", "Active");
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectResponse response = projectService.createProject(request, ownerUser);

        assertNotNull(response);
        assertEquals("Test App", response.getProjectName());
        assertEquals(1L, response.getOwnerId());
    }

    @Test
    void updateProject_AsOwner_Success() {
        ProjectRequest request = new ProjectRequest("Updated App", "New Desc", "https://github.com/test/updated", "Active");
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectResponse response = projectService.updateProject(100L, request, ownerUser);

        assertNotNull(response);
        verify(projectRepository, times(1)).save(testProject);
    }

    @Test
    void updateProject_AsAdmin_Success() {
        ProjectRequest request = new ProjectRequest("Admin Updated", "Desc", "https://github.com/test/app", "Active");
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectResponse response = projectService.updateProject(100L, request, adminUser);

        assertNotNull(response);
        verify(projectRepository, times(1)).save(testProject);
    }

    @Test
    void updateProject_AsNonOwnerNonAdmin_ThrowsForbidden() {
        ProjectRequest request = new ProjectRequest("Unauthorized Update", "Desc", "https://github.com/test/app", "Active");
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));

        assertThrows(ForbiddenException.class, () -> projectService.updateProject(100L, request, otherUser));
        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void deleteProject_AsNonOwnerNonAdmin_ThrowsForbidden() {
        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));

        assertThrows(ForbiddenException.class, () -> projectService.deleteProject(100L, otherUser));
        verify(projectRepository, never()).delete(any(Project.class));
    }
}
