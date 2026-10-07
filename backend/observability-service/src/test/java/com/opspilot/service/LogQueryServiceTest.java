package com.opspilot.service;

import com.opspilot.dto.LogQueryResponse;
import com.opspilot.entity.DockerLogSource;
import com.opspilot.entity.User;
import com.opspilot.logstore.LogStore;
import com.opspilot.logstore.LogStore.LogLine;
import com.opspilot.logstore.LogStore.LogStoreException;
import com.opspilot.logstore.LogStore.LogStream;
import com.opspilot.service.LogQueryService.Params;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class LogQueryServiceTest {

    private final Instant now = Instant.parse("2026-10-07T12:00:00Z");
    private DockerLogSourceService sources;
    private LogStore store;
    private LogQueryService service;
    private final User user = new User();
    private DockerLogSource a;
    private DockerLogSource b;

    private DockerLogSource src(long project, String env, String name) {
        DockerLogSource s = new DockerLogSource();
        s.setId(UUID.randomUUID());
        s.setProjectId(project);
        s.setEnvironment(env);
        s.setName(name);
        return s;
    }

    private long ns(Instant i) {
        return i.getEpochSecond() * 1_000_000_000L;
    }

    @BeforeEach
    void setUp() {
        sources = mock(DockerLogSourceService.class);
        store = mock(LogStore.class);
        when(store.isEnabled()).thenReturn(true);
        service = new LogQueryService(sources, store);
        a = src(1L, "prod", "host-a");
        b = src(2L, "dev", "host-b");
        when(sources.accessibleSources(user)).thenReturn(List.of(a, b));
    }

    private Params params(Long project, UUID source, String level, String text, Integer limit) {
        return new Params(project, null, source, null, level, text, null, null, limit);
    }

    @Test
    void queryAlwaysCarriesTheCallersScopeMatchers() {
        when(store.query(anyString(), any(), any(), anyInt())).thenReturn(List.of());
        service.query(user, params(null, null, null, null, null), now);

        ArgumentCaptor<String> q = ArgumentCaptor.forClass(String.class);
        verify(store).query(q.capture(), any(), any(), eq(200));
        assertTrue(q.getValue().contains("project=~\"1|2\""), q.getValue());
        assertTrue(q.getValue().contains(a.getId().toString()) && q.getValue().contains(b.getId().toString()));
    }

    @Test
    void projectFilterNarrowsButCannotWidenScope() {
        when(store.query(anyString(), any(), any(), anyInt())).thenReturn(List.of());
        service.query(user, params(1L, null, null, null, null), now);
        ArgumentCaptor<String> q = ArgumentCaptor.forClass(String.class);
        verify(store).query(q.capture(), any(), any(), anyInt());
        assertTrue(q.getValue().startsWith("{project=\"1\",source=\"" + a.getId() + "\"}"), q.getValue());
    }

    @Test
    void requestingAProjectOrSourceOutsideScopeYieldsEmptyWithoutHittingTheStore() {
        LogQueryResponse byProject = service.query(user, params(999L, null, null, null, null), now);
        LogQueryResponse bySource = service.query(user, params(null, UUID.randomUUID(), null, null, null), now);
        assertEquals(0, byProject.count());
        assertEquals(0, bySource.count());
        verify(store, never()).query(anyString(), any(), any(), anyInt());
    }

    @Test
    void callerWithNoSourcesGetsNothing() {
        when(sources.accessibleSources(user)).thenReturn(List.of());
        assertEquals(0, service.query(user, params(null, null, null, null, null), now).count());
        verify(store, never()).query(anyString(), any(), any(), anyInt());
    }

    @Test
    void normalisesMergesSortsAndDropsLinesOutsideScope() {
        long t = ns(now.minusSeconds(100));
        when(store.query(anyString(), any(), any(), anyInt())).thenReturn(List.of(
                new LogStream(Map.of("source", a.getId().toString(), "container", "web"),
                        List.of(new LogLine(t + 2_000_000_000L, "ERROR boom"), new LogLine(t, "started"))),
                new LogStream(Map.of("source", b.getId().toString(), "container", "db"),
                        List.of(new LogLine(t + 1_000_000_000L, "WARN slow"))),
                new LogStream(Map.of("source", UUID.randomUUID().toString(), "container", "leak"),
                        List.of(new LogLine(t + 9_000_000_000L, "must not appear")))));

        LogQueryResponse r = service.query(user, params(null, null, null, null, null), now);

        assertEquals(3, r.count());
        assertEquals(List.of("ERROR boom", "WARN slow", "started"), r.entries().stream().map(e -> e.message()).toList());
        assertEquals(List.of("ERROR", "WARN", "INFO"), r.entries().stream().map(e -> e.level()).toList());
        LogQueryResponse.Entry first = r.entries().get(0);
        assertEquals("web", first.container());
        assertEquals("host-a", first.sourceName());
        assertEquals("prod", first.environment());
        assertEquals(1L, first.projectId());
    }

    @Test
    void limitIsClampedAndTruncationFlagged() {
        when(store.query(anyString(), any(), any(), anyInt())).thenReturn(List.of(
                new LogStream(Map.of("source", a.getId().toString()),
                        List.of(new LogLine(ns(now.minusSeconds(5)), "x"), new LogLine(ns(now.minusSeconds(6)), "y")))));

        LogQueryResponse r = service.query(user, params(null, null, null, null, 2), now);
        assertTrue(r.truncated());

        service.query(user, params(null, null, null, null, 999_999), now);
        verify(store).query(anyString(), any(), any(), eq(1000));
        service.query(user, params(null, null, null, null, -5), now);
        verify(store).query(anyString(), any(), any(), eq(1));
    }

    @Test
    void invalidTimeRangesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> service.query(user,
                new Params(null, null, null, null, null, null, now, now.minusSeconds(1), null), now));
        assertThrows(IllegalArgumentException.class, () -> service.query(user,
                new Params(null, null, null, null, null, null, now.minus(Duration.ofDays(8)), now, null), now));
    }

    @Test
    void injectionInFiltersIsRejectedBeforeReachingTheStore() {
        assertThrows(IllegalArgumentException.class, () -> service.query(user,
                new Params(null, "prod\"}", null, null, null, null, null, null, null), now));
        assertThrows(IllegalArgumentException.class, () -> service.query(user,
                new Params(null, null, null, "web\",project=~\".+", null, null, null, null, null), now));
        assertThrows(IllegalArgumentException.class, () -> service.query(user,
                params(null, null, "ERROR\"} or {", null, null), now));
        verify(store, never()).query(anyString(), any(), any(), anyInt());
    }

    @Test
    void storeFailureBecomesBadGatewayAndDisabledBecomes503() {
        when(store.query(anyString(), any(), any(), anyInt())).thenThrow(new LogStoreException("down", false, null));
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> service.query(user, params(null, null, null, null, null), now));
        assertEquals(502, e.getStatusCode().value());

        when(store.isEnabled()).thenReturn(false);
        e = assertThrows(ResponseStatusException.class, () -> service.query(user, params(null, null, null, null, null), now));
        assertEquals(503, e.getStatusCode().value());
    }
}
