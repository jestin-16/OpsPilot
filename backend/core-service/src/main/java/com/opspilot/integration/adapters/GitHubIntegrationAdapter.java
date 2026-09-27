package com.opspilot.integration.adapters;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import com.opspilot.integration.IntegrationAdapter;
import com.opspilot.security.credential.CredentialProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GitHubIntegrationAdapter implements IntegrationAdapter {

    @Autowired
    private CredentialProvider credentialProvider;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ProviderType getProviderType() {
        return ProviderType.GITHUB;
    }

    @Override
    public Set<IntegrationCapability> getCapabilities() {
        return EnumSet.of(
                IntegrationCapability.RESOURCE_DISCOVERY,
                IntegrationCapability.EVENTS,
                IntegrationCapability.LOGS,
                IntegrationCapability.DEPLOYMENT
        );
    }

    private HttpHeaders createHeaders(Integration integration) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "OpsPilot-Integration/1.0");
        headers.set("Accept", "application/vnd.github.v3+json");

        if (integration.getCredentialReference() != null && credentialProvider != null) {
            com.opspilot.security.credential.CredentialReference ref = new com.opspilot.security.credential.CredentialReference(integration.getCredentialReference(), "ENV");
            String token = credentialProvider.getCredential(ref);
            if (token != null && !token.isBlank()) {
                headers.set("Authorization", "Bearer " + token);
            }
        }
        return headers;
    }

    private String[] extractOwnerAndRepo(Integration integration) {
        Project project = integration.getProject();
        if (project == null) return null;

        String repoName = project.getGithubRepoName();
        if (repoName != null && repoName.contains("/")) {
            String[] parts = repoName.trim().split("/");
            if (parts.length >= 2 && !parts[0].isBlank() && !parts[1].isBlank()) {
                return new String[]{parts[0].trim(), parts[1].trim().replaceAll("\\.git$", "").replaceAll("/$", "")};
            }
        }

        String repoUrl = project.getRepositoryUrl();
        if (repoUrl != null && !repoUrl.isBlank()) {
            Pattern pattern = Pattern.compile("github\\.com[:/]([^/]+)/([^/\\s]+)");
            Matcher matcher = pattern.matcher(repoUrl.trim());
            if (matcher.find()) {
                String owner = matcher.group(1).trim();
                String repo = matcher.group(2).trim().replaceAll("\\.git$", "").replaceAll("/$", "");
                return new String[]{owner, repo};
            }
        }
        return null;
    }

    @Override
    public boolean testConnection(Integration integration) {
        String[] repoInfo = extractOwnerAndRepo(integration);
        if (repoInfo == null) return false;

        String url = String.format("https://api.github.com/repos/%s/%s", repoInfo[0], repoInfo[1]);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(createHeaders(integration)), String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean checkHealth(Integration integration) {
        return testConnection(integration);
    }

    @Override
    public List<Map<String, Object>> discoverResources(Integration integration) {
        List<Map<String, Object>> resources = new ArrayList<>();
        String[] repoInfo = extractOwnerAndRepo(integration);
        if (repoInfo == null) return resources;

        String owner = repoInfo[0];
        String repo = repoInfo[1];

        // Discover Repository
        Map<String, Object> repoResource = new HashMap<>();
        repoResource.put("type", "repository");
        repoResource.put("owner", owner);
        repoResource.put("name", repo);
        resources.add(repoResource);

        // Discover Branches
        String branchesUrl = String.format("https://api.github.com/repos/%s/%s/branches", owner, repo);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    branchesUrl, HttpMethod.GET, new HttpEntity<>(createHeaders(integration)), String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                for (JsonNode node : root) {
                    Map<String, Object> branchResource = new HashMap<>();
                    branchResource.put("type", "branch");
                    branchResource.put("name", node.path("name").asText());
                    branchResource.put("commitSha", node.path("commit").path("sha").asText());
                    resources.add(branchResource);
                }
            }
        } catch (Exception ignored) {
        }

        return resources;
    }



    @Override
    public List<Map<String, Object>> getMetrics(Integration integration, Map<String, Object> queryParams) {
        return Collections.emptyList();
    }

    @SuppressWarnings("unchecked")
    @Override
    public List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams) {
        Project project = integration.getProject();
        if (project == null || project.getId() == null) {
            return Collections.emptyList();
        }

        Long projectId = project.getId();
        
        // Reuse existing GithubSyncService via observability-service API
        // This ensures we do not duplicate GitHub sync logic and we use existing endpoints.
        try {
            // First, trigger sync
            String syncUrl = "http://observability-service:8083/api/v1/commits/project/" + projectId + "/sync";
            restTemplate.postForEntity(syncUrl, null, Map.class);

            // Fetch the synced commits
            String fetchUrl = "http://observability-service:8083/api/v1/commits/project/" + projectId;
            ResponseEntity<List> response = restTemplate.getForEntity(fetchUrl, List.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (List<Map<String, Object>>) response.getBody();
            }
        } catch (Exception e) {
            // Fallback: return empty list on failure
        }
        
        return Collections.emptyList();
    }
}
