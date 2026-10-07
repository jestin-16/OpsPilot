package com.opspilot.service;

import com.opspilot.logstore.LogStore.LogStream;
import com.opspilot.security.ingest.IngestPrincipal;
import com.opspilot.service.LokiPushParser.RawLine;
import com.opspilot.service.LokiPushParser.RawStream;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LogLabelEnforcerTest {

    private final LogLabelEnforcer enforcer = new LogLabelEnforcer();
    private final Instant now = Instant.parse("2026-10-07T12:00:00Z");
    private final UUID sourceId = UUID.randomUUID();
    private final IngestPrincipal principal = new IngestPrincipal(sourceId, 42L, "prod", "host-a");

    private long ns(Instant i) {
        return i.getEpochSecond() * 1_000_000_000L + i.getNano();
    }

    private RawStream stream(Map<String, String> labels, String... lines) {
        List<RawLine> l = new java.util.ArrayList<>();
        long t = ns(now.minusSeconds(60));
        for (String s : lines) l.add(new RawLine(t++, s));
        return new RawStream(labels, l);
    }

    @Test
    void outputLabelsAreExactlyTheFourEnforcedOnes() {
        List<LogStream> out = enforcer.enforce(principal,
                List.of(stream(Map.of("container", "web", "job", "x", "namespace", "n", "pod", "p", "filename", "/f"), "hello")), now);

        assertEquals(1, out.size());
        Map<String, String> labels = out.get(0).labels();
        assertEquals(Set.of("project", "environment", "source", "container"), labels.keySet());
        assertEquals("42", labels.get("project"));
        assertEquals("prod", labels.get("environment"));
        assertEquals(sourceId.toString(), labels.get("source"));
        assertEquals("web", labels.get("container"));
    }

    @Test
    void clientCannotSpoofProjectEnvironmentOrSource() {
        List<LogStream> out = enforcer.enforce(principal, List.of(stream(Map.of(
                "project", "999", "environment", "staging", "source", "00000000-0000-0000-0000-000000000000",
                "container", "api"), "x")), now);

        Map<String, String> labels = out.get(0).labels();
        assertEquals("42", labels.get("project"));
        assertEquals("prod", labels.get("environment"));
        assertEquals(sourceId.toString(), labels.get("source"));
        assertEquals("api", labels.get("container"));
    }

    @Test
    void containerHintIsSanitisedAndCapped() {
        assertEquals("my_app", LogLabelEnforcer.sanitizeContainer("/my app"));
        assertEquals("a_b__c", LogLabelEnforcer.sanitizeContainer("a\"b{}c"));
        assertEquals(128, LogLabelEnforcer.sanitizeContainer("x".repeat(500)).length());
        assertEquals("unknown", LogLabelEnforcer.containerOf(Map.of("foo", "bar")));
        assertEquals("svc", LogLabelEnforcer.containerOf(Map.of("service_name", "svc")));
        assertEquals("unknown", LogLabelEnforcer.containerOf(Map.of("container", "")));
    }

    @Test
    void streamsOfTheSameContainerAreMergedAndOrdered() {
        RawStream a = new RawStream(Map.of("container", "web"),
                List.of(new RawLine(ns(now.minusSeconds(10)), "second"), new RawLine(ns(now.minusSeconds(20)), "first")));
        RawStream b = new RawStream(Map.of("container_name", "/web"), List.of(new RawLine(ns(now.minusSeconds(5)), "third")));
        RawStream c = new RawStream(Map.of("container", "db"), List.of(new RawLine(ns(now.minusSeconds(5)), "other")));

        List<LogStream> out = enforcer.enforce(principal, List.of(a, b, c), now);

        assertEquals(2, out.size());
        LogStream web = out.stream().filter(s -> s.labels().get("container").equals("web")).findFirst().orElseThrow();
        assertEquals(List.of("first", "second", "third"), web.lines().stream().map(l -> l.line()).toList());
    }

    @Test
    void dropsTooOldTooFutureAndEmptyLines() {
        RawStream s = new RawStream(Map.of("container", "web"), List.of(
                new RawLine(ns(now.minus(Duration.ofDays(30))), "ancient"),
                new RawLine(ns(now.plus(Duration.ofHours(2))), "future"),
                new RawLine(ns(now.minusSeconds(1)), ""),
                new RawLine(ns(now.minusSeconds(1)), "ok")));

        List<LogStream> out = enforcer.enforce(principal, List.of(s), now);

        assertEquals(1, out.size());
        assertEquals(List.of("ok"), out.get(0).lines().stream().map(l -> l.line()).toList());
    }

    @Test
    void emptyInputProducesNoStreams() {
        assertTrue(enforcer.enforce(principal, List.of(), now).isEmpty());
    }

    @Test
    void oversizedLinesAreTruncated() {
        RawStream s = stream(Map.of("container", "web"), "y".repeat(LogLabelEnforcer.MAX_LINE_BYTES + 100));
        List<LogStream> out = enforcer.enforce(principal, List.of(s), now);
        assertEquals(LogLabelEnforcer.MAX_LINE_BYTES, out.get(0).lines().get(0).line().length());
    }
}
