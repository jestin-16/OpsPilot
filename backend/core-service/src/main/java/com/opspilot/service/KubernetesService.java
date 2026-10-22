package com.opspilot.service;

import com.opspilot.entity.PodEntity;
import io.kubernetes.client.custom.Quantity;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.apis.CustomObjectsApi;
import io.kubernetes.client.openapi.models.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class KubernetesService {

    private static final Logger log = LoggerFactory.getLogger(KubernetesService.class);

    @Autowired(required = false)
    private ApiClient apiClient;


    public Map<String, Object> getClusterOverview() {
        Map<String, Object> overview = new HashMap<>();
        overview.put("status", "Disconnected");
        overview.put("nodeCount", 0);
        overview.put("podCount", 0);
        overview.put("runningPods", 0);
        overview.put("failedPods", 0);

        if (apiClient == null) {
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
            log.warn("Failed to reach Kubernetes cluster for overview: {}", e.getMessage());
            overview.put("status", "Disconnected");
            overview.put("nodeCount", 0);
            overview.put("podCount", 0);
            overview.put("runningPods", 0);
            overview.put("failedPods", 0);
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
            // No cluster connected: there are no pods to show (getClusterOverview reports "Disconnected").
            return pods;
        }
        try {
            CoreV1Api coreApi = new CoreV1Api(apiClient);
            V1PodList podList = coreApi.listPodForAllNamespaces().execute();
            if (podList != null && podList.getItems() != null) {
                Map<String, String[]> metrics = fetchPodMetricsList();
                for (V1Pod p : podList.getItems()) {
                    Map<String, Object> pod = new HashMap<>();
                    String name = p.getMetadata() != null ? p.getMetadata().getName() : "";
                    String ns = p.getMetadata() != null ? p.getMetadata().getNamespace() : "";
                    pod.put("name", name);
                    pod.put("namespace", ns);
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

                    String[] m = metrics.get(ns + "/" + name);
                    pod.put("cpuUsage", m != null ? m[0] : null);
                    pod.put("memoryUsage", m != null ? m[1] : null);
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

            String[] podMetrics = null;
            try {
                CustomObjectsApi customApi = new CustomObjectsApi(apiClient);
                Object raw = customApi.getNamespacedCustomObject("metrics.k8s.io", "v1beta1", namespace, "pods", name).execute();
                if (raw instanceof Map<?, ?> item) {
                    podMetrics = extractPodMetricsFromItem(item);
                }
            } catch (Exception ignored) {
                // Pod metrics not available for single pod
            }
            details.put("cpuUsage", podMetrics != null ? podMetrics[0] : null);
            details.put("memoryUsage", podMetrics != null ? podMetrics[1] : null);
            
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
                if (podList != null && podList.getItems() != null) {
                    Map<String, String[]> metrics = fetchPodMetricsList();
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

                        String[] m = metrics.get(ns + "/" + name);
                        pod.setCpuUsage(m != null ? m[0] : null);
                        pod.setMemoryUsage(m != null ? m[1] : null);
                        livePods.add(pod);
                    }
                    return livePods;
                }
            } catch (Exception e) {
                System.err.println("Live Kubernetes call failed: " + e.getMessage());
            }
        }
        return List.of(); // disconnected or failed: no pods rather than stored placeholders
    }

    String[] extractPodMetricsFromItem(Map<?, ?> item) {
        Object containersObj = item.get("containers");
        if (!(containersObj instanceof List<?> containers)) return null;

        BigDecimal totalCores = BigDecimal.ZERO;
        long totalMemBytes = 0;
        boolean hasCpu = false;
        boolean hasMem = false;

        for (Object cObj : containers) {
            if (!(cObj instanceof Map<?, ?> c)) continue;
            Object usageObj = c.get("usage");
            if (!(usageObj instanceof Map<?, ?> usage)) continue;

            Object cpu = usage.get("cpu");
            if (cpu != null) {
                try {
                    Quantity q = Quantity.fromString(String.valueOf(cpu));
                    totalCores = totalCores.add(q.getNumber());
                    hasCpu = true;
                } catch (Exception ignored) {}
            }

            Object mem = usage.get("memory");
            if (mem != null) {
                try {
                    Quantity q = Quantity.fromString(String.valueOf(mem));
                    totalMemBytes += q.getNumber().longValue();
                    hasMem = true;
                } catch (Exception ignored) {}
            }
        }

        String cpuFormatted = null;
        if (hasCpu) {
            long millicores = totalCores.multiply(BigDecimal.valueOf(1000L)).setScale(0, RoundingMode.HALF_UP).longValue();
            cpuFormatted = millicores + "m";
        }

        String memFormatted = null;
        if (hasMem) {
            if (totalMemBytes >= 1024L * 1024 * 1024) {
                memFormatted = String.format(Locale.ROOT, "%.1fGi", (double) totalMemBytes / (1024.0 * 1024.0 * 1024.0));
            } else if (totalMemBytes >= 1024L * 1024) {
                memFormatted = (totalMemBytes / (1024L * 1024L)) + "Mi";
            } else {
                memFormatted = (totalMemBytes / 1024L) + "Ki";
            }
        }

        if (cpuFormatted == null && memFormatted == null) return null;
        return new String[]{cpuFormatted, memFormatted};
    }

    Map<String, String[]> parsePodMetricsList(Object rawMetrics) {
        if (!(rawMetrics instanceof Map<?, ?> map)) return Collections.emptyMap();
        Object itemsObj = map.get("items");
        if (!(itemsObj instanceof List<?> items)) return Collections.emptyMap();

        Map<String, String[]> result = new HashMap<>();
        for (Object itemObj : items) {
            if (!(itemObj instanceof Map<?, ?> item)) continue;
            Object metaObj = item.get("metadata");
            if (!(metaObj instanceof Map<?, ?> meta)) continue;
            String name = String.valueOf(meta.get("name"));
            String ns = meta.get("namespace") != null ? String.valueOf(meta.get("namespace")) : "default";
            String[] metrics = extractPodMetricsFromItem(item);
            if (metrics != null) {
                result.put(ns + "/" + name, metrics);
            }
        }
        return result;
    }

    Map<String, String[]> fetchPodMetricsList() {
        if (apiClient == null) return Collections.emptyMap();
        try {
            CustomObjectsApi customApi = new CustomObjectsApi(apiClient);
            Object raw = customApi.listClusterCustomObject("metrics.k8s.io", "v1beta1", "pods").execute();
            return parsePodMetricsList(raw);
        } catch (Exception e) {
            // Metrics API unavailable or metrics-server not deployed; fail gracefully
            return Collections.emptyMap();
        }
    }
}
