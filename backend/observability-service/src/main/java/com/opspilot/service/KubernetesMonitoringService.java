package com.opspilot.service;

import com.opspilot.dto.KubernetesSummaryResponse;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.V1Node;
import io.kubernetes.client.openapi.models.V1NodeList;
import io.kubernetes.client.openapi.models.V1Pod;
import io.kubernetes.client.openapi.models.V1PodList;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KubernetesMonitoringService {
    private final CoreV1Api coreApi;
    private final boolean enabled;

    public KubernetesMonitoringService(ApiClient apiClient,
                                       @Value("${monitoring.kubernetes.enabled:true}") boolean enabled) {
        this.coreApi = new CoreV1Api(apiClient);
        this.enabled = enabled;
    }

    public KubernetesSummaryResponse getSummary() {
        if (!enabled) return unavailable("Kubernetes integration is disabled");
        try {
            V1NodeList nodes = coreApi.listNode().execute();
            V1PodList pods = coreApi.listPodForAllNamespaces().execute();
            List<V1Node> nodeItems = nodes.getItems() == null ? List.of() : nodes.getItems();
            List<V1Pod> podItems = pods.getItems() == null ? List.of() : pods.getItems();

            int healthyNodes = (int) nodeItems.stream().filter(this::isReady).count();
            int running = (int) podItems.stream().filter(p -> "Running".equals(p.getStatus().getPhase())).count();
            int pending = (int) podItems.stream().filter(p -> "Pending".equals(p.getStatus().getPhase())).count();
            int failed = (int) podItems.stream().filter(p -> "Failed".equals(p.getStatus().getPhase())).count();
            List<KubernetesSummaryResponse.PodSummary> summaries = podItems.stream().map(this::toSummary).toList();
            return new KubernetesSummaryResponse("AVAILABLE", null, nodeItems.size(), healthyNodes,
                    podItems.size(), running, pending, failed, summaries);
        } catch (Exception error) {
            return unavailable(error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage());
        }
    }

    public boolean isAvailable() {
        return "AVAILABLE".equals(getSummary().status());
    }

    private boolean isReady(V1Node node) {
        return node.getStatus() != null && node.getStatus().getConditions() != null
                && node.getStatus().getConditions().stream().anyMatch(condition ->
                "Ready".equals(condition.getType()) && "True".equals(condition.getStatus()));
    }

    private KubernetesSummaryResponse.PodSummary toSummary(V1Pod pod) {
        int restarts = pod.getStatus() == null || pod.getStatus().getContainerStatuses() == null ? 0
                : pod.getStatus().getContainerStatuses().stream().mapToInt(status -> status.getRestartCount() == null ? 0 : status.getRestartCount()).sum();
        boolean ready = pod.getStatus() != null && pod.getStatus().getContainerStatuses() != null
                && !pod.getStatus().getContainerStatuses().isEmpty()
                && pod.getStatus().getContainerStatuses().stream().allMatch(status -> Boolean.TRUE.equals(status.getReady()));
        return new KubernetesSummaryResponse.PodSummary(pod.getMetadata().getName(), pod.getMetadata().getNamespace(),
                pod.getStatus() == null ? "Unknown" : pod.getStatus().getPhase(),
                pod.getSpec() == null ? null : pod.getSpec().getNodeName(), restarts, ready);
    }

    private KubernetesSummaryResponse unavailable(String error) {
        return new KubernetesSummaryResponse("UNAVAILABLE", error, 0, 0, 0, 0, 0, 0, List.of());
    }
}