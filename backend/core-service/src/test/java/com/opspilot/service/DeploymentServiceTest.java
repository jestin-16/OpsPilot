package com.opspilot.service;

import com.opspilot.dto.DeploymentRequest;
import com.opspilot.dto.DeploymentResponse;
import com.opspilot.entity.*;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.*;
import com.opspilot.security.ProjectScope;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Deployments are recorded, never simulated: no timers, containers or pods are involved. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeploymentServiceTest {

    @Mock
    private DeploymentRepository deploymentRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private LogRepository logRepository;
    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private DeploymentService deploymentService;

    private User owner;
    private User stranger;
    private Project project;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(deploymentService, "projectScope", new ProjectScope(projectRepository));
        owner = user(1L, "Owner", "DEVELOPER");
        stranger = user(2L, "Stranger", "DEVELOPER");
        project = new Project("Payments", "", null, owner, "Active");
        project.setId(10L);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(call -> {
            Deployment d = call.getArgument(0);
            if (d.getId() == null) d.setId(100L);
            return d;
        });
    }

    private static User user(long id, String name, String role) {
        User user = new User(name, name.toLowerCase() + "@example.com", "hash", Set.of(new Role(role, role)));
        user.setId(id);
        return user;
    }

    private static DeploymentRequest request(String status) {
        DeploymentRequest request = new DeploymentRequest("v2.8.4", "production");
        request.setStatus(status);
        return request;
    }

    @Test
    void recordsADeploymentAttributedToTheCaller() {
        DeploymentResponse response = deploymentService.recordDeployment(10L, request(null), owner);

        assertEquals(Deployment.SUCCEEDED, response.getStatus(), "no status means it succeeded");
        assertEquals("Owner", response.getDeployedByName());
        assertEquals(Deployment.SOURCE_MANUAL, response.getSource());
        verify(deploymentRepository, times(1)).save(any(Deployment.class));
    }

    @Test
    void someoneWhoCannotSeeTheProjectCannotRecordADeployment() {
        assertThrows(ForbiddenException.class, () -> deploymentService.recordDeployment(10L, request(null), stranger));

        verify(deploymentRepository, never()).save(any());
    }

    @ParameterizedTest
    @CsvSource({
            "success, Succeeded", "SUCCEEDED, Succeeded", "failure, Failed", "error, Failed",
            "in_progress, In progress", "pending, In progress", "inactive, Inactive",
    })
    void normalisesStatusSpellings(String given, String expected) {
        assertEquals(expected, DeploymentService.normalizeStatus(given));
    }

    @Test
    void rejectsUnknownStatuses() {
        assertThrows(IllegalArgumentException.class, () -> DeploymentService.normalizeStatus("Deploying soon"));
    }

    @Test
    void notifiesTheOwnerWhenAFailureIsRecorded() {
        deploymentService.recordDeployment(10L, request("failed"), owner);

        ArgumentCaptor<NotificationEntity> sent = ArgumentCaptor.forClass(NotificationEntity.class);
        verify(notificationRepository).save(sent.capture());
        assertTrue(sent.getValue().getMessage().contains("failed"));
    }

    @Test
    void deploymentLogsAreTheProjectsLogsAroundIt() {
        Deployment deployment = new Deployment(project, owner, "v1", "staging", Deployment.SUCCEEDED);
        deployment.setId(7L);
        LocalDateTime at = LocalDateTime.of(2026, 10, 1, 12, 0);
        deployment.setDeployedAt(at);
        when(deploymentRepository.findById(7L)).thenReturn(Optional.of(deployment));
        LogEntity newer = new LogEntity(deployment, "api", "INFO", "second");
        LogEntity older = new LogEntity(deployment, "api", "INFO", "first");
        when(logRepository.findProjectLogsBetween(eq(10L), any(), any(), eq(false), any(Pageable.class)))
                .thenReturn(new ArrayList<>(List.of(newer, older)));

        List<LogEntity> logs = deploymentService.getDeploymentLogs(7L, owner);

        verify(logRepository).findProjectLogsBetween(eq(10L), eq(at.minusMinutes(5)), eq(at.plusMinutes(15)), eq(false), any(Pageable.class));
        assertEquals(List.of(older, newer), logs, "oldest first");
    }
}
