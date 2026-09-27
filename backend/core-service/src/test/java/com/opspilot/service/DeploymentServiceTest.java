package com.opspilot.service;

import com.opspilot.dto.DeploymentRequest;
import com.opspilot.dto.DeploymentResponse;
import com.opspilot.entity.*;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.exception.UnauthorizedException;
import com.opspilot.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DeploymentServiceTest {

    @Mock
    private DeploymentRepository deploymentRepository;

    @Mock
    private ProjectRepository projectRepository;
    
    @Mock
    private LogRepository logRepository;
    
    @Mock
    private NotificationRepository notificationRepository;
    
    @Mock
    private ContainerRepository containerRepository;
    
    @Mock
    private PodRepository podRepository;
    
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DeploymentService deploymentService;

    private User owner;
    private User devops;
    private User admin;
    private User unauthorizedUser;
    private Project project;
    private Deployment currentDeployment;
    private Deployment previousStable;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setRoles(Collections.singleton(new Role("USER", "")));

        devops = new User();
        devops.setId(2L);
        devops.setRoles(Collections.singleton(new Role("DEVOPS", "")));

        admin = new User();
        admin.setId(3L);
        admin.setRoles(Collections.singleton(new Role("ADMIN", "")));

        unauthorizedUser = new User();
        unauthorizedUser.setId(4L);
        unauthorizedUser.setRoles(Collections.singleton(new Role("USER", "")));

        project = new Project();
        project.setId(10L);
        project.setOwner(owner);
        project.setProjectName("TestProject");

        currentDeployment = new Deployment(project, owner, "v2", "production", "Failed");
        currentDeployment.setId(100L);
        currentDeployment.setDeployedAt(LocalDateTime.now());

        previousStable = new Deployment(project, owner, "v1", "production", "Running");
        previousStable.setId(99L);
        previousStable.setDeployedAt(LocalDateTime.now().minusDays(1));
    }

    @Test
    void testRollbackDeployment_AuthorizedOwner_Success() {
        when(deploymentRepository.findById(100L)).thenReturn(Optional.of(currentDeployment));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(deploymentRepository.findByProjectOrderByDeployedAtDesc(project))
                .thenReturn(Arrays.asList(currentDeployment, previousStable));
        
        Deployment rollbackMock = new Deployment(project, owner, "v1", "production", "Draft");
        rollbackMock.setId(101L);
        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(invocation -> {
            Deployment arg = invocation.getArgument(0);
            if (arg.getId() == null) {
                return rollbackMock;
            }
            return arg;
        });

        DeploymentResponse response = deploymentService.rollbackDeployment(100L, owner);

        assertNotNull(response);
        assertEquals("v1", response.getVersion());
        assertEquals("RolledBack", currentDeployment.getStatus());
        verify(deploymentRepository, times(2)).save(any(Deployment.class)); // 1 for status update, 1 for new deployment
    }

    @Test
    void testRollbackDeployment_AuthorizedDevOps_Success() {
        when(deploymentRepository.findById(100L)).thenReturn(Optional.of(currentDeployment));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(deploymentRepository.findByProjectOrderByDeployedAtDesc(project))
                .thenReturn(Arrays.asList(currentDeployment, previousStable));
        
        Deployment rollbackMock = new Deployment(project, devops, "v1", "production", "Draft");
        rollbackMock.setId(101L);
        when(deploymentRepository.save(any(Deployment.class))).thenReturn(rollbackMock);

        DeploymentResponse response = deploymentService.rollbackDeployment(100L, devops);

        assertNotNull(response);
        assertEquals("v1", response.getVersion());
    }

    @Test
    void testRollbackDeployment_Unauthorized_ThrowsForbidden() {
        when(deploymentRepository.findById(100L)).thenReturn(Optional.of(currentDeployment));

        assertThrows(ForbiddenException.class, () -> {
            deploymentService.rollbackDeployment(100L, unauthorizedUser);
        });
    }

    @Test
    void testRollbackDeployment_InvalidDeployment_ThrowsNotFound() {
        when(deploymentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            deploymentService.rollbackDeployment(999L, owner);
        });
    }

    @Test
    void testRollbackDeployment_NoPreviousStable_ThrowsIllegalState() {
        when(deploymentRepository.findById(100L)).thenReturn(Optional.of(currentDeployment));
        when(deploymentRepository.findByProjectOrderByDeployedAtDesc(project))
                .thenReturn(Collections.singletonList(currentDeployment));

        assertThrows(IllegalStateException.class, () -> {
            deploymentService.rollbackDeployment(100L, owner);
        });
    }
}
