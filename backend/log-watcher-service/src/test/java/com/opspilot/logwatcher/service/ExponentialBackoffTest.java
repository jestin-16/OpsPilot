package com.opspilot.logwatcher.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExponentialBackoffTest {

    @Test
    @DisplayName("Should double backoff interval sequentially without jitter")
    void testExponentialGrowthWithoutJitter() {
        ExponentialBackoff backoff = new ExponentialBackoff(1000, 30000, 2.0, false);

        assertEquals(1000, backoff.nextBackoffMillis()); // attempt 0: 1000 * 2^0 = 1000
        assertEquals(2000, backoff.nextBackoffMillis()); // attempt 1: 1000 * 2^1 = 2000
        assertEquals(4000, backoff.nextBackoffMillis()); // attempt 2: 1000 * 2^2 = 4000
        assertEquals(8000, backoff.nextBackoffMillis()); // attempt 3: 1000 * 2^3 = 8000
        assertEquals(16000, backoff.nextBackoffMillis()); // attempt 4: 1000 * 2^4 = 16000
        assertEquals(30000, backoff.nextBackoffMillis()); // attempt 5: capped at max 30000
        assertEquals(30000, backoff.nextBackoffMillis()); // attempt 6: capped at max 30000
    }

    @Test
    @DisplayName("Should stay within 50% to 100% delay bounds with jitter")
    void testJitterBounds() {
        ExponentialBackoff backoff = new ExponentialBackoff(1000, 30000, 2.0, true);

        for (int i = 0; i < 10; i++) {
            long delay = backoff.nextBackoffMillis();
            assertTrue(delay >= 500, "Delay must be at least 50% of 1000ms: " + delay);
            assertTrue(delay <= 30000, "Delay must never exceed maxBackoffMs: " + delay);
        }
    }

    @Test
    @DisplayName("Should reset backoff attempts to 0")
    void testReset() {
        ExponentialBackoff backoff = new ExponentialBackoff(1000, 30000, 2.0, false);

        backoff.nextBackoffMillis();
        backoff.nextBackoffMillis();
        backoff.nextBackoffMillis();
        assertEquals(3, backoff.getAttempt());

        backoff.reset();
        assertEquals(0, backoff.getAttempt());
        assertEquals(1000, backoff.nextBackoffMillis());
    }

    @Test
    @DisplayName("Should reject invalid configuration arguments")
    void testValidation() {
        assertThrows(IllegalArgumentException.class, () -> new ExponentialBackoff(0, 1000, 2.0, false));
        assertThrows(IllegalArgumentException.class, () -> new ExponentialBackoff(2000, 1000, 2.0, false));
    }
}
