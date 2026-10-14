package com.opspilot.connector.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.IntegrationConnector;
import com.opspilot.connector.Levels;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.enums.ProviderType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Kubernetes API over HTTPS with a bearer token. Settings: apiServer, namespace (default "default"), podName
 * (comma separated), labelSelector, container, insecureSkipTlsVerify. Secrets: token, caCert (PEM). With no apiServer
 * the in-cluster service account is used. The filter selectors namespace / pod / container override the settings.
 */
@Component
public class KubernetesConnector implements IntegrationConnector {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final int MAX_STREAMS = 20;
    private static final Path SA_DIR = Path.of("/var/run/secrets/kubernetes.io/serviceaccount");

    @Override
    public ProviderType type() {
        return ProviderType.KUBERNETES;
    }

    @Override
    public ConnectionResult testConnection(ConnectorConfig config) {
        try {
            Api api = api(config);
            JsonNode version = JSON.readTree(api.get("/version"));
            String ns = config.setting("namespace", "default");
            int pods = JSON.readTree(api.get("/api/v1/namespaces/" + enc(ns) + "/pods?limit=100")).path("items").size();
            return ConnectionResult.success("Kubernetes " + version.path("gitVersion").asText("?") + " reachable, namespace '" + ns + "' has " + pods + " pod(s)");
        } catch (Exception e) {
            return ConnectionResult.failure(describe(e));
        }
    }

    @Override
    public List<Map<String, Object>> discoverResources(ConnectorConfig config, String kind) {
        try {
            Api api = api(config);
            List<Map<String, Object>> out = new ArrayList<>();
            if ("namespaces".equalsIgnoreCase(kind)) {
                for (JsonNode n : JSON.readTree(api.get("/api/v1/namespaces")).path("items")) {
                    out.add(new LinkedHashMap<>(Map.of("name", n.path("metadata").path("name").asText())));
                }
                return out;
            }
            for (Target t : targets(api, config, LogFilters.none(), false)) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("namespace", t.namespace());
                m.put("name", t.pod());
                m.put("container", t.container());
                m.put("phase", t.phase());
                out.add(m);
            }
            return out;
        } catch (Exception e) {
            throw new IllegalStateException(describe(e));
        }
    }

    @Override
    public List<LogEntry> fetchHistory(ConnectorConfig config, LogFilters filters, int page) {
        try {
            Api api = api(config);
            int tail = filters.getPageSize() * (Math.max(page, 0) + 1);
            List<LogEntry> all = new ArrayList<>();
            for (Target t : targets(api, config, filters, false)) {
                String path = logPath(t) + "&tailLines=" + tail
                        + (filters.getFrom() != null ? "&sinceTime=" + filters.getFrom() : "");
                try (InputStream in = api.open(path); BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = r.readLine()) != null) {
                        LogEntry e = toEntry(config, t, line);
                        if (filters.matches(e)) all.add(e);
                    }
                }
            }
            all.sort(Comparator.comparing(LogEntry::getTimestamp).reversed());
            return all.stream().skip((long) Math.max(page, 0) * filters.getPageSize()).limit(filters.getPageSize()).collect(Collectors.toList());
        } catch (Exception e) {
            throw new IllegalStateException(describe(e));
        }
    }

    @Override
    public Flux<LogEntry> streamLogs(ConnectorConfig config, LogFilters filters) {
        Api api;
        List<Target> targets;
        try {
            api = api(config);
            targets = targets(api, config, filters, true);
        } catch (Exception e) {
            return Flux.error(new IllegalStateException(describe(e)));
        }
        final Api client = api;
        final String since = Instant.now().toString();
        List<Flux<LogEntry>> streams = new ArrayList<>();
        for (Target t : targets) {
            String path = logPath(t) + "&follow=true&sinceTime=" + since;
            streams.add(ConnectorHttp.<LogEntry>fromStream(() -> client.open(path), (in, out, cancelled) -> {
                BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
                String line;
                while (!cancelled.getAsBoolean() && (line = r.readLine()) != null) {
                    LogEntry e = toEntry(config, t, line);
                    if (filters.matches(e)) out.accept(e);
                }
            }));
        }
        return Flux.merge(streams);
    }

    // ---- helpers ----

    private static String logPath(Target t) {
        return "/api/v1/namespaces/" + enc(t.namespace()) + "/pods/" + enc(t.pod()) + "/log?timestamps=true&container=" + enc(t.container());
    }

    private LogEntry toEntry(ConnectorConfig config, Target t, String rawLine) {
        TimestampedLine tl = TimestampedLine.parse(rawLine);
        Map<String, String> meta = new LinkedHashMap<>();
        meta.put("namespace", t.namespace());
        meta.put("pod", t.pod());
        meta.put("container", t.container());
        return LogEntry.of(ProviderType.KUBERNETES, Levels.detect(tl.message()), tl.message(), tl.timestamp(), meta)
                .owned(config.projectId(), config.integrationId());
    }

    private List<Target> targets(Api api, ConnectorConfig config, LogFilters filters, boolean runningOnly) throws IOException {
        String ns = filters.selector("namespace") != null ? filters.selector("namespace") : config.setting("namespace", "default");
        String podSetting = filters.selector("pod") != null ? filters.selector("pod") : config.setting("podName");
        String containerWanted = filters.selector("container") != null ? filters.selector("container") : config.setting("container");
        String selector = config.setting("labelSelector");
        Set<String> pods = podSetting == null ? Set.of()
                : Arrays.stream(podSetting.split(",")).map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toSet());

        String path = "/api/v1/namespaces/" + enc(ns) + "/pods" + (selector != null ? "?labelSelector=" + enc(selector) : "");
        List<Target> out = new ArrayList<>();
        for (JsonNode pod : JSON.readTree(api.get(path)).path("items")) {
            String name = pod.path("metadata").path("name").asText();
            String phase = pod.path("status").path("phase").asText("");
            if (!pods.isEmpty() && !pods.contains(name)) continue;
            if (phase.equals("Pending") || (runningOnly && !phase.equals("Running"))) continue;
            for (JsonNode c : pod.path("spec").path("containers")) {
                String cn = c.path("name").asText();
                if (containerWanted == null || containerWanted.equals(cn)) {
                    out.add(new Target(ns, name, cn, phase));
                }
            }
        }
        return out.size() > MAX_STREAMS && runningOnly ? out.subList(0, MAX_STREAMS) : out;
    }

    private Api api(ConnectorConfig config) throws IOException {
        String server = config.setting("apiServer");
        String token = config.secret("token");
        String ca = config.secret("caCert");
        String envHost = System.getenv("KUBERNETES_SERVICE_HOST");
        if (server == null && envHost != null && Files.exists(SA_DIR.resolve("token"))) {
            server = "https://" + envHost + ":" + System.getenv().getOrDefault("KUBERNETES_SERVICE_PORT", "443");
            token = Files.readString(SA_DIR.resolve("token")).trim();
            if (ca == null && Files.exists(SA_DIR.resolve("ca.crt"))) {
                ca = Files.readString(SA_DIR.resolve("ca.crt"));
            }
        }
        if (server == null) {
            throw new IllegalArgumentException("Kubernetes API server URL is required (e.g. https://10.0.0.1:6443)");
        }
        if (token == null) {
            throw new IllegalArgumentException("A service-account bearer token is required");
        }
        URI base = ConnectorHttp.validate(server);
        boolean insecure = "true".equalsIgnoreCase(config.setting("insecureSkipTlsVerify"));
        return new Api(ConnectorHttp.client(insecure, ca), base, Map.of("Authorization", "Bearer " + token, "Accept", "application/json"));
    }

    private static String describe(Exception e) {
        if (e instanceof ConnectorHttp.HttpStatusException h) {
            return h.status() == 401 || h.status() == 403
                    ? "Kubernetes rejected the token (HTTP " + h.status() + "); check the service account's RBAC"
                    : h.getMessage();
        }
        if (e instanceof IllegalArgumentException || e instanceof IllegalStateException) {
            return e.getMessage();
        }
        return "Cannot reach Kubernetes API: " + e.getClass().getSimpleName();
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private record Target(String namespace, String pod, String container, String phase) { }

    private record Api(HttpClient client, URI base, Map<String, String> headers) {
        String get(String path) throws IOException {
            return ConnectorHttp.get(client, base.resolve(path), headers);
        }

        InputStream open(String path) throws IOException {
            return ConnectorHttp.open(client, base.resolve(path), headers);
        }
    }
}
