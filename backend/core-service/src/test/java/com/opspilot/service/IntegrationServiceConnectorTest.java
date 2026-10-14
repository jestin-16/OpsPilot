package com.opspilot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.ConnectorRegistry;
import com.opspilot.connector.IntegrationConnector;
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
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IntegrationServiceConnectorTest {

    private static final ObjectMapper JSON = new ObjectMapper().findAndRegisterModules();

    @Mock private IntegrationRepository integrationRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private ConnectorRegistry connectorRegistry;
    @Mock private IntegrationConnector connector;

    @InjectMocks private IntegrationService service;

    private User owner;
    private User stranger;
    private User admin;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        stranger = new User();
        stranger.setId(2L);
        stranger.setRoles(Collections.emptySet());
        admin = new User();
        admin.setId(3L);
        Role r = new Role();
        r.setRoleName("ROLE_ADMIN");
        admin.setRoles(Set.of(r));
        project = new Project();
        project.setId(10L);
        project.setOwner(owner);
        lenient().when(integrationRepository.save(any(Integration.class))).thenAnswer(i -> {
            Integration saved = i.getArgument(0);
            if (saved.getId() == null) saved.setId(100L);
            return saved;
        });
    }

    private IntegrationRequest request(ProviderType type, Map<String, Object> config) {
        IntegrationRequest req = new IntegrationRequest();
        req.setProvider(type);
        req.setName("my " + type);
        req.setCategory(IntegrationCategory.KUBERNETES);
        req.setConfig(config);
        return req;
    }

    private Integration stored(ProviderType type, String settings, String secrets) {
        Integration i = new Integration();
        i.setId(100L);
        i.setProject(project);
        i.setProvider(type);
        i.setName("n");
        i.setStatus(IntegrationStatus.CONNECTING);
        i.setConfiguration(settings);
        i.setCredentialReference(secrets);
        return i;
    }

    @Test
    void create_storesSecretsSeparatelyAndNeverReturnsThem() throws Exception {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        IntegrationResponse res = service.createIntegration(10L,
                request(ProviderType.KUBERNETES, Map.of("apiServer", "https://k8s:6443", "namespace", "prod", "token", "tok-123", "caCert", "PEM")), owner);

        ArgumentCaptor<Integration> saved = ArgumentCaptor.forClass(Integration.class);
        verify(integrationRepository).save(saved.capture());
        assertFalse(saved.getValue().getConfiguration().contains("tok-123"), "secret leaked into plain settings");
        assertTrue(saved.getValue().getCredentialReference().contains("tok-123"));

        String body = JSON.writeValueAsString(res);
        assertFalse(body.contains("tok-123"));
        assertFalse(body.contains("PEM"));
        assertEquals("prod", res.getConfig().get("namespace"));
        assertTrue(res.getCredentialKeys().containsAll(java.util.List.of("token", "caCert")));
        assertEquals(IntegrationStatus.CONNECTING, res.getStatus());
        assertNull(res.getIngestToken());
    }

    @Test
    void create_appLogsReturnsIngestTokenOnceAndStoresOnlyItsHash() throws Exception {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        IntegrationResponse res = service.createIntegration(10L, request(ProviderType.APP_LOGS, Map.of("app", "django-demo")), owner);

        assertNotNull(res.getIngestToken());
        assertTrue(res.getIngestToken().startsWith("opl_"));
        assertEquals(IntegrationStatus.CONNECTED, res.getStatus());
        ArgumentCaptor<Integration> saved = ArgumentCaptor.forClass(Integration.class);
        verify(integrationRepository).save(saved.capture());
        assertEquals(64, saved.getValue().getIngestTokenHash().length());
        assertNotEquals(res.getIngestToken(), saved.getValue().getIngestTokenHash());

        // reading it back never includes the token
        when(integrationRepository.findByProjectId(10L)).thenReturn(java.util.List.of(saved.getValue()));
        String listed = JSON.writeValueAsString(service.getIntegrationsByProject(10L, owner));
        assertFalse(listed.contains(res.getIngestToken()));
        assertTrue(listed.contains(saved.getValue().getIngestTokenPrefix()));
    }

    @Test
    void update_keepsExistingSecretsWhenNotResent() {
        Integration existing = stored(ProviderType.GITHUB, "{\"repo\":\"a/b\"}", "{\"token\":\"keep-me\"}");
        when(integrationRepository.findByIdAndProjectId(100L, 10L)).thenReturn(Optional.of(existing));

        IntegrationRequest req = new IntegrationRequest();
        req.setConfig(Map.of("repo", "a/c"));
        IntegrationResponse res = service.updateIntegration(10L, 100L, req, owner);

        assertEquals("a/c", res.getConfig().get("repo"));
        assertTrue(existing.getCredentialReference().contains("keep-me"));
        assertEquals(IntegrationStatus.CONNECTING, res.getStatus(), "changed settings must be re-tested");
    }

    @Test
    void update_replacesASecretWhenResent() {
        Integration existing = stored(ProviderType.GITHUB, "{\"repo\":\"a/b\"}", "{\"token\":\"old\"}");
        when(integrationRepository.findByIdAndProjectId(100L, 10L)).thenReturn(Optional.of(existing));

        IntegrationRequest req = new IntegrationRequest();
        req.setSecrets(Map.of("token", "new"));
        service.updateIntegration(10L, 100L, req, owner);

        assertTrue(existing.getCredentialReference().contains("new"));
        assertFalse(existing.getCredentialReference().contains("old"));
        assertTrue(existing.getConfiguration().contains("a/b"), "settings untouched when only secrets change");
    }

    @Test
    void test_successMarksConnectedAndPassesDecryptedConfigToConnector() {
        Integration existing = stored(ProviderType.DOCKER, "{\"host\":\"http://d:2375\"}", "{\"caCert\":\"PEM\"}");
        when(integrationRepository.findByIdAndProjectId(100L, 10L)).thenReturn(Optional.of(existing));
        when(connectorRegistry.supports(ProviderType.DOCKER)).thenReturn(true);
        when(connectorRegistry.require(ProviderType.DOCKER)).thenReturn(connector);
        when(connector.testConnection(any())).thenReturn(ConnectionResult.success("Docker 26 reachable"));

        IntegrationResponse res = service.testIntegration(10L, 100L, owner);

        assertEquals(IntegrationStatus.CONNECTED, res.getStatus());
        assertEquals("Docker 26 reachable", res.getStatusMessage());
        assertNotNull(res.getLastCheckedAt());
        ArgumentCaptor<ConnectorConfig> cfg = ArgumentCaptor.forClass(ConnectorConfig.class);
        verify(connector).testConnection(cfg.capture());
        assertEquals("http://d:2375", cfg.getValue().setting("host"));
        assertEquals("PEM", cfg.getValue().secret("caCert"));
        assertEquals(10L, cfg.getValue().projectId());
    }

    @Test
    void test_failureAndConnectorCrashBothMarkError() {
        Integration existing = stored(ProviderType.DOCKER, "{}", null);
        when(integrationRepository.findByIdAndProjectId(100L, 10L)).thenReturn(Optional.of(existing));
        when(connectorRegistry.supports(ProviderType.DOCKER)).thenReturn(true);
        when(connectorRegistry.require(ProviderType.DOCKER)).thenReturn(connector);
        when(connector.testConnection(any())).thenReturn(ConnectionResult.failure("password=hunter2 refused"));

        IntegrationResponse failed = service.testIntegration(10L, 100L, owner);
        assertEquals(IntegrationStatus.ERROR, failed.getStatus());
        assertFalse(failed.getStatusMessage().contains("hunter2"), "connector messages are masked");

        when(connector.testConnection(any())).thenThrow(new IllegalStateException("boom"));
        assertEquals(IntegrationStatus.ERROR, service.testIntegration(10L, 100L, owner).getStatus());
    }

    @Test
    void disconnect_setsDisconnected() {
        Integration existing = stored(ProviderType.DOCKER, "{}", null);
        existing.setStatus(IntegrationStatus.CONNECTED);
        when(integrationRepository.findByIdAndProjectId(100L, 10L)).thenReturn(Optional.of(existing));
        assertEquals(IntegrationStatus.DISCONNECTED, service.disconnectIntegration(10L, 100L, owner).getStatus());
    }

    @Test
    void strangersAreForbiddenAndAdminsAllowed() {
        Integration existing = stored(ProviderType.DOCKER, "{}", null);
        when(integrationRepository.findByIdAndProjectId(100L, 10L)).thenReturn(Optional.of(existing));

        assertThrows(ForbiddenException.class, () -> service.testIntegration(10L, 100L, stranger));
        assertThrows(ForbiddenException.class, () -> service.updateIntegration(10L, 100L, new IntegrationRequest(), stranger));
        assertThrows(ForbiddenException.class, () -> service.disconnectIntegration(10L, 100L, stranger));
        assertThrows(ForbiddenException.class, () -> service.deleteIntegration(10L, 100L, stranger));
        assertDoesNotThrow(() -> service.disconnectIntegration(10L, 100L, admin));
    }

    @Test
    void integrationFromAnotherProjectIsNotFound() {
        when(integrationRepository.findByIdAndProjectId(100L, 99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.testIntegration(99L, 100L, owner));
        verifyNoInteractions(connector);
    }

    @Test
    void legacyNonJsonCredentialIsNeverEchoed() throws Exception {
        Integration legacy = stored(ProviderType.GITHUB, "not json", "plaintext-legacy-token");
        when(integrationRepository.findByProjectId(10L)).thenReturn(java.util.List.of(legacy));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        String body = JSON.writeValueAsString(service.getIntegrationsByProject(10L, owner));
        assertFalse(body.contains("plaintext-legacy-token"));
        assertFalse(body.contains("not json"));
    }
}
