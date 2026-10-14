package com.opspilot.projectlogs;

import com.opspilot.connector.ConnectionResult;
import com.opspilot.connector.ConnectorConfig;
import com.opspilot.connector.ConnectorRegistry;
import com.opspilot.connector.IntegrationConnector;
import com.opspilot.connector.LogEntry;
import com.opspilot.connector.LogFilters;
import com.opspilot.entity.Integration;
import com.opspilot.entity.Project;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;
import com.opspilot.repository.IntegrationRepository;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ConnectorRunnerAndStreamTest {

    /** Connector whose stream is driven by the test. */
    private static class FakeConnector implements IntegrationConnector {
        final ProviderType type;
        final boolean push;
        final Sinks.Many<LogEntry> sink = Sinks.many().multicast().directBestEffort();
        final AtomicInteger subscriptions = new AtomicInteger();
        final List<ConnectorConfig> configs = new CopyOnWriteArrayList<>();

        FakeConnector(ProviderType type, boolean push) {
            this.type = type;
            this.push = push;
        }

        public ProviderType type() { return type; }
        public boolean isPushBased() { return push; }
        public ConnectionResult testConnection(ConnectorConfig c) { return ConnectionResult.success("ok"); }
        public Flux<LogEntry> streamLogs(ConnectorConfig c, LogFilters f) {
            configs.add(c);
            return sink.asFlux().doOnSubscribe(s -> subscriptions.incrementAndGet());
        }
        public List<LogEntry> fetchHistory(ConnectorConfig c, LogFilters f, int page) { return List.of(); }
    }

    private static Integration integration(long id, ProviderType type, IntegrationStatus status, LocalDateTime updated) {
        Project p = new Project();
        p.setId(7L);
        Integration i = new Integration();
        i.setId(id);
        i.setProject(p);
        i.setProvider(type);
        i.setName("int-" + id);
        i.setStatus(status);
        i.setConfiguration("{\"host\":\"h\"}");
        i.setCredentialReference("{\"token\":\"t\"}");
        i.setUpdatedAt(updated);
        return i;
    }

    private static LogEntry entry(String msg) {
        return LogEntry.of(ProviderType.DOCKER, "INFO", msg, Instant.now(), Map.of());
    }

    @Test
    void runnerStreamsConnectedPullIntegrationsAndStoresBatches() throws Exception {
        FakeConnector docker = new FakeConnector(ProviderType.DOCKER, false);
        FakeConnector appLogs = new FakeConnector(ProviderType.APP_LOGS, true);
        IntegrationRepository repo = mock(IntegrationRepository.class);
        LogIngestService ingest = mock(LogIngestService.class);
        LocalDateTime t0 = LocalDateTime.now();
        when(repo.findByStatus(IntegrationStatus.CONNECTED)).thenReturn(List.of(
                integration(1, ProviderType.DOCKER, IntegrationStatus.CONNECTED, t0),
                integration(2, ProviderType.APP_LOGS, IntegrationStatus.CONNECTED, t0)));
        ConnectorRunner runner = new ConnectorRunner(repo, new ConnectorRegistry(List.of(docker, appLogs)), ingest, true, Duration.ofMinutes(10));

        runner.reconcile();
        runner.reconcile(); // unchanged: must not resubscribe

        assertEquals(1, runner.activeStreams(), "push-based integrations have nothing to follow");
        assertEquals(1, docker.subscriptions.get());
        assertEquals(0, appLogs.subscriptions.get());
        assertEquals("h", docker.configs.get(0).setting("host"));
        assertEquals("t", docker.configs.get(0).secret("token"));
        assertEquals(7L, docker.configs.get(0).projectId());

        docker.sink.tryEmitNext(entry("one"));
        docker.sink.tryEmitNext(entry("two"));
        verify(ingest, timeout(5000)).ingest(eq(7L), eq(1L), eq("int-1"), argThatSize(2));
        runner.shutdown();
    }

    private static List<LogEntry> argThatSize(int n) {
        return org.mockito.ArgumentMatchers.argThat(l -> l != null && l.size() == n);
    }

    @Test
    void runnerStopsDisconnectedAndRestartsEditedIntegrations() {
        FakeConnector docker = new FakeConnector(ProviderType.DOCKER, false);
        IntegrationRepository repo = mock(IntegrationRepository.class);
        LocalDateTime t0 = LocalDateTime.now();
        when(repo.findByStatus(IntegrationStatus.CONNECTED))
                .thenReturn(List.of(integration(1, ProviderType.DOCKER, IntegrationStatus.CONNECTED, t0)))
                .thenReturn(List.of(integration(1, ProviderType.DOCKER, IntegrationStatus.CONNECTED, t0.plusMinutes(1))))
                .thenReturn(List.of());
        ConnectorRunner runner = new ConnectorRunner(repo, new ConnectorRegistry(List.of(docker)), mock(LogIngestService.class), true, Duration.ofMinutes(10));

        runner.reconcile();
        assertEquals(1, docker.subscriptions.get());
        runner.reconcile(); // updatedAt changed: settings were edited
        assertEquals(2, docker.subscriptions.get());
        assertEquals(1, runner.activeStreams());
        runner.reconcile(); // no longer connected
        assertEquals(0, runner.activeStreams());
    }

    @Test
    void runnerRetriesAFailingStreamInsteadOfDying() {
        AtomicInteger attempts = new AtomicInteger();
        IntegrationConnector flaky = new FakeConnector(ProviderType.GITHUB, false) {
            @Override
            public Flux<LogEntry> streamLogs(ConnectorConfig c, LogFilters f) {
                return attempts.incrementAndGet() < 2 ? Flux.error(new IllegalStateException("down")) : Flux.never();
            }
        };
        IntegrationRepository repo = mock(IntegrationRepository.class);
        when(repo.findByStatus(IntegrationStatus.CONNECTED))
                .thenReturn(List.of(integration(3, ProviderType.GITHUB, IntegrationStatus.CONNECTED, LocalDateTime.now())));
        ConnectorRunner runner = new ConnectorRunner(repo, new ConnectorRegistry(List.of(flaky)), mock(LogIngestService.class), true, Duration.ofMinutes(10));

        runner.reconcile();
        org.awaitility.Awaitility.await().atMost(Duration.ofSeconds(10)).untilAtomic(attempts, org.hamcrest.Matchers.greaterThanOrEqualTo(2));
        assertEquals(1, runner.activeStreams());
        runner.shutdown();
    }

    @Test
    void disabledRunnerDoesNothing() {
        IntegrationRepository repo = mock(IntegrationRepository.class);
        new ConnectorRunner(repo, new ConnectorRegistry(List.of()), mock(LogIngestService.class), false, Duration.ofMinutes(1)).reconcile();
        verifyNoInteractions(repo);
    }

    // ---- SSE replay (Last-Event-ID) ----

    @Test
    void replayDeliversMissedRowsThenLiveEntriesWithoutDuplicates() {
        LogHub hub = new LogHub();
        ProjectLogQueryService query = mock(ProjectLogQueryService.class);
        LogEntry missed1 = entryWithId("11");
        LogEntry missed2 = entryWithId("12");
        when(query.after(any(), anyLong())).thenAnswer(inv -> {
            // an entry stored (and published) while the replay query runs must not be lost or duplicated
            hub.publish(entryWithId("12"));
            hub.publish(entryWithId("13"));
            return List.of(missed1, missed2);
        });
        ProjectLogController controller = new ProjectLogController(mock(ProjectAccess.class), query, hub);

        List<String> got = new ArrayList<>();
        var sub = controller.replayThenLive(new LogQuery(7L, null, null, null, null, null, null, null), 10).subscribe(e -> got.add(e.getId()));
        hub.publish(entryWithId("14"));

        assertEquals(List.of("11", "12", "13", "14"), got);
        sub.dispose();
        assertEquals(0, hub.activeProjects());
    }

    private static LogEntry entryWithId(String id) {
        LogEntry e = entry("m" + id).owned(7L, 1L);
        e.setId(id);
        return e;
    }
}
