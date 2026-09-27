package com.opspilot.integration.adapters;

import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationCapability;
import com.opspilot.enums.ProviderType;
import com.opspilot.integration.IntegrationAdapter;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.apis.AppsV1Api;
import io.kubernetes.client.openapi.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

import com.opspilot.log.LogCollector;
import com.opspilot.log.LogRecord;
import com.opspilot.metric.MetricCollector;
import com.opspilot.metric.MetricRecord;
import java.time.LocalDateTime;

@Component
public class KubernetesIntegrationAdapter implements IntegrationAdapter, LogCollector, MetricCollector {

    @Autowired(required = false)
    private ApiClient apiClient;

    @Override
    public ProviderType getProviderType() {
        return ProviderType.KUBERNETES;
    }

    @Override
    public Set<IntegrationCapability> getCapabilities() {
        return EnumSet.of(
                IntegrationCapability.RESOURCE_DISCOVERY,
                IntegrationCapability.LIVE_LOGS,
                IntegrationCapability.LOGS,
                IntegrationCapability.EVENTS,
                IntegrationCapability.METRICS,
                IntegrationCapability.RESTART
        );
    }

    @Override
    public boolean testConnection(Integration integration) {
        if (apiClient == null) return false;
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            coreApi.getAPIResources().execute();
            return true;
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
        if (apiClient == null) return resources;

        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            AppsV1Api appsApi = new AppsV1Api(apiClient);

            // Nodes
            V1NodeList nodeList = coreApi.listNode().execute();
            if (nodeList != null && nodeList.getItems() != null) {
                for (V1Node node : nodeList.getItems()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("kind", "Node");
                    map.put("name", node.getMetadata() != null ? node.getMetadata().getName() : "");
                    resources.add(map);
                }
            }

            // Pods
            V1PodList podList = coreApi.listPodForAllNamespaces().execute();
            if (podList != null && podList.getItems() != null) {
                for (V1Pod pod : podList.getItems()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("kind", "Pod");
                    map.put("name", pod.getMetadata() != null ? pod.getMetadata().getName() : "");
                    map.put("namespace", pod.getMetadata() != null ? pod.getMetadata().getNamespace() : "");
                    map.put("status", pod.getStatus() != null ? pod.getStatus().getPhase() : "");
                    resources.add(map);
                }
            }

            // Services
            V1ServiceList svcList = coreApi.listServiceForAllNamespaces().execute();
            if (svcList != null && svcList.getItems() != null) {
                for (V1Service svc : svcList.getItems()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("kind", "Service");
                    map.put("name", svc.getMetadata() != null ? svc.getMetadata().getName() : "");
                    map.put("namespace", svc.getMetadata() != null ? svc.getMetadata().getNamespace() : "");
                    resources.add(map);
                }
            }

            // Deployments
            V1DeploymentList deployList = appsApi.listDeploymentForAllNamespaces().execute();
            if (deployList != null && deployList.getItems() != null) {
                for (V1Deployment deploy : deployList.getItems()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("kind", "Deployment");
                    map.put("name", deploy.getMetadata() != null ? deploy.getMetadata().getName() : "");
                    map.put("namespace", deploy.getMetadata() != null ? deploy.getMetadata().getNamespace() : "");
                    resources.add(map);
                }
            }

            // Namespaces
            V1NamespaceList nsList = coreApi.listNamespace().execute();
            if (nsList != null && nsList.getItems() != null) {
                for (V1Namespace ns : nsList.getItems()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("kind", "Namespace");
                    map.put("name", ns.getMetadata() != null ? ns.getMetadata().getName() : "");
                    resources.add(map);
                }
            }

        } catch (Exception e) {
            // handle safely
            System.err.println("Kubernetes discovery failed: " + e.getMessage());
        }
        return resources;
    }

    @Override
    public List<LogRecord> collect(Integration integration, Map<String, Object> params) {
        return fetchKubernetesLogs(integration, params);
    }

    @Override
    public List<LogRecord> query(Integration integration, Map<String, Object> queryParams) {
        return fetchKubernetesLogs(integration, queryParams);
    }

    private List<LogRecord> fetchKubernetesLogs(Integration integration, Map<String, Object> queryParams) {
        String podName = (String) queryParams.get("podName");
        String namespace = (String) queryParams.get("namespace");
        if (podName == null || namespace == null) {
            throw new IllegalArgumentException("podName and namespace are required for Kubernetes logs");
        }
        
        List<LogRecord> logs = new ArrayList<>();
        if (apiClient == null) return logs;
        
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            String logString = coreApi.readNamespacedPodLog(podName, namespace).execute();
            if (logString != null && !logString.isEmpty()) {
                String[] lines = logString.split("\n");
                for (String line : lines) {
                    LogRecord record = new LogRecord();
                    record.setId(UUID.randomUUID().toString());
                    record.setTimestamp(LocalDateTime.now());
                    record.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                    record.setIntegrationId(integration.getId());
                    record.setProvider(ProviderType.KUBERNETES);
                    record.setResourceId(podName);
                    record.setResourceType("POD");
                    record.setService("k8s-" + namespace + "-" + podName);
                    record.setLevel("INFO");
                    record.setMessage(line);
                    logs.add(record);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch logs: " + e.getMessage());
        }
        
        int offset = queryParams.containsKey("offset") ? Integer.parseInt(queryParams.get("offset").toString()) : 0;
        int limit = queryParams.containsKey("limit") ? Integer.parseInt(queryParams.get("limit").toString()) : 1000;
        if (offset >= logs.size()) return new ArrayList<>();
        return logs.subList(offset, Math.min(offset + limit, logs.size()));
    }

    @Override
    public void stream(Integration integration, Map<String, Object> params, java.util.function.Consumer<LogRecord> logConsumer) {
        String podName = (String) params.get("podName");
        String namespace = (String) params.get("namespace");
        if (podName == null || namespace == null) {
            throw new IllegalArgumentException("podName and namespace are required for Kubernetes log streaming");
        }

        if (apiClient == null) return;
        
        try {
            // Using a simple polling mechanism for controlled streaming if native is unavailable.
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            final int[] sinceSeconds = {2}; 
            
            Thread pollingThread = new Thread(() -> {
                try {
                    while (!Thread.currentThread().isInterrupted()) {
                        String logString = coreApi.readNamespacedPodLog(podName, namespace)
                                .sinceSeconds(sinceSeconds[0])
                                .execute();
                        
                        if (logString != null && !logString.isEmpty()) {
                            String[] lines = logString.split("\n");
                            for (String line : lines) {
                                LogRecord record = new LogRecord();
                                record.setId(UUID.randomUUID().toString());
                                record.setTimestamp(LocalDateTime.now());
                                record.setProjectId(integration.getProject() != null ? integration.getProject().getId() : null);
                                record.setIntegrationId(integration.getId());
                                record.setProvider(ProviderType.KUBERNETES);
                                record.setResourceId(podName);
                                record.setResourceType("POD");
                                record.setService("k8s-" + namespace + "-" + podName);
                                record.setLevel("INFO");
                                record.setMessage(line);
                                logConsumer.accept(record);
                            }
                        }
                        sinceSeconds[0] = 2; // Next poll only looks at last 2 seconds
                        Thread.sleep(2000);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } catch (Exception e) {
                    System.err.println("Kubernetes stream polling failed: " + e.getMessage());
                }
            });
            pollingThread.start();
            
        } catch (Exception e) {
            System.err.println("Failed to start Kubernetes log streaming: " + e.getMessage());
        }
    }

    @Override
    public List<Map<String, Object>> getEvents(Integration integration, Map<String, Object> queryParams) {
        String podName = (String) queryParams.get("podName");
        String namespace = (String) queryParams.get("namespace");
        if (podName == null || namespace == null) {
            throw new IllegalArgumentException("podName and namespace are required for Kubernetes events");
        }

        List<Map<String, Object>> events = new ArrayList<>();
        if (apiClient == null) return events;

        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            CoreV1EventList eventList = coreApi.listNamespacedEvent(namespace).fieldSelector("involvedObject.name=" + podName).execute();
            if (eventList != null && eventList.getItems() != null) {
                for (CoreV1Event event : eventList.getItems()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("message", event.getMessage());
                    map.put("reason", event.getReason());
                    map.put("type", event.getType());
                    events.add(map);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch events: " + e.getMessage());
        }
        return events;
    }

    @Override
    public List<MetricRecord> collectMetrics(Integration integration, Map<String, Object> queryParams) {
        // Basic metrics collection from Kubernetes (e.g. metrics-server API)
        return Collections.emptyList();
    }

    @Override
    public boolean executeAction(Integration integration, IntegrationCapability action, Map<String, Object> params) {
        if (apiClient == null) return false;
        
        if (action == IntegrationCapability.RESTART) {
            String podName = (String) params.get("podName");
            String namespace = (String) params.get("namespace");
            if (podName == null || namespace == null) {
                throw new IllegalArgumentException("podName and namespace are required for Kubernetes RESTART action");
            }
            try {
                CoreV1Api coreApi = new CoreV1Api(apiClient);
                coreApi.deleteNamespacedPod(podName, namespace).execute();
                return true;
            } catch (Exception e) {
                return false;
            }
        }
        throw new UnsupportedOperationException("Action not supported by Kubernetes adapter: " + action);
    }
}
