package com.opspilot.projectlogs;

import com.opspilot.connector.LogEntry;
import com.opspilot.dto.PagedResponse;
import com.opspilot.entity.User;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Project-scoped log reads: a paged query and a live SSE stream with the same filters.
 * The metadata filters container / namespace / pod / repo narrow to one source for the per-integration pages.
 */
@RestController
@RequestMapping({"/api/v1/projects/{projectId}/logs", "/api/projects/{projectId}/logs"})
public class ProjectLogController {

    static final Duration HEARTBEAT = Duration.ofSeconds(15);

    private final ProjectAccess access;
    private final ProjectLogQueryService queryService;
    private final LogHub hub;

    public ProjectLogController(ProjectAccess access, ProjectLogQueryService queryService, LogHub hub) {
        this.access = access;
        this.queryService = queryService;
        this.hub = hub;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<LogEntry>> query(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long integrationId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String container,
            @RequestParam(required = false) String namespace,
            @RequestParam(required = false) String pod,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @AuthenticationPrincipal User currentUser) {
        access.require(projectId, currentUser);
        LogQuery query = new LogQuery(projectId, integrationId, type, level, from, to, q, selectors(container, namespace, pod));
        return ResponseEntity.ok(queryService.query(query, page, size));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<LogEntry>> stream(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long integrationId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String container,
            @RequestParam(required = false) String namespace,
            @RequestParam(required = false) String pod,
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
            @AuthenticationPrincipal User currentUser) {
        access.require(projectId, currentUser);
        LogQuery filter = new LogQuery(projectId, integrationId, type, level, null, null, q, selectors(container, namespace, pod));

        Flux<LogEntry> entries = lastEventId == null ? live(filter) : replayThenLive(filter, parseId(lastEventId));
        Flux<ServerSentEvent<LogEntry>> events = entries.map(e -> ServerSentEvent.<LogEntry>builder(e).id(e.getId()).event("log").build());
        // Comment-only heartbeats keep proxies from closing an idle connection and let clients detect a dead one.
        Flux<ServerSentEvent<LogEntry>> beats = Flux.interval(HEARTBEAT).map(i -> ServerSentEvent.<LogEntry>builder().comment("keepalive").build());
        return Flux.merge(events, beats);
    }

    private Flux<LogEntry> live(LogQuery filter) {
        return hub.stream(filter.projectId()).filter(filter::matches);
    }

    /**
     * After a dropped connection the browser sends Last-Event-ID; send what was stored since, then continue live. The
     * live subscription is opened first and anything already replayed is skipped, so nothing falls in the gap.
     */
    Flux<LogEntry> replayThenLive(LogQuery filter, long lastId) {
        return Flux.defer(() -> {
            Sinks.Many<LogEntry> buffer = Sinks.many().unicast().onBackpressureBuffer();
            Disposable subscription = live(filter).subscribe(e -> buffer.emitNext(e, Sinks.EmitFailureHandler.busyLooping(Duration.ofMillis(50))));
            List<LogEntry> missed = queryService.after(filter, lastId);
            AtomicLong cutoff = new AtomicLong(missed.isEmpty() ? lastId : parseId(missed.get(missed.size() - 1).getId()));
            return Flux.fromIterable(missed)
                    .concatWith(buffer.asFlux().filter(e -> parseId(e.getId()) > cutoff.get()))
                    .doFinally(s -> subscription.dispose());
        });
    }

    private static long parseId(String id) {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException | NullPointerException e) {
            return 0L;
        }
    }

    private static Map<String, String> selectors(String container, String namespace, String pod) {
        Map<String, String> m = new HashMap<>();
        if (container != null && !container.isBlank()) m.put("container", container);
        if (namespace != null && !namespace.isBlank()) m.put("namespace", namespace);
        if (pod != null && !pod.isBlank()) m.put("pod", pod);
        return m;
    }
}
