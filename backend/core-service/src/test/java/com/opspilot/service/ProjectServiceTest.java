package com.opspilot.service;

import com.opspilot.dto.ProjectCreateRequest;
import com.opspilot.dto.ProjectRequest;
import com.opspilot.dto.ProjectResponse;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.ProjectRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    private User owner;
    private User stranger;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(projectService, "meterRegistry", new SimpleMeterRegistry());
        owner = new User();
        owner.setId(1L);
        owner.setName("Owner");
        stranger = new User();
        stranger.setId(2L);
    }

    private void stubSave() {
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> {
            Project p = i.getArgument(0);
            p.setId(10L);
            return p;
        });
    }

    @Test
    void createProject_generatesSlugAndDefaultsEnvironment() {
        stubSave();
        ProjectCreateRequest req = new ProjectCreateRequest();
        req.setProjectName("My Cool App");

        ProjectResponse res = projectService.createProject(req, owner);

        assertEquals("my-cool-app", res.getSlug());
        assertEquals("dev", res.getEnvironment());
        assertEquals("My Cool App", res.getName());
    }

    @Test
    void createProject_slugCollisionGetsSuffix() {
        stubSave();
        when(projectRepository.existsBySlug("my-app")).thenReturn(true);
        when(projectRepository.existsBySlug("my-app-2")).thenReturn(false);
        ProjectCreateRequest req = new ProjectCreateRequest();
        req.setProjectName("My App");
        req.setEnvironment("prod");

        ProjectResponse res = projectService.createProject(req, owner);

        assertEquals("my-app-2", res.getSlug());
        assertEquals("prod", res.getEnvironment());
    }

    @Test
    void updateProject_ownerCanChangeEnvironmentButSlugStaysStable() {
        Project project = new Project("Old Name", null, null, owner, "Active");
        project.setId(10L);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArgument(0));
        ProjectRequest req = new ProjectRequest();
        req.setProjectName("New Name");
        req.setEnvironment("staging");

        ProjectResponse res = projectService.updateProject(10L, req, owner);

        assertEquals("staging", res.getEnvironment());
        assertEquals("old-name", res.getSlug());
        assertEquals("New Name", res.getName());
    }

    @Test
    void getProject_nonOwnerIsForbidden() {
        Project project = new Project("P", null, null, owner, "Active");
        project.setId(10L);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThrows(ForbiddenException.class, () -> projectService.getProjectById(10L, stranger));
    }

    @Test
    void getAllProjectsForUser_returnsOnlyProjectsOwnedByUser() {
        Project p1 = new Project("Owned", null, null, owner, "Active");
        p1.setId(10L);
        when(projectRepository.findByOwner(owner)).thenReturn(java.util.List.of(p1));

        java.util.List<ProjectResponse> result = projectService.getAllProjectsForUser(owner);
        assertEquals(1, result.size());
        assertEquals("Owned", result.get(0).getName());
        verify(projectRepository, never()).findAll();
    }

    @Test
    void getAllProjectsForAdmin_returnsAllProjects() {
        Project p1 = new Project("P1", null, null, owner, "Active");
        p1.setId(10L);
        Project p2 = new Project("P2", null, null, stranger, "Active");
        p2.setId(20L);
        when(projectRepository.findAll()).thenReturn(java.util.List.of(p1, p2));

        java.util.List<ProjectResponse> result = projectService.getAllProjectsForAdmin();
        assertEquals(2, result.size());
    }
}
