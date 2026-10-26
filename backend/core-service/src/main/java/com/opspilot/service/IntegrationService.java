package com.opspilot.service;

import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.ConnectorRegistry;
import com.opspilot.connector.ConnectorSecrets;
import com.opspilot.connector.IntegrationConnector;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.dto.IntegrationRequest;
import com.opspilot.dto.IntegrationResponse;
import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;
import com.opspilot.security.ingest.IngestTokenService;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.exception.ResourceNotFoundException;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class IntegrationService {

    @Autowired
    private IntegrationRepository integrationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private com.opspilot.integration.IntegrationProviderRegistry providerRegistry;

    @Autowired
    private ConnectorRegistry connectorRegistry;

    private final IngestTokenService ingestTokenService = new IngestTokenService();

    @Transactional
    public IntegrationResponse createIntegration(Long projectId, IntegrationRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (!project.getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to add integrations to this project");
        }

        Integration integration = new Integration();
        integration.setProject(project);
        integration.setProvider(request.getProvider());
        integration.setName(com.opspilot.validation.FormChecks.resourceName(request.getName(), "Integration name"));
        integration.setCategory(request.getCategory());
        applyConfig(integration, request, false);
        integration.setMetadata(request.getMetadata());
        integration.setStatus(IntegrationStatus.CONNECTING);

        String rawIngestToken = null;
        if (request.getProvider() == ProviderType.APP_LOGS) {
            rawIngestToken = ingestTokenService.generate();
            integration.setIngestTokenHash(ingestTokenService.hash(rawIngestToken));
            integration.setIngestTokenPrefix(ingestTokenService.displayPrefix(rawIngestToken));
            integration.setStatus(IntegrationStatus.CONNECTED);
        }

        Integration saved = integrationRepository.save(integration);
        IntegrationResponse response = mapToResponse(saved);
        response.setIngestToken(rawIngestToken); // shown once; only the hash is stored
        return response;
    }

    @Transactional
    public IntegrationResponse updateIntegration(Long projectId, Long integrationId, IntegrationRequest request, User currentUser) {
        Integration integration = loadAuthorized(projectId, integrationId, currentUser, "update");
        if (request.getName() != null && !request.getName().isBlank()) {
            integration.setName(com.opspilot.validation.FormChecks.resourceName(request.getName(), "Integration name"));
        }
        if (request.getMetadata() != null) {
            integration.setMetadata(request.getMetadata());
        }
        if (request.getConfig() != null || request.getConfiguration() != null || request.getSecrets() != null || request.getCredentials() != null) {
            applyConfig(integration, request, true);
            if (integration.getProvider() != ProviderType.APP_LOGS) {
                integration.setStatus(IntegrationStatus.CONNECTING); // settings changed: needs a new test
            }
        }
        return mapToResponse(integrationRepository.save(integration));
    }

    /** Runs the connector's connection test and records the outcome on the integration. */
    @Transactional
    public IntegrationResponse testIntegration(Long projectId, Long integrationId, User currentUser) {
        Integration integration = loadAuthorized(projectId, integrationId, currentUser, "test");
        ConnectionResult result;
        try {
            result = runTest(integration);
        } catch (RuntimeException e) {
            result = ConnectionResult.failure(e.getMessage() != null ? e.getMessage() : "Connection test failed");
        }
        integration.setStatus(result.ok() ? IntegrationStatus.CONNECTED : IntegrationStatus.ERROR);
        integration.setLastHealthCheckAt(java.time.LocalDateTime.now());
        Integration saved = integrationRepository.save(integration);
        IntegrationResponse response = mapToResponse(saved);
        response.setStatusMessage(result.message());
        return response;
    }

    @Transactional
    public IntegrationResponse disconnectIntegration(Long projectId, Long integrationId, User currentUser) {
        Integration integration = loadAuthorized(projectId, integrationId, currentUser, "disconnect");
        integration.setStatus(IntegrationStatus.DISCONNECTED);
        return mapToResponse(integrationRepository.save(integration));
    }

    @Transactional
    public void deleteIntegration(Long projectId, Long integrationId, User currentUser) {
        integrationRepository.delete(loadAuthorized(projectId, integrationId, currentUser, "delete"));
    }

    /** Containers, namespaces, pods ... for the UI pickers. */
    public java.util.List<java.util.Map<String, Object>> discoverResources(Long projectId, Long integrationId, String kind, User currentUser) {
        Integration integration = loadAuthorized(projectId, integrationId, currentUser, "browse");
        return connectorRegistry.require(integration.getProvider()).discoverResources(toConnectorConfig(integration), kind);
    }

    public ConnectorConfig toConnectorConfig(Integration integration) {
        return ConnectorConfig.fromJson(integration.getProject().getId(), integration.getId(), integration.getProvider(),
                integration.getName(), integration.getConfiguration(), integration.getCredentialReference());
    }

    private ConnectionResult runTest(Integration integration) {
        if (connectorRegistry != null && connectorRegistry.supports(integration.getProvider())) {
            return connectorRegistry.require(integration.getProvider()).testConnection(toConnectorConfig(integration));
        }
        // Providers without a connector (AWS, Vercel, Oracle) keep using their adapter.
        return providerRegistry.getAdapter(integration.getProvider())
                .map(a -> a.testConnection(integration)
                        ? ConnectionResult.success("Connection successful")
                        : ConnectionResult.failure("Connection failed"))
                .orElseGet(() -> ConnectionResult.failure("No connector available for " + integration.getProvider()));
    }

    /**
     * Stores non-secret settings as JSON and secrets encrypted. On update, secrets that are not re-sent are kept.
     */
    private void applyConfig(Integration integration, IntegrationRequest request, boolean merge) {
        Map<String, Object> settings = new HashMap<>();
        Map<String, String> secrets = new HashMap<>();
        if (merge) {
            settings.putAll(safeParse(integration.getConfiguration()));
            safeParse(integration.getCredentialReference()).forEach((k, v) -> secrets.put(k, String.valueOf(v)));
        }
        com.opspilot.validation.FormChecks.jsonObject(request.getConfiguration(), "Configuration");
        com.opspilot.validation.FormChecks.jsonObject(request.getCredentials(), "Credentials");
        com.opspilot.validation.FormChecks.jsonObject(request.getMetadata(), "Metadata");
        Map<String, Object> submitted = new HashMap<>(ConnectorConfig.parseObject(request.getConfiguration()));
        if (request.getConfig() != null) submitted.putAll(request.getConfig());
        for (String key : List.of("host", "apiServer", "baseUrl", "apiBaseUrl")) {
            Object value = submitted.get(key);
            if (value != null) com.opspilot.validation.FormChecks.endpoint(String.valueOf(value).trim(), key, key.equals("host"));
        }
        if (submitted.containsKey("pollSeconds")) {
            String interval = String.valueOf(submitted.get("pollSeconds"));
            if (!interval.matches("[0-9]{1,5}") || Integer.parseInt(interval) < 5 || Integer.parseInt(interval) > 86400) {
                throw new IllegalArgumentException("Poll interval must be a whole number between 5 and 86400 seconds");
            }
        }
        boolean hasNew = request.getConfig() != null || request.getSecrets() != null;
        if (hasNew) {
            ConnectorSecrets.Split split = ConnectorSecrets.split(request.getConfig(), request.getSecrets());
            if (merge && request.getConfig() != null) {
                settings.clear();
            }
            settings.putAll(split.settings());
            secrets.putAll(split.secrets());
            integration.setConfiguration(settings.isEmpty() && !merge ? null : ConnectorSecrets.toJson(settings));
            integration.setCredentialReference(secrets.isEmpty() ? null : ConnectorSecrets.toJson(secrets));
        } else {
            // legacy JSON-string fields
            if (request.getConfiguration() != null) {
                integration.setConfiguration(request.getConfiguration());
            }
            if (request.getCredentials() != null) {
                integration.setCredentialReference(request.getCredentials());
            }
        }
    }

    private Integration loadAuthorized(Long projectId, Long integrationId, User currentUser, String action) {
        Integration integration = integrationRepository.findByIdAndProjectId(integrationId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));
        if (!integration.getProject().getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to " + action + " this integration");
        }
        return integration;
    }

    public List<IntegrationResponse> getIntegrationsByProject(Long projectId, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (!project.getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to view integrations for this project");
        }

        return integrationRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public IntegrationResponse getIntegrationById(Long integrationId, User currentUser) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));

        if (!integration.getProject().getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to view this integration");
        }

        return mapToResponse(integration);
    }

    @Transactional
    public void deleteIntegration(Long integrationId, User currentUser) {
        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));

        if (!integration.getProject().getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to delete this integration");
        }

        integrationRepository.delete(integration);
    }

    private IntegrationResponse mapToResponse(Integration integration) {
        IntegrationResponse response = new IntegrationResponse();
        response.setId(integration.getId());
        response.setProjectId(integration.getProject().getId());
        response.setProvider(integration.getProvider());
        response.setName(integration.getName());
        response.setCategory(integration.getCategory());
        response.setStatus(integration.getStatus());
        Map<String, Object> settings = ConnectorSecrets.sanitize(safeParse(integration.getConfiguration()));
        response.setConfig(settings);
        response.setConfiguration(settings.isEmpty() ? null : ConnectorSecrets.toJson(settings));
        response.setCredentialKeys(new java.util.ArrayList<>(safeParse(integration.getCredentialReference()).keySet()));
        response.setIngestTokenPrefix(integration.getIngestTokenPrefix());
        response.setCreatedAt(integration.getCreatedAt());
        response.setUpdatedAt(integration.getUpdatedAt());
        response.setLastHealthCheckAt(integration.getLastHealthCheckAt());
        response.setMetadata(integration.getMetadata());
        // Credentials explicitly omitted
        return response;
    }

    private Map<String, Object> safeParse(String json) {
        try {
            return ConnectorConfig.parseObject(json);
        } catch (IllegalArgumentException e) {
            return Map.of(); // legacy non-JSON value: never echo it back
        }
    }

    private boolean isPrivileged(User user) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(role -> {
            String name = role.getRoleName() != null ? role.getRoleName().toUpperCase() : "";
            return name.contains("ADMIN") || name.contains("DEVOPS");
        });
    }

    /** On-demand read straight from the source (Git timeline, CI console ...); live streaming lives in observability-service. */
    public List<LogEntry> history(Long projectId, Long integrationId, LogFilters filters, int page, User currentUser) {
        Integration integration = loadAuthorized(projectId, integrationId, currentUser, "read logs from");
        IntegrationConnector connector = connectorRegistry.require(integration.getProvider());
        return connector.fetchHistory(toConnectorConfig(integration), filters, page);
    }

    public List<com.opspilot.metric.MetricRecord> getMetrics(Long projectId, Long integrationId, java.util.Map<String, Object> params, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (!project.getOwner().getId().equals(currentUser.getId()) && !isPrivileged(currentUser)) {
            throw new ForbiddenException("You do not have permission to view metrics for this project");
        }

        Integration integration = integrationRepository.findById(integrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Integration not found"));

        if (!integration.getProject().getId().equals(project.getId())) {
            throw new IllegalArgumentException("Integration does not belong to the specified project");
        }

        com.opspilot.integration.IntegrationAdapter adapter = providerRegistry.getAdapter(integration.getProvider())
                .orElseThrow(() -> new IllegalStateException("Provider adapter not found for " + integration.getProvider()));

        if (!adapter.supports(com.opspilot.enums.IntegrationCapability.METRICS)) {
            throw new UnsupportedOperationException("Provider does not support metric collection");
        }
        
        if (!(adapter instanceof com.opspilot.metric.MetricCollector)) {
            throw new UnsupportedOperationException("Adapter does not implement MetricCollector");
        }

        return ((com.opspilot.metric.MetricCollector) adapter).collectMetrics(integration, params == null ? new java.util.HashMap<>() : params);
    }
}
