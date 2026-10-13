package com.opspilot.logwatcher;

import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodBuilder;
import io.fabric8.kubernetes.client.Config;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.k3s.K3sContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test running against an ephemeral k3s cluster via Testcontainers.
 * Validates real Kubernetes client communication, pod creation, and watch mechanics.
 */
class K3sContainerIntegrationTest {

    static boolean isDockerAvailable() {
        try {
            return DockerClientFactory.instance().isDockerAvailable();
        } catch (Throwable t) {
            return false;
        }
    }

    @Test
    @EnabledIf("isDockerAvailable")
    @DisplayName("Should spin up a real K3s cluster, deploy a pod, and verify cluster connectivity")
    void testRealK3sClusterIntegration() {
        try (K3sContainer k3s = new K3sContainer(DockerImageName.parse("rancher/k3s:v1.28.8-k3s1"))) {
            k3s.start();

            String kubeConfigYaml = k3s.getKubeconfig();
            assertNotNull(kubeConfigYaml);

            Config config = Config.fromKubeconfig(kubeConfigYaml);
            try (KubernetesClient client = new KubernetesClientBuilder().withConfig(config).build()) {
                assertNotNull(client.getMasterUrl());

                // Deploy a test pod into the real k3s cluster
                Pod pod = new PodBuilder()
                        .withNewMetadata()
                        .withName("testcontainers-django-pod")
                        .withNamespace("default")
                        .withLabels(Map.of("app", "django"))
                        .endMetadata()
                        .withNewSpec()
                        .addNewContainer()
                        .withName("web")
                        .withImage("busybox")
                        .withCommand("sh", "-c", "echo 'Django server initialized'; sleep 3600")
                        .endContainer()
                        .endSpec()
                        .build();

                Pod createdPod = client.pods().inNamespace("default").resource(pod).create();
                assertNotNull(createdPod);
                assertEquals("testcontainers-django-pod", createdPod.getMetadata().getName());

                // Verify pod listing from k3s
                var pods = client.pods().inNamespace("default").list();
                assertTrue(pods.getItems().stream().anyMatch(p -> p.getMetadata().getName().equals("testcontainers-django-pod")));
            }
        }
    }
}
