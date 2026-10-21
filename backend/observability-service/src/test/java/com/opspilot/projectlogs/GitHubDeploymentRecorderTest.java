package com.opspilot.projectlogs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GitHubDeploymentRecorderTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final DeploymentRepository deployments = mock(DeploymentRepository.class);
    private final ProjectRepository projects = mock(ProjectRepository.class);
    private final LogRepository logs = mock(LogRepository.class);
    private final GitHubDeploymentRecorder recorder = new GitHubDeploymentRecorder(deployments, projects, logs);

    @BeforeEach
    void setUp() {
        Project project = new Project("Payments", "", null, new User("o", "o@example.com", "h", Set.of()), "Active");
        project.setId(10L);
        when(projects.findById(10L)).thenReturn(Optional.of(project));
        when(deployments.save(any(Deployment.class))).thenAnswer(call -> call.getArgument(0));
    }

    private static JsonNode payload(String json) throws Exception {
        return JSON.readTree(json.replace('\'', '"'));
    }

    private static final String DEPLOYMENT = "'deployment': {'id': 555, 'sha': '1a2b3c4d5e6f', 'ref': 'v2.8.4',"
            + " 'environment': 'production', 'created_at': '2026-10-01T12:00:00Z', 'creator': {'login': 'octocat'}}";

    @Test
    void aNewGitHubDeploymentIsRecordedAsInProgress() throws Exception {
        when(deployments.findByProject_IdAndSourceAndExternalId(10L, "GITHUB", "555")).thenReturn(Optional.empty());

        Deployment d = recorder.record(10L, "deployment", payload("{" + DEPLOYMENT + "}")).orElseThrow();

        assertEquals("v2.8.4@1a2b3c4", d.getVersion());
        assertEquals("production", d.getEnvironment());
        assertEquals(Deployment.IN_PROGRESS, d.getStatus());
        assertEquals("GITHUB", d.getSource());
        assertEquals("octocat", d.getActor());
        assertNull(d.getDeployedBy(), "no OpsPilot user is invented for a GitHub deployment");
    }

    @Test
    void aStatusEventUpdatesTheSameDeploymentAndItsUrl() throws Exception {
        Deployment existing = new Deployment();
        existing.setStatus(Deployment.IN_PROGRESS);
        when(deployments.findByProject_IdAndSourceAndExternalId(10L, "GITHUB", "555")).thenReturn(Optional.of(existing));

        Deployment d = recorder.record(10L, "deployment_status", payload("{'deployment_status': {'state': 'success',"
                + " 'environment_url': 'https://pay.example.com', 'updated_at': '2026-10-01T12:03:00Z'}, " + DEPLOYMENT + "}")).orElseThrow();

        assertSame(existing, d);
        assertEquals(Deployment.SUCCEEDED, d.getStatus());
        assertEquals("https://pay.example.com", d.getUrl());
    }

    @Test
    void anOlderStatusDeliveredLateDoesNotOverwriteANewerOne() throws Exception {
        Deployment existing = new Deployment();
        existing.setStatus(Deployment.SUCCEEDED);
        existing.setUpdatedAt(java.time.OffsetDateTime.parse("2026-10-01T12:05:00Z")
                .atZoneSameInstant(java.time.ZoneId.systemDefault()).toLocalDateTime());
        when(deployments.findByProject_IdAndSourceAndExternalId(10L, "GITHUB", "555")).thenReturn(Optional.of(existing));

        recorder.record(10L, "deployment_status", payload("{'deployment_status': {'state': 'in_progress',"
                + " 'updated_at': '2026-10-01T12:01:00Z'}, " + DEPLOYMENT + "}"));

        assertEquals(Deployment.SUCCEEDED, existing.getStatus());
        verify(deployments, never()).save(any());
    }

    @Test
    void mapsEveryGitHubState() {
        assertEquals(Deployment.SUCCEEDED, GitHubDeploymentRecorder.mapState("success"));
        assertEquals(Deployment.FAILED, GitHubDeploymentRecorder.mapState("failure"));
        assertEquals(Deployment.FAILED, GitHubDeploymentRecorder.mapState("error"));
        assertEquals(Deployment.INACTIVE, GitHubDeploymentRecorder.mapState("inactive"));
        assertEquals(Deployment.IN_PROGRESS, GitHubDeploymentRecorder.mapState("queued"));
    }

    @Test
    void ignoresPayloadsWithoutADeployment() throws Exception {
        assertTrue(recorder.record(10L, "deployment", payload("{'zen': 'hi'}")).isEmpty());
        verify(deployments, never()).save(any());
    }
}
