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

    @Value("${kubernetes.enabled:false}")
    private boolean enabled;

    @Value("${kubernetes.master-url:}")
    private String masterUrl;

    @Value("${kubernetes.loopback-host:}")
    private String loopbackHost;

    @Bean
    @ConditionalOnMissingBean
    public ApiClient kubernetesApiClient() {
        if (!enabled) {
            log.info("Kubernetes integration is disabled in log-watcher-service.");
            ApiClient client = new ApiClient();
            client.setBasePath("unconfigured://kubernetes");
            Configuration.setDefaultApiClient(client);
            return client;
        }

        ApiClient client;
        File serviceAccountDir = new File("/var/run/secrets/kubernetes.io/serviceaccount");

        boolean configured = false;
        try {
            if (serviceAccountDir.exists()) {
                log.info("Detected in-cluster Kubernetes environment: using ServiceAccount credentials from {}", serviceAccountDir.getAbsolutePath());
                client = ClientBuilder.cluster().build();
                configured = true;
            } else {
                String kubeConfigPath = System.getenv("KUBECONFIG");
                if (kubeConfigPath == null || kubeConfigPath.isBlank()) {
                    kubeConfigPath = System.getProperty("user.home") + File.separator + ".kube" + File.separator + "config";
                }
                File kubeConfigFile = new File(kubeConfigPath);
                if (kubeConfigFile.exists()) {
                    log.info("Detected local Kubernetes environment: using kubeconfig at {}", kubeConfigFile.getAbsolutePath());
                    client = ClientBuilder.kubeconfig(io.kubernetes.client.util.KubeConfig.loadKubeConfig(new java.io.FileReader(kubeConfigFile))).build();
                    configured = true;
                } else {
                    log.info("Neither in-cluster ServiceAccount nor local kubeconfig found at {}. Using unconfigured fallback client.", kubeConfigFile.getAbsolutePath());
                    client = new ApiClient();
                }
            }
        } catch (Exception e) {
            log.warn("Auto-detection failed ({}), using unconfigured fallback client.", e.getMessage());
            client = new ApiClient();
        }

        if (masterUrl != null && !masterUrl.isBlank()) {
            log.info("Overriding Kubernetes master URL with: {}", masterUrl);
            client.setBasePath(masterUrl);
        } else if (configured) {
            String rewritten = rewriteLoopback(client.getBasePath(), loopbackHost);
            if (!rewritten.equals(client.getBasePath())) {
                log.info("Kubeconfig points at loopback ({}); using {} from inside the container", client.getBasePath(), rewritten);
                client.setBasePath(rewritten);
            }
        } else {
            log.info("No Kubernetes cluster configured in log-watcher-service.");
            client.setBasePath("unconfigured://kubernetes");
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

    /**
     * A kubeconfig written for the host (k3s, Docker Desktop, kind) points at 127.0.0.1, which inside a container is the
     * container itself. When kubernetes.loopback-host is set, a loopback API server address is pointed at that host
     * instead (docker-compose maps "kubernetes" to the host gateway). "kubernetes" is in the API server certificate, so
     * TLS verification stays on. Non-loopback addresses are never changed.
     */
    static String rewriteLoopback(String basePath, String replacementHost) {
        if (basePath == null || replacementHost == null || replacementHost.isBlank()) {
            return basePath;
        }
        try {
            java.net.URI uri = java.net.URI.create(basePath);
            String host = uri.getHost();
            if (host == null) {
                return basePath;
            }
            String h = host.replace("[", "").replace("]", "");
            if (!(h.equals("127.0.0.1") || h.equalsIgnoreCase("localhost") || h.equals("::1") || h.equals("0:0:0:0:0:0:0:1"))) {
                return basePath;
            }
            return new java.net.URI(uri.getScheme(), uri.getUserInfo(), replacementHost.trim(), uri.getPort(),
                    uri.getPath(), uri.getQuery(), uri.getFragment()).toString();
        } catch (IllegalArgumentException | java.net.URISyntaxException e) {
            return basePath;
        }
    }
}
