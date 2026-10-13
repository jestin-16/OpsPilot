package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.ParsedLogLine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

class LogRingBufferTest {

    @Test
    @DisplayName("Should enforce bounded ring buffer capacity and evict oldest lines in FIFO order")
    void testBoundedCapacityAndEviction() {
        LogRingBuffer buffer = new LogRingBuffer(5);

        for (int i = 1; i <= 10; i++) {
            buffer.append(new ParsedLogLine("ts" + i, Instant.now(), "default", "pod1", "c1", "INFO", "Message " + i, "raw" + i));
        }

        assertEquals(5, buffer.size());
        assertEquals(5, buffer.getDroppedLines());
        assertEquals(10, buffer.getTotalLinesReceived());

        List<ParsedLogLine> lines = buffer.getFilteredLines(null, null, null, 0);
        assertEquals(5, lines.size());
        assertEquals("Message 6", lines.get(0).getMessage());
        assertEquals("Message 10", lines.get(4).getMessage());
    }

    @Test
    @DisplayName("Should correctly filter by container, level, and tail count")
    void testFiltering() {
        LogRingBuffer buffer = new LogRingBuffer(100);

        buffer.append(new ParsedLogLine("ts1", Instant.now(), "default", "pod1", "web", "INFO", "Web info", "raw1"));
        buffer.append(new ParsedLogLine("ts2", Instant.now(), "default", "pod1", "web", "ERROR", "Web error 1", "raw2"));
        buffer.append(new ParsedLogLine("ts3", Instant.now(), "default", "pod1", "celery", "ERROR", "Celery error", "raw3"));
        buffer.append(new ParsedLogLine("ts4", Instant.now(), "default", "pod1", "web", "ERROR", "Web error 2", "raw4"));

        // Filter by container = web
        List<ParsedLogLine> webLines = buffer.getFilteredLines("web", null, null, 0);
        assertEquals(3, webLines.size());

        // Filter by level = ERROR
        List<ParsedLogLine> errorLines = buffer.getFilteredLines(null, "ERROR", null, 0);
        assertEquals(3, errorLines.size());

        // Filter by container = web AND level = ERROR
        List<ParsedLogLine> webErrors = buffer.getFilteredLines("web", "ERROR", null, 0);
        assertEquals(2, webErrors.size());

        // Filter tail = 1
        List<ParsedLogLine> tailOne = buffer.getFilteredLines("web", "ERROR", null, 1);
        assertEquals(1, tailOne.size());
        assertEquals("Web error 2", tailOne.get(0).getMessage());
    }

    @Test
    @DisplayName("Should truncate abnormally large log lines to safeguard memory")
    void testTruncateGiantLines() {
        LogRingBuffer buffer = new LogRingBuffer(10);

        String giantMessage = "A".repeat(20000);
        ParsedLogLine line = new ParsedLogLine("ts", Instant.now(), "default", "pod1", "c1", "INFO", giantMessage, "raw");
        buffer.append(line);

        List<ParsedLogLine> lines = buffer.getFilteredLines(null, null, null, 0);
        assertEquals(1, lines.size());
        assertTrue(lines.get(0).getMessage().length() < 9000);
        assertTrue(lines.get(0).getMessage().contains("[TRUNCATED_FOR_MEMORY]"));
    }

    @Test
    @DisplayName("Should support concurrent multithreaded writes safely")
    void testConcurrentWrites() throws InterruptedException {
        int threads = 10;
        int itemsPerThread = 100;
        LogRingBuffer buffer = new LogRingBuffer(500);

        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);

        for (int i = 0; i < threads; i++) {
            final int threadId = i;
            executor.submit(() -> {
                try {
                    for (int j = 0; j < itemsPerThread; j++) {
                        buffer.append(new ParsedLogLine("ts", Instant.now(), "default", "pod", "c", "INFO", "msg-" + threadId + "-" + j, "raw"));
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        assertEquals(500, buffer.size());
        assertEquals(1000, buffer.getTotalLinesReceived());
        assertEquals(500, buffer.getDroppedLines());
    }
}
