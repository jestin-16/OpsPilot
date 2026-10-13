package com.opspilot.logwatcher.service;

import java.util.Random;

/**
 * Calculates exponential backoff intervals with jitter for reconnecting
 * Kubernetes watches and log streaming sessions.
 */
public class ExponentialBackoff {

    private final long initialBackoffMs;
    private final long maxBackoffMs;
    private final double multiplier;
    private final boolean jitter;
    private final Random random;

    private int attempt = 0;

    public ExponentialBackoff(long initialBackoffMs, long maxBackoffMs, double multiplier, boolean jitter) {
        if (initialBackoffMs <= 0) {
            throw new IllegalArgumentException("initialBackoffMs must be > 0");
        }
        if (maxBackoffMs < initialBackoffMs) {
            throw new IllegalArgumentException("maxBackoffMs must be >= initialBackoffMs");
        }
        this.initialBackoffMs = initialBackoffMs;
        this.maxBackoffMs = maxBackoffMs;
        this.multiplier = multiplier > 1.0 ? multiplier : 2.0;
        this.jitter = jitter;
        this.random = new Random();
    }

    public ExponentialBackoff() {
        this(1000, 30000, 2.0, true);
    }

    /**
     * Calculates the next backoff duration in milliseconds and increments attempt count.
     */
    public synchronized long nextBackoffMillis() {
        double delay = initialBackoffMs * Math.pow(multiplier, attempt);
        if (delay > maxBackoffMs) {
            delay = maxBackoffMs;
        }

        attempt++;

        if (jitter) {
            // Apply full jitter between 50% and 100% of calculated delay
            double minJitter = delay * 0.5;
            double jitterRange = delay - minJitter;
            return (long) (minJitter + (random.nextDouble() * jitterRange));
        }

        return (long) delay;
    }

    /**
     * Resets the attempt counter upon successful connection or recovery.
     */
    public synchronized void reset() {
        attempt = 0;
    }

    public synchronized int getAttempt() {
        return attempt;
    }

    public long getInitialBackoffMs() {
        return initialBackoffMs;
    }

    public long getMaxBackoffMs() {
        return maxBackoffMs;
    }
}
