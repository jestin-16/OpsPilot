package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.PodSummaryDto;
import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.Watch;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import io.fabric8.kubernetes.client.dsl.FilterWatchListDeletable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class KubernetesPodWatcher implements Watcher<Pod> {

    private static final Logger log = LoggerFactory.getLogger(KubernetesPodWatcher.class);

    private final KubernetesClient kubernetesClient;
    private final KubernetesLogStreamer logStreamer;
    private final MetricsService metricsService;

    private final String watchNamespace;
    private final String watchLabelSelector;
    private final ExponentialBackoff watchBackoff;

    // Pod summary cache: key "namespace/podName" -> PodSummaryDto
    private final Map<String, PodSummaryDto> podCache = new ConcurrentHashMap<>();

    // Container previous restart counts tracking: "namespace/pod/container" -> restartCount
    private final Map<String, Integer> containerRestartCounts = new ConcurrentHashMap<>();

    private Watch activeWatch;
    private final AtomicBoolean running = new AtomicBoolean(true);
    private final ScheduledExecutorService reconnectScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "k8s-pod-watcher-reconnect");
        t.setDaemon(true);
        return t;
    });

    public KubernetesPodWatcher(KubernetesClient kubernetesClient,
                                KubernetesLogStreamer logStreamer,
                                MetricsService metricsService,
                                @Value("${kubernetes.watch-namespace:default}") String watchNamespace,
                                @Value("${kubernetes.watch-label-selector:}") String watchLabelSelector,
                                @Value("${log-watcher.reconnect.initial-backoff-ms:1000}") long initialBackoffMs,
                                @Value("${log-watcher.reconnect.max-backoff-ms:30000}") long maxBackoffMs) {
        this.kubernetesClient = kubernetesClient;
        this.logStreamer = logStreamer;
        this.metricsService = metricsService;
        this.watchNamespace = watchNamespace;
        this.watchLabelSelector = watchLabelSelector;
        this.watchBackoff = new ExponentialBackoff(initialBackoffMs, maxBackoffMs, 2.0, true);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        log.info("Starting KubernetesPodWatcher in namespace '{}' (label selector: '{}')...",
                watchNamespace, watchLabelSelector != null ? watchLabelSelector : "none");
        initAndWatch();
    }

    public synchronized void initAndWatch() {
        if (!running.get()) {
            return;
        }

        try {
            // First, initial list to populate cache and start streams
            listInitialPods();

            // Then start watch
            FilterWatchListDeletable<Pod, PodList> operation = kubernetesClient.pods().inNamespace(watchNamespace);
            if (watchLabelSelector != null && !watchLabelSelector.isBlank()) {
                operation = operation.withLabelSelector(watchLabelSelector);
            }

            activeWatch = operation.watch(this);
            watchBackoff.reset();
            log.info("Kubernetes pod watch successfully established for namespace '{}'", watchNamespace);
        } catch (Exception e) {
            metricsService.incrementReconnect();
            long delay = watchBackoff.nextBackoffMillis();
            log.warn("Failed to establish pod watch ({}). Retrying in {}ms (attempt {})",
                    e.getMessage(), delay, watchBackoff.getAttempt());
            scheduleReconnect(delay);
        }
    }

    private void listInitialPods() {
        try {
            FilterWatchListDeletable<Pod, PodList> operation = kubernetesClient.pods().inNamespace(watchNamespace);
            if (watchLabelSelector != null && !watchLabelSelector.isBlank()) {
                operation = operation.withLabelSelector(watchLabelSelector);
            }
            PodList podList = operation.list();
            if (podList != null && podList.getItems() != null) {
                for (Pod pod : podList.getItems()) {
                    handlePodAddOrModify(pod);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to list initial pods: {}", e.getMessage());
        }
    }

    @Override
    public void eventReceived(Action action, Pod pod) {
        if (pod == null || pod.getMetadata() == null) {
            return;
        }

        String name = pod.getMetadata().getName();
        String ns = pod.getMetadata().getNamespace() != null ? pod.getMetadata().getNamespace() : watchNamespace;
        log.debug("Pod event received: {} for {}/{}", action, ns, name);

        if (action == Action.ADDED || action == Action.MODIFIED) {
            handlePodAddOrModify(pod);
        } else if (action == Action.DELETED) {
            handlePodDeleted(ns, name);
        }
    }

    @Override
    public void onClose(WatcherException cause) {
        if (!running.get()) {
            return;
        }
        metricsService.incrementReconnect();
        long delay = watchBackoff.nextBackoffMillis();
        if (cause != null) {
            log.warn("Pod watch dropped due to error: {}. Reconnecting in {}ms", cause.getMessage(), delay);
        } else {
            log.info("Pod watch closed gracefully by server. Reconnecting in {}ms", delay);
        }
        scheduleReconnect(delay);
    }

    private void scheduleReconnect(long delayMs) {
        if (!running.get()) {
            return;
        }
        reconnectScheduler.schedule(this::initAndWatch, delayMs, TimeUnit.MILLISECONDS);
    }

    private void handlePodAddOrModify(Pod pod) {
        String ns = pod.getMetadata().getNamespace() != null ? pod.getMetadata().getNamespace() : watchNamespace;
        String name = pod.getMetadata().getName();
        String cacheKey = ns + "/" + name;

        PodSummaryDto summary = buildPodSummary(pod);
        podCache.put(cacheKey, summary);

        // Manage log streams for containers
        if (pod.getSpec() != null && pod.getSpec().getContainers() != null) {
            Map<String, ContainerStatus> statusMap = new HashMap<>();
            if (pod.getStatus() != null && pod.getStatus().getContainerStatuses() != null) {
                for (ContainerStatus cs : pod.getStatus().getContainerStatuses()) {
                    statusMap.put(cs.getName(), cs);
                }
            }

            for (Container container : pod.getSpec().getContainers()) {
                String cName = container.getName();
                String restartKey = ns + "/" + name + "/" + cName;
                ContainerStatus cs = statusMap.get(cName);

                int currentRestarts = cs != null ? cs.getRestartCount() : 0;
                Integer previousRestarts = containerRestartCounts.get(restartKey);

                // Detect container restart or CrashLoopBackOff -> fetch previous logs
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

                // Start live log streaming if container is running or waiting
                String phase = pod.getStatus() != null ? pod.getStatus().getPhase() : "";
                if (!"Succeeded".equalsIgnoreCase(phase) && !"Failed".equalsIgnoreCase(phase)) {
                    logStreamer.startStream(ns, name, cName);
                }
            }
        }
    }

    private void handlePodDeleted(String ns, String name) {
        String cacheKey = ns + "/" + name;
        podCache.remove(cacheKey);
        logStreamer.stopAllStreamsForPod(ns, name);
        log.info("Pod deleted: {}/{}", ns, name);
    }

    private PodSummaryDto buildPodSummary(Pod pod) {
        String name = pod.getMetadata().getName();
        String ns = pod.getMetadata().getNamespace() != null ? pod.getMetadata().getNamespace() : watchNamespace;
        String phase = pod.getStatus() != null && pod.getStatus().getPhase() != null ? pod.getStatus().getPhase() : "Unknown";

        int totalRestarts = 0;
        int readyCount = 0;
        int totalContainers = pod.getSpec() != null && pod.getSpec().getContainers() != null ? pod.getSpec().getContainers().size() : 0;

        List<String> containerNames = new ArrayList<>();
        Map<String, String> containerStatuses = new HashMap<>();

        if (pod.getStatus() != null && pod.getStatus().getContainerStatuses() != null) {
            for (ContainerStatus cs : pod.getStatus().getContainerStatuses()) {
                containerNames.add(cs.getName());
                totalRestarts += cs.getRestartCount();
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
                            phase = "CrashLoopBackOff"; // Surface critical state in status
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
            for (Container c : pod.getSpec().getContainers()) {
                containerNames.add(c.getName());
                containerStatuses.put(c.getName(), "Pending");
            }
        }

        String ready = readyCount + "/" + totalContainers;
        String creationTimestamp = pod.getMetadata().getCreationTimestamp();
        String age = calculateAge(creationTimestamp);
        String podIP = pod.getStatus() != null ? pod.getStatus().getPodIP() : null;
        String nodeName = pod.getSpec() != null ? pod.getSpec().getNodeName() : null;
        Map<String, String> labels = pod.getMetadata().getLabels() != null ? pod.getMetadata().getLabels() : Map.of();

        return new PodSummaryDto(name, ns, phase, totalRestarts, age, ready, podIP, nodeName, containerNames, containerStatuses, labels, creationTimestamp);
    }

    private String calculateAge(String creationTimestamp) {
        if (creationTimestamp == null) {
            return "unknown";
        }
        try {
            Instant created = Instant.parse(creationTimestamp);
            Duration duration = Duration.between(created, Instant.now());
            long seconds = duration.getSeconds();
            if (seconds < 60) return seconds + "s";
            long minutes = seconds / 60;
            if (minutes < 60) return minutes + "m";
            long hours = minutes / 60;
            if (hours < 24) return hours + "h";
            long days = hours / 24;
            return days + "d";
        } catch (DateTimeParseException e) {
            return creationTimestamp;
        }
    }

    public List<PodSummaryDto> getAllPods() {
        return new ArrayList<>(podCache.values());
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
            } catch (Exception e) {
                log.debug("Error closing pod watch: {}", e.getMessage());
            }
        }
        reconnectScheduler.shutdownNow();
    }
}
