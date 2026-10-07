package com.opspilot.service;

import com.opspilot.repository.DockerLogSourceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Tracks agent liveness: marks sources ACTIVE on push (write-throttled) and STALE when they go quiet. */
@Service
public class DockerSourceStatusService {

    private static final long TOUCH_INTERVAL_MS = 15_000;

    private final DockerLogSourceRepository repository;
    private final Duration staleAfter;
    private final Map<UUID, Long> lastWrite = new ConcurrentHashMap<>();

    public DockerSourceStatusService(DockerLogSourceRepository repository,
                                     @Value("${ingest.stale-after:5m}") Duration staleAfter) {
        this.repository = repository;
        this.staleAfter = staleAfter;
    }

    public Duration getStaleAfter() {
        return staleAfter;
    }

    public void touch(UUID sourceId) {
        long now = System.currentTimeMillis();
        Long prev = lastWrite.get(sourceId);
        if (prev != null && now - prev < TOUCH_INTERVAL_MS) return;
        lastWrite.put(sourceId, now);
        repository.markSeen(sourceId, LocalDateTime.now());
    }

    @Scheduled(fixedDelayString = "${ingest.stale-sweep-ms:60000}")
    public void sweepStale() {
        repository.markStale(LocalDateTime.now().minus(staleAfter));
    }
}
