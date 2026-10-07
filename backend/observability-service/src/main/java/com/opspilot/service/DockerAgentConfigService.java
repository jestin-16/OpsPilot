package com.opspilot.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DockerAgentConfigService {

    private final String publicUrl;

    public DockerAgentConfigService(@Value("${OPSPILOT_PUBLIC_URL:http://localhost:8080}") String publicUrl) {
        this.publicUrl = publicUrl;
    }

    public String renderAlloyConfig(String token) {
        return """
            discovery.docker "containers" {
                host = "unix:///var/run/docker.sock"
            }
            
            discovery.relabel "logs_relabel" {
                targets = discovery.docker.containers.targets
                rule {
                    source_labels = ["__meta_docker_container_name"]
                    regex = "/(.*)"
                    target_label = "container"
                }
            }
            
            loki.source.docker "docker_logs" {
                host = "unix:///var/run/docker.sock"
                targets = discovery.relabel.logs_relabel.output
                forward_to = [loki.write.opspilot.receiver]
            }
            
            loki.write "opspilot" {
                endpoint {
                    url = "%s/api/v1/ingest/loki/push"
                    bearer_token = "%s"
                }
            }
            
            prometheus.scrape "cadvisor" {
                targets = [{"__address__" = "cadvisor:8080"}]
                forward_to = [prometheus.remote_write.opspilot.receiver]
                scrape_interval = "15s"
            }
            
            prometheus.remote_write "opspilot" {
                endpoint {
                    url = "%s/api/v1/ingest/metrics/push"
                    bearer_token = "%s"
                }
            }
            """.formatted(publicUrl, token, publicUrl, token);
    }

    public String renderDockerComposeSnippet() {
        return """
            services:
              alloy:
                image: grafana/alloy:latest
                volumes:
                  - /var/run/docker.sock:/var/run/docker.sock
                  - ./config.alloy:/etc/alloy/config.alloy
                command: run --server.http.listen-addr=0.0.0.0:12345 /etc/alloy/config.alloy
              cadvisor:
                image: gcr.io/cadvisor/cadvisor:latest
                volumes:
                  - /:/rootfs:ro
                  - /var/run:/var/run:ro
                  - /sys:/sys:ro
                  - /var/lib/docker/:/var/lib/docker:ro
                  - /dev/disk/:/dev/disk:ro
                devices:
                  - /dev/kmsg
            """;
    }
}
