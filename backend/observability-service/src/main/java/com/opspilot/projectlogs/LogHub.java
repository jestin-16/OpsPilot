package com.opspilot.projectlogs;

import com.opspilot.connector.LogEntry;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-process fan-out of freshly stored entries to live SSE subscribers, one channel per project. Slow subscribers drop
 * entries instead of stalling ingest; they recover from the database through Last-Event-ID replay.
 */
@Component
public class LogHub {

    private final Map<Long, Sinks.Many<LogEntry>> sinks = new ConcurrentHashMap<>();

    public void publish(LogEntry entry) {
        if (entry.getProjectId() == null) {
            return;
        }
        Sinks.Many<LogEntry> sink = sinks.get(entry.getProjectId());
        if (sink != null) {
            sink.emitNext(entry, Sinks.EmitFailureHandler.busyLooping(Duration.ofMillis(50)));
        }
    }

    /** Hot stream of entries for a project from the moment of subscription. */
    public Flux<LogEntry> stream(Long projectId) {
        return Flux.defer(() -> sinks.computeIfAbsent(projectId, id -> Sinks.many().multicast().directBestEffort()).asFlux())
                .onBackpressureDrop()
                .doFinally(signal -> {
                    Sinks.Many<LogEntry> sink = sinks.get(projectId);
                    if (sink != null && sink.currentSubscriberCount() == 0) {
                        sinks.remove(projectId, sink);
                    }
                });
    }

    int activeProjects() {
        return sinks.size();
    }
}
