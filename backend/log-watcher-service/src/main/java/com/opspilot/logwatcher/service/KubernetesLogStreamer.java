package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.ParsedLogLine;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.dsl.LogWatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.annotation.PreDestroy;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class KubernetesLogStreamer {

    private static final Logger log = LoggerFactory.getLogger(KubernetesLogStreamer.class);

    private final KubernetesClient kubernetesClient;
    private final LogParser logParser;
    private final PodLogBufferManager bufferManager;
    private final MetricsService metricsService;

    private final long initialBackoffMs;
    private final long maxBackoffMs;

    // Active streams: key "namespace/pod/container" -> ActiveStreamTask
    private final Map<String, ActiveStreamTask> activeStreams = new ConcurrentHashMap<>();

    // Active SSE emitters: key "namespace/pod" -> CopyOnWriteArrayList of EmitterSubscription
    private final Map<String, CopyOnWriteArrayList<EmitterSubscription>> sseSubscriptions = new ConcurrentHashMap<>();

    private final ExecutorService streamExecutor = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "k8s-log-streamer");
        t.setDaemon(true);
        return t;
    });

    private static class EmitterSubscription {
        final SseEmitter emitter;
        final String containerFilter; // null or empty for all containers

        EmitterSubscription(SseEmitter emitter, String containerFilter) {
            this.emitter = emitter;
            this.containerFilter = containerFilter;
        }
    }

    private class ActiveStreamTask {
        final String namespace;
        final String pod;
        final String container;
        final AtomicBoolean running = new AtomicBoolean(true);
        final ExponentialBackoff backoff;
        LogWatch logWatch;
        Future<?> workerFuture;

        ActiveStreamTask(String namespace, String pod, String container) {
            this.namespace = namespace;
            this.pod = pod;
            this.container = container;
            this.backoff = new ExponentialBackoff(initialBackoffMs, maxBackoffMs, 2.0, true);
        }

        void stop() {
            running.set(false);
            if (logWatch != null) {
                try {
                    logWatch.close();
                } catch (Exception e) {
                    log.debug("Error closing logWatch: {}", e.getMessage());
                }
            }
            if (workerFuture != null) {
                workerFuture.cancel(true);
            }
        }
    }

    public KubernetesLogStreamer(KubernetesClient kubernetesClient,
                                 LogParser logParser,
                                 PodLogBufferManager bufferManager,
                                 MetricsService metricsService,
                                 @Value("${log-watcher.reconnect.initial-backoff-ms:1000}") long initialBackoffMs,
                                 @Value("${log-watcher.reconnect.max-backoff-ms:30000}") long maxBackoffMs) {
        this.kubernetesClient = kubernetesClient;
        this.logParser = logParser;
        this.bufferManager = bufferManager;
        this.metricsService = metricsService;
        this.initialBackoffMs = initialBackoffMs;
        this.maxBackoffMs = maxBackoffMs;
    }

    private String streamKey(String namespace, String pod, String container) {
        return namespace + "/" + pod + "/" + container;
    }

    private String podKey(String namespace, String pod) {
        return namespace + "/" + pod;
    }

    /**
     * Starts streaming logs for the given pod and container if not already active.
     */
    public synchronized void startStream(String namespace, String pod, String container) {
        String key = streamKey(namespace, pod, container);
        if (activeStreams.containsKey(key)) {
            return;
        }

        ActiveStreamTask task = new ActiveStreamTask(namespace, pod, container);
        activeStreams.put(key, task);
        metricsService.setActiveStreams(activeStreams.size());

        task.workerFuture = streamExecutor.submit(() -> runStreamLoop(task));
        log.info("Started log stream for pod: {}/{}, container: {}", namespace, pod, container);
    }

    /**
     * Fetches previous container logs (e.g. following a CrashLoopBackOff or restart).
     */
    public void fetchPreviousLogs(String namespace, String pod, String container) {
        streamExecutor.submit(() -> {
            try {
                log.info("Fetching previous logs for terminated/restarted container: {}/{}/{}", namespace, pod, container);
                String prevLogs = kubernetesClient.pods()
                        .inNamespace(namespace)
                        .withName(pod)
                        .inContainer(container)
                        .terminated()
                        .withPrettyOutput()
                        .getLog();

                if (prevLogs != null && !prevLogs.isBlank()) {
                    String[] lines = prevLogs.split("\\r?\\n");
                    for (String line : lines) {
                        if (!line.isBlank()) {
                            ParsedLogLine parsed = logParser.parse(line, namespace, pod, container);
                            bufferManager.appendLog(namespace, pod, parsed);
                            broadcastToSse(namespace, pod, parsed);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch previous logs for {}/{}/{}: {}", namespace, pod, container, e.getMessage());
            }
        });
    }

    /**
     * Continuous log streaming loop with reconnect exponential backoff.
     */
    private void runStreamLoop(ActiveStreamTask task) {
        while (task.running.get()) {
            try {
                log.debug("Opening log stream for {}/{}/{}", task.namespace, task.pod, task.container);
                task.logWatch = kubernetesClient.pods()
                        .inNamespace(task.namespace)
                        .withName(task.pod)
                        .inContainer(task.container)
                        .tailingLines(50)
                        .usingTimestamps()
                        .watchLog();

                if (task.logWatch == null || task.logWatch.getOutput() == null) {
                    throw new IllegalStateException("Kubernetes logWatch returned null stream");
                }

                task.backoff.reset(); // Successfully connected, reset backoff

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(task.logWatch.getOutput(), StandardCharsets.UTF_8))) {
                    String line;
                    while (task.running.get() && (line = reader.readLine()) != null) {
                        ParsedLogLine parsed = logParser.parse(line, task.namespace, task.pod, task.container);
                        bufferManager.appendLog(task.namespace, task.pod, parsed);
                        metricsService.incrementLogLines(task.pod, parsed.getLevel());
                        broadcastToSse(task.namespace, task.pod, parsed);
                    }
                }
            } catch (Exception e) {
                if (!task.running.get()) {
                    break;
                }
                metricsService.incrementReconnect();
                long backoffMs = task.backoff.nextBackoffMillis();
                log.warn("Log stream dropped for {}/{}/{} ({}: {}). Reconnecting in {}ms (attempt {})",
                        task.namespace, task.pod, task.container, e.getClass().getSimpleName(), e.getMessage(), backoffMs, task.backoff.getAttempt());

                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    /**
     * Stops the log stream for a container.
     */
    public synchronized void stopStream(String namespace, String pod, String container) {
        String key = streamKey(namespace, pod, container);
        ActiveStreamTask task = activeStreams.remove(key);
        if (task != null) {
            task.stop();
            metricsService.setActiveStreams(activeStreams.size());
            log.info("Stopped log stream for {}/{}/{}", namespace, pod, container);
        }
    }

    /**
     * Stops all active log streams for a pod (e.g. on pod DELETED).
     */
    public synchronized void stopAllStreamsForPod(String namespace, String pod) {
        String prefix = namespace + "/" + pod + "/";
        List<String> keysToRemove = new ArrayList<>();
        for (String key : activeStreams.keySet()) {
            if (key.startsWith(prefix)) {
                keysToRemove.add(key);
            }
        }
        for (String key : keysToRemove) {
            ActiveStreamTask task = activeStreams.remove(key);
            if (task != null) {
                task.stop();
            }
        }
        metricsService.setActiveStreams(activeStreams.size());
    }

    /**
     * Subscribes a client to SSE stream for a specific pod.
     */
    public SseEmitter subscribe(String namespace, String pod, String container, int tail) {
        // 10 minutes timeout for SSE session
        SseEmitter emitter = new SseEmitter(600_000L);
        String pKey = podKey(namespace, pod);

        EmitterSubscription sub = new EmitterSubscription(emitter, container);
        sseSubscriptions.computeIfAbsent(pKey, k -> new CopyOnWriteArrayList<>()).add(sub);

        emitter.onCompletion(() -> removeSubscription(pKey, sub));
        emitter.onTimeout(() -> removeSubscription(pKey, sub));
        emitter.onError(t -> removeSubscription(pKey, sub));

        // Send initial connect notification
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of(
                            "status", "CONNECTED",
                            "namespace", namespace,
                            "pod", pod,
                            "container", container != null ? container : "ALL",
                            "timestamp", Instant.now().toString()
                    )));

            // Replay historical tail logs from ring buffer immediately
            if (tail > 0) {
                List<ParsedLogLine> historical = bufferManager.getLogs(namespace, pod, container, null, null, tail);
                for (ParsedLogLine line : historical) {
                    emitter.send(SseEmitter.event().name("LOG").data(line));
                }
            }
        } catch (Exception e) {
            log.debug("Failed sending initial logs to SSE emitter: {}", e.getMessage());
            emitter.complete();
            removeSubscription(pKey, sub);
        }

        return emitter;
    }

    private void removeSubscription(String podKey, EmitterSubscription sub) {
        CopyOnWriteArrayList<EmitterSubscription> list = sseSubscriptions.get(podKey);
        if (list != null) {
            list.remove(sub);
            if (list.isEmpty()) {
                sseSubscriptions.remove(podKey);
            }
        }
    }

    private void broadcastToSse(String namespace, String pod, ParsedLogLine line) {
        String pKey = podKey(namespace, pod);
        CopyOnWriteArrayList<EmitterSubscription> subs = sseSubscriptions.get(pKey);
        if (subs == null || subs.isEmpty()) {
            return;
        }

        for (EmitterSubscription sub : subs) {
            if (sub.containerFilter == null || sub.containerFilter.isBlank() ||
                    sub.containerFilter.equalsIgnoreCase(line.getContainer())) {
                try {
                    sub.emitter.send(SseEmitter.event().name("LOG").data(line));
                } catch (Exception e) {
                    sub.emitter.complete();
                    subs.remove(sub);
                }
            }
        }
    }

    /**
     * Periodic heartbeat comment to keep SSE connections alive across reverse proxies and Ingress.
     */
    @Scheduled(fixedRate = 15000)
    public void sendHeartbeats() {
        for (Map.Entry<String, CopyOnWriteArrayList<EmitterSubscription>> entry : sseSubscriptions.entrySet()) {
            for (EmitterSubscription sub : entry.getValue()) {
                try {
                    sub.emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    sub.emitter.complete();
                    entry.getValue().remove(sub);
                }
            }
        }
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down KubernetesLogStreamer...");
        for (ActiveStreamTask task : activeStreams.values()) {
            task.stop();
        }
        activeStreams.clear();
        streamExecutor.shutdownNow();
    }
}
