package com.opspilot.projectlogs;

import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.ConnectorRegistry;
import com.opspilot.connector.IntegrationConnector;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;
import com.opspilot.repository.IntegrationRepository;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Keeps a live subscription open for every CONNECTED pull-based integration and funnels its entries into the log store.
 * A reconcile pass runs periodically: new integrations start, disconnected or deleted ones stop, edited ones restart.
 * Failed streams are retried with exponential backoff. Docker / Kubernetes streams are restarted every
 * logs.runner.refresh so containers and pods that appeared since are picked up.
 */
@Component
public class ConnectorRunner {

    private static final Logger log = LoggerFactory.getLogger(ConnectorRunner.class);
    private static final Set<ProviderType> REFRESHED = Set.of(ProviderType.DOCKER, ProviderType.KUBERNETES);

    private record Running(LocalDateTime version, Disposable subscription) { }

    private final IntegrationRepository integrationRepository;
    private final ConnectorRegistry registry;
    private final LogIngestService ingestService;
    private final boolean enabled;
    private final Duration refresh;
    private final Map<Long, Running> running = new ConcurrentHashMap<>();

    public ConnectorRunner(IntegrationRepository integrationRepository, ConnectorRegistry registry, LogIngestService ingestService,
                           @Value("${logs.runner.enabled:true}") boolean enabled,
                           @Value("${logs.runner.refresh:10m}") Duration refresh) {
        this.integrationRepository = integrationRepository;
        this.registry = registry;
        this.ingestService = ingestService;
        this.enabled = enabled;
        this.refresh = refresh;
    }

    @Scheduled(initialDelayString = "${logs.runner.initial-delay-ms:10000}", fixedDelayString = "${logs.runner.interval-ms:30000}")
    public void reconcile() {
        if (!enabled) {
            return;
        }
        List<Integration> connected;
        try {
            connected = integrationRepository.findByStatus(IntegrationStatus.CONNECTED);
        } catch (RuntimeException e) {
            log.warn("Could not load integrations: {}", e.getClass().getSimpleName());
            return;
        }
        Set<Long> wanted = connected.stream()
                .filter(i -> registry.find(i.getProvider()).map(c -> !c.isPushBased()).orElse(false))
                .map(Integration::getId).collect(Collectors.toSet());

        running.keySet().stream().filter(id -> !wanted.contains(id)).toList().forEach(this::stop);

        for (Integration integration : connected) {
            if (!wanted.contains(integration.getId())) continue;
            Running current = running.get(integration.getId());
            if (current != null && integration.getUpdatedAt() != null && integration.getUpdatedAt().equals(current.version())) {
                continue;
            }
            if (current != null) {
                stop(integration.getId());
            }
            start(integration);
        }
    }

    private void start(Integration integration) {
        IntegrationConnector connector = registry.require(integration.getProvider());
        Long projectId = integration.getProject().getId();
        Long integrationId = integration.getId();
        String name = integration.getName();
        ConnectorConfig config;
        try {
            config = ConnectorConfig.fromJson(projectId, integrationId, integration.getProvider(), name,
                    integration.getConfiguration(), integration.getCredentialReference());
        } catch (IllegalArgumentException e) {
            log.warn("Integration {} has unreadable configuration; not streaming", integrationId);
            return;
        }
        final ConnectorConfig cfg = config;
        Flux<LogEntry> source = Flux.defer(() -> connector.streamLogs(cfg, LogFilters.none()));
        if (REFRESHED.contains(integration.getProvider())) {
            source = source.take(refresh).repeat();
        }
        Disposable subscription = source
                .retryWhen(Retry.backoff(Long.MAX_VALUE, Duration.ofSeconds(2)).maxBackoff(Duration.ofMinutes(5))
                        .doBeforeRetry(s -> log.warn("Stream for integration {} failed ({}); retrying", integrationId, s.failure().getMessage())))
                .bufferTimeout(100, Duration.ofSeconds(1))
                .onBackpressureBuffer(1000, dropped -> log.warn("Dropped {} entries for integration {}: store is too slow", dropped.size(), integrationId),
                        reactor.core.publisher.BufferOverflowStrategy.DROP_OLDEST)
                .publishOn(Schedulers.boundedElastic(), 1)
                .subscribe(batch -> store(projectId, integrationId, name, batch),
                        e -> log.error("Stream for integration {} stopped: {}", integrationId, e.getMessage()));
        running.put(integrationId, new Running(integration.getUpdatedAt(), subscription));
        log.info("Streaming logs for integration {} ({})", integrationId, integration.getProvider());
    }

    private void store(Long projectId, Long integrationId, String name, List<LogEntry> batch) {
        try {
            ingestService.ingest(projectId, integrationId, name, batch);
        } catch (RuntimeException e) {
            log.warn("Could not store {} entries for integration {}: {}", batch.size(), integrationId, e.getClass().getSimpleName());
        }
    }

    private void stop(Long integrationId) {
        Running r = running.remove(integrationId);
        if (r != null) {
            r.subscription().dispose();
            log.info("Stopped streaming logs for integration {}", integrationId);
        }
    }

    int activeStreams() {
        return running.size();
    }

    @PreDestroy
    void shutdown() {
        running.keySet().forEach(this::stop);
    }
}
