package com.opspilot.logwatcher.service;

import com.google.gson.reflect.TypeToken;
import com.opspilot.logwatcher.model.PodSummaryDto;
import com.opspilot.logwatcher.model.WatcherStatusDto;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.*;
import io.kubernetes.client.util.Watch;
import okhttp3.Call;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.time.Instant;

@Service
public class KubernetesPodWatcher {

    private static final Logger log = LoggerFactory.getLogger(KubernetesPodWatcher.class);

    private final ApiClient apiClient;
    private final CoreV1Api coreV1Api;
    private final KubernetesLogStreamer logStreamer;
    private final MetricsService metricsService;

    private final boolean enabled;
    private final String watchNamespace;
    private final String watchLabelSelector;
    private final ExponentialBackoff watchBackoff;

    // Pod summary cache: key "namespace/podName" -> PodSummaryDto
    private final Map<String, PodSummaryDto> podCache = new ConcurrentHashMap<>();

    // Container previous restart counts tracking: "namespace/pod/container" -> restartCount
    private final Map<String, Integer> containerRestartCounts = new ConcurrentHashMap<>();

    private Watch<V1Pod> activeWatch;
    private final AtomicBoolean running = new AtomicBoolean(true);
    private volatile boolean connected;
    private volatile String connectionMessage = "Waiting for the first Kubernetes API connection.";
    private volatile Instant lastConnectedAt;
    private final ExecutorService watchExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "k8s-pod-watch-loop");
        t.setDaemon(true);
        return t;
    });

    public KubernetesPodWatcher(ApiClient apiClient,
                                CoreV1Api coreV1Api,
                                KubernetesLogStreamer logStreamer,
                                MetricsService metricsService,
                                @Value("${kubernetes.enabled:false}") boolean enabled,
                                @Value("${kubernetes.watch-namespace:default}") String watchNamespace,
                                @Value("${kubernetes.watch-label-selector:}") String watchLabelSelector,
                                @Value("${log-watcher.reconnect.initial-backoff-ms:1000}") long initialBackoffMs,
                                @Value("${log-watcher.reconnect.max-backoff-ms:30000}") long maxBackoffMs) {
        this.apiClient = apiClient;
        this.coreV1Api = coreV1Api;
        this.logStreamer = logStreamer;
        this.metricsService = metricsService;
        this.enabled = enabled;
        this.watchNamespace = watchNamespace;
        this.watchLabelSelector = watchLabelSelector;
        this.watchBackoff = new ExponentialBackoff(initialBackoffMs, maxBackoffMs, 2.0, true);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!enabled) {
            connectionMessage = "Kubernetes integration is disabled.";
            log.info("Kubernetes is disabled via configuration. Pod watcher will not start.");
            return;
        }
        if (apiClient == null || apiClient.getBasePath() == null || !apiClient.getBasePath().toLowerCase().startsWith("http") || "unconfigured://kubernetes".equals(apiClient.getBasePath()) || "http://localhost:8080".equals(apiClient.getBasePath())) {
            connectionMessage = "No Kubernetes API endpoint is configured. Provide a kubeconfig or set KUBERNETES_MASTER.";
            log.info("Kubernetes is not configured (no kubeconfig, service account, or master URL). Pod watcher will not start.");
            return;
        }
        log.info("Starting KubernetesPodWatcher in namespace '{}' (label selector: '{}')...",
                watchNamespace, watchLabelSelector != null && !watchLabelSelector.isBlank() ? watchLabelSelector : "none");
        watchExecutor.submit(this::watchLoop);
    }

    private void watchLoop() {
        while (running.get()) {
            try {
                // Populate initial pods cache
                listInitialPods();

                Call call = coreV1Api.listNamespacedPod(watchNamespace)
                        .labelSelector((watchLabelSelector != null && !watchLabelSelector.isBlank()) ? watchLabelSelector : null)
                        .watch(true)
                        .buildCall(null);

                activeWatch = Watch.createWatch(
                        apiClient,
                        call,
                        new TypeToken<Watch.Response<V1Pod>>() {}.getType()
                );

                watchBackoff.reset(); // Successfully connected
                connected = true;
                connectionMessage = "Connected to the Kubernetes API.";
                lastConnectedAt = Instant.now();
                log.info("Kubernetes pod watch established on namespace '{}'", watchNamespace);

                for (Watch.Response<V1Pod> item : activeWatch) {
                    if (!running.get()) {
                        break;
                    }
                    if (item != null && item.object != null) {
                        handleWatchEvent(item.type, item.object);
                    }
                }
            } catch (Exception e) {
                if (!running.get()) {
                    break;
                }
                metricsService.incrementReconnect();
                connected = false;
                connectionMessage = "Kubernetes API is unreachable: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
                long backoffMs = watchBackoff.nextBackoffMillis();
                log.warn("Kubernetes pod watch disconnected ({}). Reconnecting in {}ms (attempt {})",
                        e.getMessage(), backoffMs, watchBackoff.getAttempt());

                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            } finally {
                if (activeWatch != null) {
                    try {
                        activeWatch.close();
                    } catch (Exception ignored) {
                    }
                }
            }
        }
    }

    public void listInitialPods() {
        try {
            CoreV1Api.APIlistNamespacedPodRequest request = coreV1Api.listNamespacedPod(watchNamespace);
            if (watchLabelSelector != null && !watchLabelSelector.isBlank()) {
                request = request.labelSelector(watchLabelSelector);
            }
            V1PodList list = request.execute();
            if (list != null && list.getItems() != null) {
                for (V1Pod pod : list.getItems()) {
                    handlePodAddOrModify(pod);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to list initial pods: {}", e.getMessage());
        }
    }

    private void handleWatchEvent(String action, V1Pod pod) {
        if (pod == null || pod.getMetadata() == null) {
            return;
        }

        String name = pod.getMetadata().getName();
        String ns = pod.getMetadata().getNamespace() != null ? pod.getMetadata().getNamespace() : watchNamespace;
        log.debug("Pod event received: {} for {}/{}", action, ns, name);

        if ("ADDED".equalsIgnoreCase(action) || "MODIFIED".equalsIgnoreCase(action)) {
            handlePodAddOrModify(pod);
        } else if ("DELETED".equalsIgnoreCase(action)) {
            handlePodDeleted(ns, name);
        }
    }

    public void handlePodAddOrModify(V1Pod pod) {
        String ns = pod.getMetadata().getNamespace() != null ? pod.getMetadata().getNamespace() : watchNamespace;
        String name = pod.getMetadata().getName();
        String cacheKey = ns + "/" + name;

        PodSummaryDto summary = buildPodSummary(pod);
        podCache.put(cacheKey, summary);

        // Check containers and start log streaming
        if (pod.getSpec() != null && pod.getSpec().getContainers() != null) {
            Map<String, V1ContainerStatus> statusMap = new HashMap<>();
            if (pod.getStatus() != null && pod.getStatus().getContainerStatuses() != null) {
                for (V1ContainerStatus cs : pod.getStatus().getContainerStatuses()) {
                    statusMap.put(cs.getName(), cs);
                }
            }

            for (V1Container container : pod.getSpec().getContainers()) {
                String cName = container.getName();
                String restartKey = ns + "/" + name + "/" + cName;
                V1ContainerStatus cs = statusMap.get(cName);

                int currentRestarts = (cs != null && cs.getRestartCount() != null) ? cs.getRestartCount() : 0;
                Integer previousRestarts = containerRestartCounts.get(restartKey);

                boolean isCrashLoop = cs != null && cs.getState() != null && cs.getState().getWaiting() != null
                        && "CrashLoopBackOff".equalsIgnoreCase(cs.getState().getWaiting().getReason());

                if (previousRestarts != null && currentRestarts > previousRestarts) {
                    log.info("Detected restart for {}/{}/{} (restarts: {} -> {}). Fetching previous logs.",
                            ns, name, cName, previousRestarts, currentRestarts);
                    logStreamer.fetchPreviousLogs(ns, name, cName);
                } else if (isCrashLoop && (previousRestarts == null || currentRestarts > 0)) {
                    logStreamer.fetchPreviousLogs(ns, name, cName);
                }

                containerRestartCounts.put(restartKey, currentRestarts);

                String phase = (pod.getStatus() != null && pod.getStatus().getPhase() != null) ? pod.getStatus().getPhase() : "";
                if (!"Succeeded".equalsIgnoreCase(phase) && !"Failed".equalsIgnoreCase(phase)) {
                    logStreamer.startStream(ns, name, cName);
                }
            }
        }
    }

    public void handlePodDeleted(String ns, String name) {
        String cacheKey = ns + "/" + name;
        podCache.remove(cacheKey);
        logStreamer.stopAllStreamsForPod(ns, name);
        log.info("Pod deleted: {}/{}", ns, name);
    }

    private PodSummaryDto buildPodSummary(V1Pod pod) {
        String name = pod.getMetadata().getName();
        String ns = pod.getMetadata().getNamespace() != null ? pod.getMetadata().getNamespace() : watchNamespace;
        String phase = pod.getStatus() != null && pod.getStatus().getPhase() != null ? pod.getStatus().getPhase() : "Unknown";

        int totalRestarts = 0;
        int readyCount = 0;
        int totalContainers = (pod.getSpec() != null && pod.getSpec().getContainers() != null) ? pod.getSpec().getContainers().size() : 0;

        List<String> containerNames = new ArrayList<>();
        Map<String, String> containerStatuses = new HashMap<>();

        if (pod.getStatus() != null && pod.getStatus().getContainerStatuses() != null) {
            for (V1ContainerStatus cs : pod.getStatus().getContainerStatuses()) {
                containerNames.add(cs.getName());
                if (cs.getRestartCount() != null) {
                    totalRestarts += cs.getRestartCount();
                }
                if (Boolean.TRUE.equals(cs.getReady())) {
                    readyCount++;
                }

                String state = "Unknown";
                if (cs.getState() != null) {
                    if (cs.getState().getRunning() != null) {
                        state = "Running";
                    } else if (cs.getState().getWaiting() != null) {
                        state = cs.getState().getWaiting().getReason() != null ? cs.getState().getWaiting().getReason() : "Waiting";
                        if ("CrashLoopBackOff".equalsIgnoreCase(state)) {
                            phase = "CrashLoopBackOff";
                        }
                    } else if (cs.getState().getTerminated() != null) {
                        state = cs.getState().getTerminated().getReason() != null ? cs.getState().getTerminated().getReason() : "Terminated";
                        if ("OOMKilled".equalsIgnoreCase(state)) {
                            phase = "OOMKilled";
                        }
                    }
                }
                containerStatuses.put(cs.getName(), state);
            }
        } else if (pod.getSpec() != null && pod.getSpec().getContainers() != null) {
            for (V1Container c : pod.getSpec().getContainers()) {
                containerNames.add(c.getName());
                containerStatuses.put(c.getName(), "Pending");
            }
        }

        String ready = readyCount + "/" + totalContainers;
        OffsetDateTime creationTime = pod.getMetadata().getCreationTimestamp();
        String creationTimestamp = creationTime != null ? creationTime.toString() : null;
        String age = calculateAge(creationTime);
        String podIP = pod.getStatus() != null ? pod.getStatus().getPodIP() : null;
        String nodeName = pod.getSpec() != null ? pod.getSpec().getNodeName() : null;
        Map<String, String> labels = pod.getMetadata().getLabels() != null ? pod.getMetadata().getLabels() : Map.of();

        return new PodSummaryDto(name, ns, phase, totalRestarts, age, ready, podIP, nodeName, containerNames, containerStatuses, labels, creationTimestamp);
    }

    private String calculateAge(OffsetDateTime creationTime) {
        if (creationTime == null) {
            return "unknown";
        }
        Duration duration = Duration.between(creationTime, OffsetDateTime.now());
        long seconds = duration.getSeconds();
        if (seconds < 60) return seconds + "s";
        long minutes = seconds / 60;
        if (minutes < 60) return minutes + "m";
        long hours = minutes / 60;
        if (hours < 24) return hours + "h";
        long days = hours / 24;
        return days + "d";
    }

    public List<PodSummaryDto> getAllPods() {
        if (!enabled) {
            return Collections.emptyList();
        }
        return new ArrayList<>(podCache.values());
    }

    public WatcherStatusDto getConnectionStatus() {
        return new WatcherStatusDto(connected, connectionMessage, lastConnectedAt, watchNamespace, enabled);
    }

    public Optional<PodSummaryDto> getPod(String namespace, String name) {
        return Optional.ofNullable(podCache.get(namespace + "/" + name));
    }

    public String getWatchNamespace() {
        return watchNamespace;
    }

    @PreDestroy
    public void shutdown() {
        running.set(false);
        if (activeWatch != null) {
            try {
                activeWatch.close();
            } catch (Exception ignored) {
            }
        }
        watchExecutor.shutdownNow();
    }
}
