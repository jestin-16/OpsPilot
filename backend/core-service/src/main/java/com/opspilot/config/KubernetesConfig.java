package com.opspilot.config;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.ClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class KubernetesConfig {

    private static final Logger log = LoggerFactory.getLogger(KubernetesConfig.class);

    @Value("${kubernetes.master-url:}")
    private String masterUrl;

    @Value("${kubernetes.loopback-host:}")
    private String loopbackHost;

    @Bean
    public ApiClient kubernetesApiClient() {
        ApiClient client;
        try {
            client = ClientBuilder.defaultClient();
        } catch (Exception ignored) {
            client = new ApiClient();
        }
        if (masterUrl != null && !masterUrl.isBlank()) {
            client.setBasePath(masterUrl);
        } else {
            String rewritten = rewriteLoopback(client.getBasePath(), loopbackHost);
            if (!rewritten.equals(client.getBasePath())) {
                log.info("Kubeconfig points at loopback ({}); using {} from inside the container", client.getBasePath(), rewritten);
                client.setBasePath(rewritten);
            }
        }
        Configuration.setDefaultApiClient(client);
        return client;
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
