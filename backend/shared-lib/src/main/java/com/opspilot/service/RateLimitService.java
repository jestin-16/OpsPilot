package com.opspilot.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitService {

    private final Map<UUID, Bucket> cache = new ConcurrentHashMap<>();
    
    private final int capacity;
    private final int refillTokens;
    private final int refillDurationSeconds;

    public RateLimitService(
            @Value("${opspilot.ingest.rate-limit.capacity:1000}") int capacity,
            @Value("${opspilot.ingest.rate-limit.refill-tokens:1000}") int refillTokens,
            @Value("${opspilot.ingest.rate-limit.refill-seconds:60}") int refillDurationSeconds) {
        this.capacity = capacity;
        this.refillTokens = refillTokens;
        this.refillDurationSeconds = refillDurationSeconds;
    }

    public Bucket resolveBucket(UUID sourceId) {
        return cache.computeIfAbsent(sourceId, this::newBucket);
    }

    private Bucket newBucket(UUID sourceId) {
        Bandwidth limit = Bandwidth.classic(capacity, 
                Refill.greedy(refillTokens, Duration.ofSeconds(refillDurationSeconds)));
        return Bucket.builder().addLimit(limit).build();
    }
}
