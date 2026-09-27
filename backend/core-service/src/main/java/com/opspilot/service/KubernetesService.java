package com.opspilot.service;

import com.opspilot.entity.PodEntity;
import com.opspilot.repository.PodRepository;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class KubernetesService {

    @Autowired(required = false)
    private ApiClient apiClient;

    @Autowired
    private PodRepository podRepository;

    public Map<String, Object> getClusterOverview() {
        Map<String, Object> overview = new HashMap<>();
        if (apiClient == null) {
            overview.put("status", "Disconnected");
            overview.put("nodeCount", 0);
            overview.put("podCount", 0);
            overview.put("runningPods", 0);
            overview.put("failedPods", 0);
            return overview;
        }
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            V1NodeList nodeList = coreApi.listNode().execute();
            V1PodList podList = coreApi.listPodForAllNamespaces().execute();
            
            overview.put("status", "Healthy");
            overview.put("nodeCount", nodeList != null && nodeList.getItems() != null ? nodeList.getItems().size() : 0);
            
            int podCount = 0;
            int runningPods = 0;
            int failedPods = 0;
            
            if (podList != null && podList.getItems() != null) {
                podCount = podList.getItems().size();
                for (V1Pod p : podList.getItems()) {
                    String phase = p.getStatus() != null ? p.getStatus().getPhase() : "";
                    if ("Running".equalsIgnoreCase(phase)) runningPods++;
                    else if ("Failed".equalsIgnoreCase(phase) || "Unknown".equalsIgnoreCase(phase)) failedPods++;
                }
            }
            overview.put("podCount", podCount);
            overview.put("runningPods", runningPods);
            overview.put("failedPods", failedPods);
        } catch (Exception e) {
            overview.put("status", "Error: " + e.getMessage());
        }
        return overview;
    }

    public List<Map<String, Object>> getNodes() {
        List<Map<String, Object>> nodes = new ArrayList<>();
        if (apiClient == null) return nodes;
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            V1NodeList nodeList = coreApi.listNode().execute();
            if (nodeList != null && nodeList.getItems() != null) {
                for (V1Node node : nodeList.getItems()) {
                    Map<String, Object> n = new HashMap<>();
                    n.put("name", node.getMetadata() != null ? node.getMetadata().getName() : "");
                    
                    String status = "Unknown";
                    if (node.getStatus() != null && node.getStatus().getConditions() != null) {
                        for (V1NodeCondition cond : node.getStatus().getConditions()) {
                            if ("Ready".equals(cond.getType())) {
                                status = "True".equals(cond.getStatus()) ? "Ready" : "NotReady";
                            }
                        }
                    }
                    n.put("status", status);
                    
                    String role = "<none>";
                    if (node.getMetadata() != null && node.getMetadata().getLabels() != null) {
                        if (node.getMetadata().getLabels().containsKey("node-role.kubernetes.io/control-plane") || 
                            node.getMetadata().getLabels().containsKey("node-role.kubernetes.io/master")) {
                            role = "control-plane";
                        } else {
                            role = "worker";
                        }
                    }
                    n.put("role", role);
                    n.put("version", node.getStatus() != null && node.getStatus().getNodeInfo() != null ? node.getStatus().getNodeInfo().getKubeletVersion() : "");
                    n.put("createdAt", node.getMetadata() != null ? (node.getMetadata().getCreationTimestamp() != null ? node.getMetadata().getCreationTimestamp().toString() : "") : "");
                    nodes.add(n);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch nodes: " + e.getMessage());
        }
        return nodes;
    }

    public List<Map<String, Object>> getServices() {
        List<Map<String, Object>> services = new ArrayList<>();
        if (apiClient == null) return services;
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            V1ServiceList svcList = coreApi.listServiceForAllNamespaces().execute();
            if (svcList != null && svcList.getItems() != null) {
                for (V1Service svc : svcList.getItems()) {
                    Map<String, Object> s = new HashMap<>();
                    s.put("name", svc.getMetadata() != null ? svc.getMetadata().getName() : "");
                    s.put("namespace", svc.getMetadata() != null ? svc.getMetadata().getNamespace() : "");
                    s.put("type", svc.getSpec() != null ? svc.getSpec().getType() : "");
                    s.put("clusterIP", svc.getSpec() != null ? svc.getSpec().getClusterIP() : "");
                    s.put("createdAt", svc.getMetadata() != null && svc.getMetadata().getCreationTimestamp() != null ? svc.getMetadata().getCreationTimestamp().toString() : "");
                    services.add(s);
                }
            }
        } catch (Exception e) {
             System.err.println("Failed to fetch services: " + e.getMessage());
        }
        return services;
    }

    public List<Map<String, Object>> getNamespaces() {
        List<Map<String, Object>> namespaces = new ArrayList<>();
        if (apiClient == null) return namespaces;
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            V1NamespaceList nsList = coreApi.listNamespace().execute();
            if (nsList != null && nsList.getItems() != null) {
                for (V1Namespace ns : nsList.getItems()) {
                    Map<String, Object> n = new HashMap<>();
                    n.put("name", ns.getMetadata() != null ? ns.getMetadata().getName() : "");
                    n.put("status", ns.getStatus() != null ? ns.getStatus().getPhase() : "");
                    n.put("createdAt", ns.getMetadata() != null && ns.getMetadata().getCreationTimestamp() != null ? ns.getMetadata().getCreationTimestamp().toString() : "");
                    namespaces.add(n);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch namespaces: " + e.getMessage());
        }
        return namespaces;
    }

    public List<Map<String, Object>> getEnhancedPods() {
        List<Map<String, Object>> pods = new ArrayList<>();
        if (apiClient == null) {
            // fallback to DB if kubernetes isn't active
            for(PodEntity entity : podRepository.findAll()) {
                Map<String, Object> p = new HashMap<>();
                p.put("name", entity.getPodName());
                p.put("namespace", entity.getNamespace());
                p.put("status", entity.getPodStatus());
                p.put("node", entity.getNodeName());
                p.put("restartCount", 0);
                pods.add(p);
            }
            return pods;
        }
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            V1PodList podList = coreApi.listPodForAllNamespaces().execute();
            if (podList != null && podList.getItems() != null) {
                for (V1Pod p : podList.getItems()) {
                    Map<String, Object> pod = new HashMap<>();
                    pod.put("name", p.getMetadata() != null ? p.getMetadata().getName() : "");
                    pod.put("namespace", p.getMetadata() != null ? p.getMetadata().getNamespace() : "");
                    pod.put("status", p.getStatus() != null ? p.getStatus().getPhase() : "");
                    pod.put("node", p.getSpec() != null ? p.getSpec().getNodeName() : "");
                    pod.put("createdAt", p.getMetadata() != null && p.getMetadata().getCreationTimestamp() != null ? p.getMetadata().getCreationTimestamp().toString() : "");
                    
                    int restarts = 0;
                    if (p.getStatus() != null && p.getStatus().getContainerStatuses() != null) {
                        for (V1ContainerStatus cs : p.getStatus().getContainerStatuses()) {
                            if (cs.getRestartCount() != null) restarts += cs.getRestartCount();
                        }
                    }
                    pod.put("restartCount", restarts);
                    pods.add(pod);
                }
            }
        } catch (Exception e) {
             System.err.println("Failed to fetch enhanced pods: " + e.getMessage());
        }
        return pods;
    }

    public Map<String, Object> getPodDetails(String namespace, String name) {
        Map<String, Object> details = new HashMap<>();
        if (apiClient == null) return details;
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            V1Pod pod = coreApi.readNamespacedPod(name, namespace).execute();
            
            details.put("metadata", pod.getMetadata());
            details.put("status", pod.getStatus());
            details.put("spec", pod.getSpec());
            
            int restarts = 0;
            if (pod.getStatus() != null && pod.getStatus().getContainerStatuses() != null) {
                for (V1ContainerStatus cs : pod.getStatus().getContainerStatuses()) {
                    if (cs.getRestartCount() != null) restarts += cs.getRestartCount();
                }
            }
            details.put("restartCount", restarts);
            
            try {
                String logs = coreApi.readNamespacedPodLog(name, namespace).execute();
                details.put("logs", logs);
            } catch (Exception e) {
                details.put("logs", "Logs not available or pod has not started.");
            }
            
            try {
                CoreV1EventList events = coreApi.listNamespacedEvent(namespace).fieldSelector("involvedObject.name=" + name).execute();
                details.put("events", events.getItems());
            } catch (Exception e) {
                details.put("events", new ArrayList<>());
            }
            
        } catch (Exception e) {
            System.err.println("Failed to fetch pod details: " + e.getMessage());
        }
        return details;
    }

    public List<PodEntity> getAllPods() {
        if (apiClient != null) {
            try {
                CoreV1Api coreApi = new CoreV1Api(apiClient);
                V1PodList podList = coreApi.listPodForAllNamespaces().execute();
                if (podList != null && podList.getItems() != null && !podList.getItems().isEmpty()) {
                    List<PodEntity> livePods = new ArrayList<>();
                    long id = 1;
                    for (V1Pod p : podList.getItems()) {
                        String name = p.getMetadata() != null ? p.getMetadata().getName() : "pod-" + id;
                        String ns = p.getMetadata() != null ? p.getMetadata().getNamespace() : "default";
                        String node = p.getSpec() != null && p.getSpec().getNodeName() != null ? p.getSpec().getNodeName() : "unknown-node";
                        String phase = p.getStatus() != null && p.getStatus().getPhase() != null ? p.getStatus().getPhase() : "Unknown";

                        PodEntity pod = new PodEntity();
                        pod.setPodId(id++);
                        pod.setPodName(name);
                        pod.setNamespace(ns);
                        pod.setNodeName(node);
                        pod.setPodStatus(phase);
                        pod.setCpuUsage("100m");
                        pod.setMemoryUsage("128Mi");
                        livePods.add(pod);
                    }
                    return livePods;
                }
            } catch (Exception e) {
                System.err.println("Live Kubernetes call failed: " + e.getMessage());
            }
        }
        return podRepository.findAll();
    }
}
