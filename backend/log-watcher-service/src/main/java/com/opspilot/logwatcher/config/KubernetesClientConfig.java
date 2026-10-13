package com.opspilot.logwatcher.config;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.PodLogs;
import io.kubernetes.client.util.ClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

import java.io.File;

@org.springframework.context.annotation.Configuration
public class KubernetesClientConfig {

    private static final Logger log = LoggerFactory.getLogger(KubernetesClientConfig.class);

    @Value("${kubernetes.master-url:}")
    private String masterUrl;

    @Bean
    @ConditionalOnMissingBean
    public ApiClient kubernetesApiClient() {
        ApiClient client;
        File serviceAccountDir = new File("/var/run/secrets/kubernetes.io/serviceaccount");

        try {
            if (serviceAccountDir.exists()) {
                log.info("Detected in-cluster Kubernetes environment: using ServiceAccount credentials from {}", serviceAccountDir.getAbsolutePath());
                client = ClientBuilder.cluster().build();
            } else {
                String kubeConfigPath = System.getenv("KUBECONFIG");
                if (kubeConfigPath == null || kubeConfigPath.isBlank()) {
                    kubeConfigPath = System.getProperty("user.home") + File.separator + ".kube" + File.separator + "config";
                }
                File kubeConfigFile = new File(kubeConfigPath);
                if (kubeConfigFile.exists()) {
                    log.info("Detected local Kubernetes environment: using kubeconfig at {}", kubeConfigFile.getAbsolutePath());
                    client = ClientBuilder.kubeconfig(io.kubernetes.client.util.KubeConfig.loadKubeConfig(new java.io.FileReader(kubeConfigFile))).build();
                } else {
                    log.warn("Neither in-cluster ServiceAccount nor local kubeconfig found at {}. Using default fallback client.", kubeConfigFile.getAbsolutePath());
                    client = ClientBuilder.defaultClient();
                }
            }
        } catch (Exception e) {
            log.warn("Auto-detection failed ({}), falling back to standard client builder.", e.getMessage());
            try {
                client = ClientBuilder.defaultClient();
            } catch (Exception ex) {
                client = new ApiClient();
            }
        }

        if (masterUrl != null && !masterUrl.isBlank()) {
            log.info("Overriding Kubernetes master URL with: {}", masterUrl);
            client.setBasePath(masterUrl);
        }

        // Set default timeout and verify configuration
        Configuration.setDefaultApiClient(client);
        return client;
    }

    @Bean
    @ConditionalOnMissingBean
    public CoreV1Api coreV1Api(ApiClient apiClient) {
        return new CoreV1Api(apiClient);
    }

    @Bean
    @ConditionalOnMissingBean
    public PodLogs podLogs(ApiClient apiClient) {
        return new PodLogs(apiClient);
    }
}
