package com.opspilot.service;

import com.opspilot.entity.PodEntity;
import com.opspilot.repository.PodRepository;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.V1Pod;
import io.kubernetes.client.openapi.models.V1PodList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class KubernetesService {

    @Autowired(required = false)
    private ApiClient apiClient;

    @Autowired
    private PodRepository podRepository;

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
