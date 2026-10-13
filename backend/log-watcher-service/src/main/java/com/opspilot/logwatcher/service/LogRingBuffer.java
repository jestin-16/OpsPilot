package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.ParsedLogLine;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Thread-safe bounded circular ring buffer storing up to a configured maximum
 * number of ParsedLogLine items with O(1) eviction of the oldest item.
 */
public class LogRingBuffer {

    private final int capacity;
    private final Deque<ParsedLogLine> buffer;
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final AtomicLong totalLinesReceived = new AtomicLong(0);
    private final AtomicLong droppedLines = new AtomicLong(0);

    // Maximum characters allowed per log line to guard against memory exhaustion
    private static final int MAX_LINE_CHAR_LIMIT = 8192;

    public LogRingBuffer(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Ring buffer capacity must be positive");
        }
        this.capacity = capacity;
        this.buffer = new ArrayDeque<>(Math.min(capacity, 1024));
    }

    /**
     * Appends a log line to the buffer. If the buffer is full, the oldest line is dropped.
     */
    public void append(ParsedLogLine line) {
        if (line == null) {
            return;
        }

        // Safeguard against memory exhaustion from giant lines
        if (line.getMessage() != null && line.getMessage().length() > MAX_LINE_CHAR_LIMIT) {
            line.setMessage(line.getMessage().substring(0, MAX_LINE_CHAR_LIMIT) + "... [TRUNCATED_FOR_MEMORY]");
        }

        totalLinesReceived.incrementAndGet();

        rwLock.writeLock().lock();
        try {
            if (buffer.size() >= capacity) {
                buffer.pollFirst(); // drop oldest
                droppedLines.incrementAndGet();
            }
            buffer.addLast(line);
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    /**
     * Returns a snapshot of lines matching the given filters.
     *
     * @param container optional container filter
     * @param level     optional level filter (INFO, WARN, ERROR, DEBUG)
     * @param since     optional timestamp filter
     * @param tail      optional maximum lines to return (<= 0 means all matching)
     */
    public List<ParsedLogLine> getFilteredLines(String container, String level, Instant since, int tail) {
        List<ParsedLogLine> result = new ArrayList<>();

        rwLock.readLock().lock();
        try {
            for (ParsedLogLine line : buffer) {
                if (container != null && !container.isBlank() && !container.equalsIgnoreCase(line.getContainer())) {
                    continue;
                }
                if (level != null && !level.isBlank() && !level.equalsIgnoreCase(line.getLevel())) {
                    continue;
                }
                if (since != null && line.getParsedTimestamp() != null && line.getParsedTimestamp().isBefore(since)) {
                    continue;
                }
                result.add(line);
            }
        } finally {
            rwLock.readLock().unlock();
        }

        if (tail > 0 && result.size() > tail) {
            return new ArrayList<>(result.subList(result.size() - tail, result.size()));
        }
        return result;
    }

    /**
     * Counts error lines since a given timestamp for error-rate calculations.
     */
    public long countErrorsSince(Instant since) {
        rwLock.readLock().lock();
        try {
            long errorCount = 0;
            for (ParsedLogLine line : buffer) {
                if ("ERROR".equalsIgnoreCase(line.getLevel())) {
                    if (since == null || (line.getParsedTimestamp() != null && !line.getParsedTimestamp().isBefore(since))) {
                        errorCount++;
                    }
                }
            }
            return errorCount;
        } finally {
            rwLock.readLock().unlock();
        }
    }

    /**
     * Total lines currently in buffer.
     */
    public int size() {
        rwLock.readLock().lock();
        try {
            return buffer.size();
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public int getCapacity() {
        return capacity;
    }

    public long getTotalLinesReceived() {
        return totalLinesReceived.get();
    }

    public long getDroppedLines() {
        return droppedLines.get();
    }

    public void clear() {
        rwLock.writeLock().lock();
        try {
            buffer.clear();
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
