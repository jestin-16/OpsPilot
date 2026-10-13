package com.opspilot.logwatcher.config;

import io.fabric8.kubernetes.client.Config;
import io.fabric8.kubernetes.client.ConfigBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;

@Configuration
public class KubernetesClientConfig {

    private static final Logger log = LoggerFactory.getLogger(KubernetesClientConfig.class);

    @Value("${kubernetes.master-url:}")
    private String masterUrl;

    @Bean
    @ConditionalOnMissingBean
    public KubernetesClient kubernetesClient() {
        Config config;
        File serviceAccountDir = new File("/var/run/secrets/kubernetes.io/serviceaccount");

        if (serviceAccountDir.exists()) {
            log.info("Detected in-cluster Kubernetes environment: using ServiceAccount credentials from {}", serviceAccountDir.getAbsolutePath());
            config = Config.autoConfigure(null);
        } else {
            String kubeConfigPath = System.getenv("KUBECONFIG");
            if (kubeConfigPath == null || kubeConfigPath.isBlank()) {
                kubeConfigPath = System.getProperty("user.home") + File.separator + ".kube" + File.separator + "config";
            }

            File kubeConfigFile = new File(kubeConfigPath);
            if (kubeConfigFile.exists()) {
                log.info("Detected local Kubernetes environment: using kubeconfig at {}", kubeConfigFile.getAbsolutePath());
                config = Config.autoConfigure(null);
            } else {
                log.warn("Neither in-cluster ServiceAccount nor local kubeconfig found at {}. Using default/auto configuration.", kubeConfigFile.getAbsolutePath());
                config = Config.autoConfigure(null);
            }
        }

        if (masterUrl != null && !masterUrl.isBlank()) {
            log.info("Overriding Kubernetes master URL with: {}", masterUrl);
            config = new ConfigBuilder(config)
                    .withMasterUrl(masterUrl)
                    .build();
        }

        return new KubernetesClientBuilder()
                .withConfig(config)
                .build();
    }
}
