package com.opspilot.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.Integration;
import com.opspilot.entity.Resource;
import com.opspilot.integration.IntegrationAdapter;
import com.opspilot.integration.IntegrationProviderRegistry;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private IntegrationRepository integrationRepository;

    @Autowired
    private IntegrationProviderRegistry registry;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Resource> getResourcesByProject(Long projectId) {
        return resourceRepository.findByProjectId(projectId);
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public List<Resource> getResourcesByIntegration(Long integrationId) {
        return resourceRepository.findByIntegrationId(integrationId);
    }
    
    public List<Resource> syncResources(Long integrationId) {
        Optional<Integration> opt = integrationRepository.findById(integrationId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Integration not found");
        }
        
        Integration integration = opt.get();
        IntegrationAdapter adapter = registry.getAdapter(integration.getProvider())
            .orElseThrow(() -> new IllegalArgumentException("Adapter not found for provider"));
        
        List<Map<String, Object>> discovered = adapter.discoverResources(integration);
        List<Resource> existingResources = resourceRepository.findByIntegrationId(integrationId);
        
        for (Map<String, Object> map : discovered) {
            String type = map.containsKey("type") ? (String) map.get("type") : (map.containsKey("kind") ? (String) map.get("kind") : "UNKNOWN");
            String name = map.containsKey("name") ? (String) map.get("name") : "Unnamed";
            String providerId = map.containsKey("id") ? (String) map.get("id") : name;
            String status = map.containsKey("status") ? (String) map.get("status") : "ACTIVE";
            String region = map.containsKey("region") ? (String) map.get("region") : null;
            String environment = map.containsKey("environment") ? (String) map.get("environment") : null;
            
            Resource resource = existingResources.stream()
                .filter(r -> r.getProviderResourceId().equals(providerId))
                .findFirst()
                .orElse(new Resource());
                
            resource.setProjectId(integration.getProject().getId());
            resource.setIntegrationId(integration.getId());
            resource.setProvider(integration.getProvider());
            resource.setProviderResourceId(providerId);
            resource.setResourceType(type);
            resource.setName(name);
            resource.setStatus(status);
            resource.setRegion(region);
            resource.setEnvironment(environment);
            
            try {
                resource.setMetadata(objectMapper.writeValueAsString(map));
            } catch (JsonProcessingException e) {
                resource.setMetadata("{}");
            }
            
            resourceRepository.save(resource);
        }
        
        return resourceRepository.findByIntegrationId(integrationId);
    }
}
