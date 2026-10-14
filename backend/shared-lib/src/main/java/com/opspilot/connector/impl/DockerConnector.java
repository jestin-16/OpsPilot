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

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
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
 * Docker Engine API over HTTP(S). Settings: host (http://host:2375, tcp:// is accepted), containers (comma separated
 * names or ids; empty = all running), insecureSkipTlsVerify. Secret: caCert (PEM). Unix sockets are not supported by the
 * JDK HttpClient; expose the engine through TCP or a socket proxy.
 */
@Component
public class DockerConnector implements IntegrationConnector {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    public ProviderType type() {
        return ProviderType.DOCKER;
    }

    @Override
    public ConnectionResult testConnection(ConnectorConfig config) {
        try {
            Api api = api(config);
            api.get("/_ping");
            JsonNode v = JSON.readTree(api.get("/version"));
            int running = JSON.readTree(api.get("/containers/json")).size();
            return ConnectionResult.success("Docker " + v.path("Version").asText("?") + " reachable, " + running + " running container(s)");
        } catch (Exception e) {
            return ConnectionResult.failure(describe(e));
        }
    }

    @Override
    public List<Map<String, Object>> discoverResources(ConnectorConfig config, String kind) {
        try {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Container c : listContainers(api(config))) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", c.id());
                m.put("name", c.name());
                m.put("image", c.image());
                m.put("state", c.state());
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
            for (Container c : targets(api, config, filters)) {
                String path = "/containers/" + c.id() + "/logs?stdout=1&stderr=1&timestamps=1&tail=" + tail
                        + (filters.getFrom() != null ? "&since=" + filters.getFrom().getEpochSecond() : "")
                        + (filters.getTo() != null ? "&until=" + (filters.getTo().getEpochSecond() + 1) : "");
                boolean tty = isTty(api, c.id());
                try (InputStream in = api.open(path)) {
                    DockerLogDecoder.decode(in, tty, (stream, line) -> {
                        LogEntry e = toEntry(config, c, stream, line);
                        if (filters.matches(e)) all.add(e);
                    }, () -> false);
                }
            }
            all.sort(Comparator.comparing(LogEntry::getTimestamp).reversed());
            int skip = Math.max(page, 0) * filters.getPageSize();
            return all.stream().skip(skip).limit(filters.getPageSize()).collect(Collectors.toList());
        } catch (Exception e) {
            throw new IllegalStateException(describe(e));
        }
    }

    @Override
    public Flux<LogEntry> streamLogs(ConnectorConfig config, LogFilters filters) {
        Api api;
        List<Container> targets;
        try {
            api = api(config);
            targets = targets(api, config, filters);
        } catch (Exception e) {
            return Flux.error(new IllegalStateException(describe(e)));
        }
        final Api client = api;
        List<Flux<LogEntry>> streams = new ArrayList<>();
        for (Container c : targets) {
            boolean tty;
            try {
                tty = isTty(client, c.id());
            } catch (Exception e) {
                return Flux.error(new IllegalStateException(describe(e)));
            }
            String path = "/containers/" + c.id() + "/logs?follow=1&stdout=1&stderr=1&timestamps=1&since=" + Instant.now().getEpochSecond();
            streams.add(ConnectorHttp.<LogEntry>fromStream(() -> client.open(path), (in, out, cancelled) ->
                    DockerLogDecoder.decode(in, tty, (stream, line) -> {
                        LogEntry e = toEntry(config, c, stream, line);
                        if (filters.matches(e)) out.accept(e);
                    }, cancelled)));
        }
        return Flux.merge(streams);
    }

    // ---- helpers ----

    private LogEntry toEntry(ConnectorConfig config, Container c, String stream, String rawLine) {
        TimestampedLine tl = TimestampedLine.parse(rawLine);
        Map<String, String> meta = new LinkedHashMap<>();
        meta.put("container", c.name());
        meta.put("containerId", c.id().substring(0, Math.min(12, c.id().length())));
        meta.put("image", c.image());
        meta.put("stream", stream);
        return LogEntry.of(ProviderType.DOCKER, Levels.detect(tl.message()), tl.message(), tl.timestamp(), meta)
                .owned(config.projectId(), config.integrationId());
    }

    private List<Container> targets(Api api, ConnectorConfig config, LogFilters filters) throws IOException {
        String wanted = filters.selector("container") != null ? filters.selector("container") : config.setting("containers");
        List<Container> running = listContainers(api);
        if (wanted == null) {
            return running;
        }
        Set<String> names = Arrays.stream(wanted.split(",")).map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
        return running.stream()
                .filter(c -> names.contains(c.name()) || names.stream().anyMatch(n -> c.id().startsWith(n)))
                .collect(Collectors.toList());
    }

    private List<Container> listContainers(Api api) throws IOException {
        List<Container> out = new ArrayList<>();
        for (JsonNode n : JSON.readTree(api.get("/containers/json"))) {
            String name = n.path("Names").path(0).asText(n.path("Id").asText().substring(0, 12));
            out.add(new Container(n.path("Id").asText(), name.startsWith("/") ? name.substring(1) : name,
                    n.path("Image").asText(""), n.path("State").asText("")));
        }
        return out;
    }

    private boolean isTty(Api api, String id) throws IOException {
        return JSON.readTree(api.get("/containers/" + id + "/json")).path("Config").path("Tty").asBoolean(false);
    }

    private Api api(ConnectorConfig config) {
        String host = config.setting("host");
        if (host == null) {
            throw new IllegalArgumentException("Docker host is required (e.g. http://10.0.0.5:2375)");
        }
        if (host.startsWith("tcp://")) {
            host = "http://" + host.substring("tcp://".length());
        }
        if (host.startsWith("unix://") || host.startsWith("npipe://")) {
            throw new IllegalArgumentException("Unix sockets are not supported; expose the Docker API over TCP or a socket proxy");
        }
        URI base = ConnectorHttp.validate(host);
        boolean insecure = "true".equalsIgnoreCase(config.setting("insecureSkipTlsVerify"));
        return new Api(ConnectorHttp.client(insecure, config.secret("caCert")), base);
    }

    private static String describe(Exception e) {
        if (e instanceof ConnectorHttp.HttpStatusException h) {
            return h.status() == 401 || h.status() == 403 ? "Docker API rejected the request (HTTP " + h.status() + ")" : h.getMessage();
        }
        if (e instanceof IllegalArgumentException || e instanceof IllegalStateException) {
            return e.getMessage();
        }
        return "Cannot reach Docker API: " + e.getClass().getSimpleName();
    }

    private record Container(String id, String name, String image, String state) { }

    private record Api(HttpClient client, URI base) {
        String get(String path) throws IOException {
            return ConnectorHttp.get(client, base.resolve(path), Map.of("Accept", "application/json"));
        }

        InputStream open(String path) throws IOException {
            return ConnectorHttp.open(client, base.resolve(path), Map.of());
        }
    }
}
