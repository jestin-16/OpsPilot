package com.opspilot.service;

import com.opspilot.dto.LogQueryResponse;
import com.opspilot.entity.DockerLogSource;
import com.opspilot.entity.User;
import com.opspilot.logstore.LogQlBuilder;
import com.opspilot.logstore.LogQlBuilder.Level;
import com.opspilot.logstore.LogStore;
import com.opspilot.logstore.LogStore.LogLine;
import com.opspilot.logstore.LogStore.LogStoreException;
import com.opspilot.logstore.LogStore.LogStream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Queries Loki on behalf of a user. The LogQL project/source matchers are always derived from the sources the caller
 * can access; request filters can only narrow that scope, never widen it.
 */
@Service
public class LogQueryService {

    public static final int DEFAULT_LIMIT = 200;
    public static final int MAX_LIMIT = 1000;
    public static final Duration DEFAULT_RANGE = Duration.ofHours(1);
    public static final Duration MAX_RANGE = Duration.ofDays(7);

    private final DockerLogSourceService sourceService;
    private final LogStore logStore;

    public LogQueryService(DockerLogSourceService sourceService, LogStore logStore) {
        this.sourceService = sourceService;
        this.logStore = logStore;
    }

    public record Params(Long projectId, String environment, UUID sourceId, String container, String level,
                         String text, Instant from, Instant to, Integer limit) {
    }

    public LogQueryResponse query(User user, Params p, Instant now) {
        if (!logStore.isEnabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Log store is disabled");

        Instant to = p.to() != null ? p.to() : now;
        Instant from = p.from() != null ? p.from() : to.minus(DEFAULT_RANGE);
        if (!from.isBefore(to)) throw new IllegalArgumentException("'from' must be before 'to'");
        if (Duration.between(from, to).compareTo(MAX_RANGE) > 0) throw new IllegalArgumentException("Time range must not exceed 7 days");
        int limit = p.limit() == null ? DEFAULT_LIMIT : Math.max(1, Math.min(p.limit(), MAX_LIMIT));

        List<DockerLogSource> scope = sourceService.accessibleSources(user).stream()
                .filter(s -> p.projectId() == null || s.getProjectId().equals(p.projectId()))
                .filter(s -> p.sourceId() == null || s.getId().equals(p.sourceId()))
                .toList();
        if (scope.isEmpty()) return new LogQueryResponse(List.of(), 0, limit, false, from, to);

        String logql = LogQlBuilder.build(new LogQlBuilder.Filter(
                scope.stream().map(DockerLogSource::getProjectId).distinct().toList(),
                scope.stream().map(DockerLogSource::getId).toList(),
                p.environment(), p.container(), Level.parse(p.level()), p.text()));

        List<LogStream> streams;
        try {
            streams = logStore.query(logql, from, to, limit);
        } catch (LogStoreException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Log store unavailable");
        }

        Map<String, DockerLogSource> byId = scope.stream().collect(Collectors.toMap(s -> s.getId().toString(), Function.identity()));
        List<LogQueryResponse.Entry> all = new ArrayList<>();
        boolean streamFull = false;
        for (LogStream st : streams) {
            Map<String, String> l = st.labels();
            DockerLogSource src = byId.get(l.get("source"));
            if (src == null) continue; // defence in depth: never return a line outside the caller's scope
            if (st.lines().size() >= limit) streamFull = true;
            for (LogLine line : st.lines()) {
                all.add(new LogQueryResponse.Entry(
                        Instant.ofEpochSecond(line.tsNanos() / 1_000_000_000L, line.tsNanos() % 1_000_000_000L),
                        Long.toString(line.tsNanos()),
                        LogQlBuilder.detectLevel(line.line()).name(),
                        line.line(), src.getProjectId(), src.getEnvironment(), src.getId().toString(),
                        src.getName(), l.getOrDefault("container", "unknown")));
            }
        }
        all.sort(Comparator.comparing((LogQueryResponse.Entry e) -> Long.parseLong(e.tsNanos())).reversed());
        boolean truncated = streamFull || all.size() > limit;
        List<LogQueryResponse.Entry> page = all.size() > limit ? all.subList(0, limit) : all;
        return new LogQueryResponse(List.copyOf(page), page.size(), limit, truncated, from, to);
    }
}
