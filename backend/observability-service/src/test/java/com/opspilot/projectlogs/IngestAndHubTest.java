package com.opspilot.projectlogs;

import com.opspilot.util.WebhookSignature;
import com.opspilot.connector.LogEntry;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.Project;
import com.opspilot.enums.ProviderType;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import reactor.core.Disposable;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class IngestAndHubTest {

    private static IngestPayloadParser.Result parse(String body, String type) {
        return IngestPayloadParser.parse(body.getBytes(StandardCharsets.UTF_8), type, 1000);
    }

    // ---- payload parsing ----

    @Test
    void parsesASingleJsonObjectWithDjangoStyleFields() {
        IngestPayloadParser.Result r = parse("{\"asctime\":\"2024-05-01T10:00:00Z\",\"levelname\":\"WARNING\",\"message\":\"slow query\","
                + "\"request_id\":\"abc\",\"user\":{\"id\":1}}", "application/json");
        assertEquals(1, r.entries().size());
        LogEntry e = r.entries().get(0);
        assertEquals("WARN", e.getLevel());
        assertEquals(Instant.parse("2024-05-01T10:00:00Z"), e.getTimestamp());
        assertEquals("abc", e.getMetadata().get("request_id"));
        assertFalse(e.getMetadata().containsKey("user"), "nested objects are not flattened into metadata");
        assertEquals(ProviderType.APP_LOGS, e.getSourceType());
    }

    @Test
    void parsesArraysWrappersAndNdjson() {
        assertEquals(2, parse("[{\"message\":\"a\"},{\"msg\":\"b\"}]", "application/json").entries().size());
        assertEquals(2, parse("{\"logs\":[{\"message\":\"a\"},{\"message\":\"b\"}]}", "application/json").entries().size());
        IngestPayloadParser.Result nd = parse("{\"message\":\"a\"}\n{\"message\":\"b\"}\nnot json\n", "application/x-ndjson+json");
        assertEquals(2, nd.entries().size());
        assertEquals(1, nd.rejected());
    }

    @Test
    void plainTextBecomesOneEntryPerLineWithDetectedLevel() {
        IngestPayloadParser.Result r = parse("started\nERROR: db down\n\nfinished", "text/plain");
        assertEquals(3, r.entries().size());
        assertEquals("ERROR", r.entries().get(1).getLevel());
    }

    @Test
    void entriesWithoutAMessageAreRejectedAndCountedAndTheCapIsEnforced() {
        IngestPayloadParser.Result r = parse("[{\"level\":\"INFO\"},{\"message\":\"ok\"}]", "application/json");
        assertEquals(1, r.entries().size());
        assertEquals(1, r.rejected());
        assertEquals(2, IngestPayloadParser.parse("a\nb\nc\nd".getBytes(StandardCharsets.UTF_8), "text/plain", 2).rejected());
    }

    @Test
    void numericTimestampsAcceptSecondsAndMilliseconds() {
        assertEquals(Instant.ofEpochSecond(1714557600L), IngestPayloadParser.parseTime("1714557600"));
        assertEquals(Instant.ofEpochMilli(1714557600123L), IngestPayloadParser.parseTime("1714557600123"));
    }

    // ---- webhook signature ----

    @Test
    void signatureVerificationIsExact() {
        byte[] body = "{\"zen\":\"x\"}".getBytes(StandardCharsets.UTF_8);
        String good = WebhookSignature.sign("shh", body);
        assertTrue(WebhookSignature.verify("shh", body, good));
        assertFalse(WebhookSignature.verify("other", body, good));
        assertFalse(WebhookSignature.verify("shh", "tampered".getBytes(StandardCharsets.UTF_8), good));
        assertFalse(WebhookSignature.verify("shh", body, null));
        assertFalse(WebhookSignature.verify("shh", body, "sha1=abc"));
        assertFalse(WebhookSignature.verify(null, body, good), "no secret configured means nothing can be verified");
    }

    // ---- hub ----

    private static LogEntry entry(long project, String msg) {
        return LogEntry.of(ProviderType.DOCKER, "INFO", msg, Instant.now(), Map.of()).owned(project, 1L);
    }

    @Test
    void hubDeliversOnlyToSubscribersOfThatProject() {
        LogHub hub = new LogHub();
        List<String> a = new ArrayList<>();
        List<String> b = new ArrayList<>();
        Disposable da = hub.stream(1L).subscribe(e -> a.add(e.getMessage()));
        Disposable db = hub.stream(2L).subscribe(e -> b.add(e.getMessage()));

        hub.publish(entry(1, "one"));
        hub.publish(entry(2, "two"));
        hub.publish(entry(3, "nobody listens"));

        assertEquals(List.of("one"), a);
        assertEquals(List.of("two"), b);
        da.dispose();
        db.dispose();
        assertEquals(0, hub.activeProjects(), "channels are released with their last subscriber");
    }

    // ---- ingest service ----

    @Test
    void ingestMasksSecretsStoresAndPublishesWithStoredIds() {
        LogRepository logs = mock(LogRepository.class);
        ProjectRepository projects = mock(ProjectRepository.class);
        LogHub hub = new LogHub();
        Project ref = new Project();
        ref.setId(5L);
        when(projects.getReferenceById(5L)).thenReturn(ref);
        AtomicLong ids = new AtomicLong(100);
        when(logs.saveAll(anyList())).thenAnswer(i -> {
            List<LogEntity> rows = i.getArgument(0);
            rows.forEach(r -> r.setLogId(ids.incrementAndGet()));
            return rows;
        });
        List<LogEntry> live = new ArrayList<>();
        hub.stream(5L).subscribe(live::add);

        List<LogEntry> in = new ArrayList<>(List.of(
                LogEntry.of(ProviderType.APP_LOGS, "INFO", "login ok password=hunter2", Instant.now(), Map.of("service", "web")),
                LogEntry.of(ProviderType.APP_LOGS, "ERROR", "boom", Instant.now(), Map.of())));
        new LogIngestService(logs, projects, hub).ingest(5L, 9L, "django-demo", in);

        ArgumentCaptor<List<LogEntity>> saved = ArgumentCaptor.forClass(List.class);
        verify(logs).saveAll(saved.capture());
        assertFalse(saved.getValue().get(0).getMessage().contains("hunter2"));
        assertEquals("web", saved.getValue().get(0).getSourceService());
        assertEquals("django-demo", saved.getValue().get(1).getSourceService(), "falls back to the integration name");
        assertEquals(9L, saved.getValue().get(0).getIntegrationId());
        assertEquals("APP_LOGS", saved.getValue().get(0).getSourceType());
        assertEquals(List.of("101", "102"), live.stream().map(LogEntry::getId).toList());
        assertEquals(5L, live.get(0).getProjectId());
    }

    @Test
    void ingestOfNothingDoesNotTouchTheDatabase() {
        LogRepository logs = mock(LogRepository.class);
        new LogIngestService(logs, mock(ProjectRepository.class), new LogHub()).ingest(1L, 1L, "x", List.of());
        verifyNoInteractions(logs);
    }

    @Test
    void oversizedMessagesAreTruncated() {
        LogEntry e = LogEntry.of(ProviderType.APP_LOGS, "INFO", "x".repeat(20000), Instant.now(), Map.of());
        assertTrue(LogMapper.toEntity(e, new Project(), "s").getMessage().length() <= LogMapper.MAX_MESSAGE_CHARS + 1);
    }

    @Test
    void liveFilterMatchesTheSameWayAsTheStoredQuery() {
        LogEntry e = LogEntry.of(ProviderType.DOCKER, "ERROR", "Disk FULL", Instant.now(), Map.of("container", "db")).owned(1L, 4L);
        assertTrue(new LogQuery(1L, 4L, "docker", "error", null, null, "full", Map.of("container", "db")).matches(e));
        assertFalse(new LogQuery(1L, 5L, null, null, null, null, null, null).matches(e));
        assertFalse(new LogQuery(1L, null, "KUBERNETES", null, null, null, null, null).matches(e));
        assertFalse(new LogQuery(1L, null, null, "WARN", null, null, null, null).matches(e));
        assertFalse(new LogQuery(1L, null, null, null, null, null, null, Map.of("container", "web")).matches(e));
    }
}
