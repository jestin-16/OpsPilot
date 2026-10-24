package com.opspilot.config;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.ClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

import java.io.File;

@org.springframework.context.annotation.Configuration
public class KubernetesClientConfig {

    private static final Logger log = LoggerFactory.getLogger(KubernetesClientConfig.class);

    @Value("${monitoring.kubernetes.enabled:${kubernetes.enabled:true}}")
    private boolean enabled;

    @Value("${kubernetes.master-url:}")
    private String masterUrl;

    @Value("${kubernetes.loopback-host:}")
    private String loopbackHost;

    @Bean
    ApiClient kubernetesApiClient() {
        if (!enabled) {
            log.info("Kubernetes monitoring is disabled via configuration.");
            ApiClient client = new ApiClient();
            client.setBasePath("unconfigured://kubernetes");
            Configuration.setDefaultApiClient(client);
            return client;
        }

        ApiClient client = null;
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
                if (kubeConfigFile.exists() && kubeConfigFile.length() > 0) {
                    log.info("Detected local Kubernetes environment: using kubeconfig at {}", kubeConfigFile.getAbsolutePath());
                    client = ClientBuilder.kubeconfig(io.kubernetes.client.util.KubeConfig.loadKubeConfig(new java.io.FileReader(kubeConfigFile))).build();
                } else {
                    log.info("Neither in-cluster ServiceAccount nor local kubeconfig found at {}.", kubeConfigFile.getAbsolutePath());
                }
            }
        } catch (Exception e) {
            log.warn("Kubernetes client configuration failed: {}", e.getMessage());
        }

        if (masterUrl != null && !masterUrl.isBlank()) {
            if (client == null) {
                client = new ApiClient();
            }
            log.info("Configuring Kubernetes master URL: {}", masterUrl);
            client.setBasePath(masterUrl);
        } else if (client != null) {
            String rewritten = rewriteLoopback(client.getBasePath(), loopbackHost);
            if (!rewritten.equals(client.getBasePath())) {
                log.info("Kubeconfig points at loopback ({}); using {} from inside the container", client.getBasePath(), rewritten);
                client.setBasePath(rewritten);
            }
        }

        if (client == null) {
            client = new ApiClient();
            client.setBasePath("unconfigured://kubernetes");
        }

        Configuration.setDefaultApiClient(client);
        return client;
    }

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