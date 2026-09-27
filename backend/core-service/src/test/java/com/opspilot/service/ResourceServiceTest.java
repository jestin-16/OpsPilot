package com.opspilot.service;

import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.entity.Resource;
import com.opspilot.enums.ProviderType;
import com.opspilot.integration.IntegrationAdapter;
import com.opspilot.integration.IntegrationProviderRegistry;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.repository.ResourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private IntegrationRepository integrationRepository;

    @Mock
    private IntegrationProviderRegistry registry;

    @Mock
    private IntegrationAdapter adapter;

    @InjectMocks
    private ResourceService resourceService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetResourcesByProject() {
        Resource r = new Resource();
        r.setId(1L);
        when(resourceRepository.findByProjectId(1L)).thenReturn(List.of(r));

        List<Resource> list = resourceService.getResourcesByProject(1L);
        assertEquals(1, list.size());
    }

    @Test
    void testSyncResources() {
        Project project = new Project();
        project.setId(1L);
        
        Integration integration = new Integration();
        integration.setId(10L);
        integration.setProject(project);
        integration.setProvider(ProviderType.DOCKER);
        
        when(integrationRepository.findById(10L)).thenReturn(Optional.of(integration));
        when(registry.getAdapter(ProviderType.DOCKER)).thenReturn(Optional.of(adapter));
        
        Map<String, Object> mockResource = new HashMap<>();
        mockResource.put("id", "container-123");
        mockResource.put("name", "my-container");
        mockResource.put("type", "Container");
        mockResource.put("status", "running");
        
        when(adapter.discoverResources(integration)).thenReturn(List.of(mockResource));
        when(resourceRepository.findByIntegrationId(10L)).thenReturn(new ArrayList<>());
        
        resourceService.syncResources(10L);
        
        verify(resourceRepository, times(1)).save(any(Resource.class));
        verify(resourceRepository, times(2)).findByIntegrationId(10L); // once before, once after sync
    }
}
