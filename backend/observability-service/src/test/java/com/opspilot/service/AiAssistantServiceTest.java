package com.opspilot.service;

import com.opspilot.dto.AiDiagnosisResponse;
import com.opspilot.dto.AiQueryRequest;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.Project;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.projectlogs.ProjectAccess;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiAssistantServiceTest {

    private static final LocalDateTime DEPLOYED_AT = LocalDateTime.of(2026, 10, 1, 12, 0);

    private final DeploymentRepository deployments = mock(DeploymentRepository.class);
    private final LogRepository logs = mock(LogRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final AiAssistantService service = new AiAssistantService();

    private User owner;
    private User stranger;
    private Deployment deployment;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "deploymentRepository", deployments);
        ReflectionTestUtils.setField(service, "logRepository", logs);
        ReflectionTestUtils.setField(service, "projectAccess", new ProjectAccess(projects));

        owner = user(1L, "DEVELOPER");
        stranger = user(2L, "DEVELOPER");

        Project project = new Project("payments", "", null, owner, "ACTIVE");
        project.setId(10L);
        deployment = new Deployment(project, owner, "v2.8", "staging", "SUCCESS");
        deployment.setId(5L);
        deployment.setDeployedAt(DEPLOYED_AT);

        when(deployments.findById(5L)).thenReturn(Optional.of(deployment));
        when(projects.findById(10L)).thenReturn(Optional.of(project));
        when(logs.findProjectLogsBetween(anyLong(), any(), any(), anyBoolean(), any(Pageable.class))).thenReturn(List.of());
    }

    private static User user(long id, String role) {
        User user = new User("u" + id, "u" + id + "@example.com", "hash", Set.of(new Role(role, role)));
        user.setId(id);
        return user;
    }

    @Test
    void refusesToDiagnoseAnotherUsersDeployment() {
        assertThrows(ForbiddenException.class,
                () -> service.diagnose(new AiQueryRequest("why did #5 fail?", null), stranger));

        verify(logs, never()).findProjectLogsBetween(anyLong(), any(), any(), anyBoolean(), any(Pageable.class));
    }

    @Test
    void readsOnlyTheProjectsLogsInTheWindowAndNeverTheWholeTable() {
        service.diagnose(new AiQueryRequest("check", 5L), owner);

        verify(logs).findProjectLogsBetween(eq(10L), eq(DEPLOYED_AT.minusMinutes(10)), eq(DEPLOYED_AT.plusMinutes(10)),
                eq(true), any(Pageable.class));
        verify(logs, never()).findAllByOrderByTimestampDesc();
        verify(deployments, never()).findAll();
    }

    @Test
    void reportsErrorsAsARuleBasedMatchWithoutAnInventedConfidence() {
        LogEntity error = new LogEntity(deployment, "checkout", "ERROR", "TimeoutError");
        when(logs.findProjectLogsBetween(eq(10L), any(), any(), eq(true), any(Pageable.class))).thenReturn(List.of(error));

        AiDiagnosisResponse response = service.diagnose(new AiQueryRequest("check", 5L), owner);

        assertTrue(response.getConfidence().startsWith("Rule-based: 1 error/warning log(s)"));
        assertFalse(response.getConfidence().contains("%"));
        assertEquals(1, response.getCorrelatedLogs().size());
    }
}
