package com.opspilot.projectlogs;

import com.opspilot.connector.LogEntry;
import com.opspilot.dto.PagedResponse;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.enums.ProviderType;
import com.opspilot.repository.LogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Runs the real query specification against an in-memory database. */
@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "eureka.client.enabled=false",
        // other entities in the module declare jsonb columns; give H2 a stand-in type
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.url=jdbc:h2:mem:projectlogs;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;INIT=CREATE DOMAIN IF NOT EXISTS JSONB AS VARCHAR(100000)"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProjectLogQueryJpaTest {

    @Autowired private TestEntityManager em;
    @Autowired private LogRepository logRepository;

    private ProjectLogQueryService service;
    private LogIngestService ingest;
    private Project p1;
    private Project p2;

    @BeforeEach
    void seed() {
        service = new ProjectLogQueryService(logRepository);
        User owner = new User();
        owner.setName("o");
        owner.setEmail("o@example.com");
        owner.setPasswordHash("x");
        em.persist(owner);
        p1 = em.persist(new Project("One", null, null, owner, "Active"));
        p2 = em.persist(new Project("Two", null, null, owner, "Active"));
        // ProjectRepository is not part of the slice's mocks; store through the mapper directly.
        Instant base = Instant.parse("2024-05-01T10:00:00Z");
        save(p1, 1L, ProviderType.DOCKER, "INFO", "server started", base, Map.of("container", "web"));
        save(p1, 1L, ProviderType.DOCKER, "ERROR", "db 100% down_now", base.plus(1, ChronoUnit.MINUTES), Map.of("container", "db"));
        save(p1, 2L, ProviderType.KUBERNETES, "WARN", "slow request", base.plus(2, ChronoUnit.MINUTES), Map.of("pod", "api-1", "namespace", "prod"));
        save(p2, 9L, ProviderType.DOCKER, "ERROR", "other project error", base, Map.of("container", "web"));
        em.flush();
        em.clear();
    }

    private void save(Project p, Long integrationId, ProviderType type, String level, String msg, Instant at, Map<String, String> meta) {
        LogEntry e = LogEntry.of(type, level, msg, at, meta).owned(p.getId(), integrationId);
        logRepository.save(LogMapper.toEntity(e, p, "it"));
    }

    private LogQuery q(Long projectId, Long integration, String type, String level, Instant from, Instant to, String text, Map<String, String> meta) {
        return new LogQuery(projectId, integration, type, level, from, to, text, meta);
    }

    @Test
    void isolatesProjectsAndSortsNewestFirst() {
        PagedResponse<LogEntry> page = service.query(q(p1.getId(), null, null, null, null, null, null, null), 0, 50);
        assertEquals(3, page.getTotalElements());
        assertEquals("slow request", page.getContent().get(0).getMessage());
        assertTrue(page.getContent().stream().allMatch(e -> e.getProjectId().equals(p1.getId())));
    }

    @Test
    void filtersByIntegrationTypeAndLevel() {
        assertEquals(2, service.query(q(p1.getId(), 1L, null, null, null, null, null, null), 0, 50).getTotalElements());
        assertEquals(1, service.query(q(p1.getId(), null, "kubernetes", null, null, null, null, null), 0, 50).getTotalElements());
        assertEquals(1, service.query(q(p1.getId(), null, null, "error", null, null, null, null), 0, 50).getTotalElements());
        assertEquals(3, service.query(q(p1.getId(), null, "ALL", "ALL", null, null, null, null), 0, 50).getTotalElements());
    }

    @Test
    void filtersByTimeRange() {
        Instant from = Instant.parse("2024-05-01T10:01:00Z");
        Instant to = Instant.parse("2024-05-01T10:01:30Z");
        List<LogEntry> got = service.query(q(p1.getId(), null, null, null, from, to, null, null), 0, 50).getContent();
        assertEquals(1, got.size());
        assertEquals("ERROR", got.get(0).getLevel());
    }

    @Test
    void textSearchIsCaseInsensitiveAndTreatsWildcardsLiterally() {
        assertEquals(1, service.query(q(p1.getId(), null, null, null, null, null, "SERVER", null), 0, 50).getTotalElements());
        assertEquals(1, service.query(q(p1.getId(), null, null, null, null, null, "100% down_now", null), 0, 50).getTotalElements());
        assertEquals(0, service.query(q(p1.getId(), null, null, null, null, null, "%", null), 0, 50).getTotalElements() - 1,
                "a lone % must match only messages that contain a percent sign");
    }

    @Test
    void metadataSelectorsNarrowToOneSource() {
        assertEquals(1, service.query(q(p1.getId(), null, null, null, null, null, null, Map.of("container", "web")), 0, 50).getTotalElements());
        assertEquals(1, service.query(q(p1.getId(), null, null, null, null, null, null, Map.of("pod", "api-1", "namespace", "prod")), 0, 50).getTotalElements());
        assertEquals(0, service.query(q(p1.getId(), null, null, null, null, null, null, Map.of("container", "nope")), 0, 50).getTotalElements());
    }

    @Test
    void paginatesAndReplaysAfterAnId() {
        PagedResponse<LogEntry> first = service.query(q(p1.getId(), null, null, null, null, null, null, null), 0, 2);
        assertEquals(2, first.getContent().size());
        assertFalse(first.isLast());
        assertTrue(service.query(q(p1.getId(), null, null, null, null, null, null, null), 1, 2).isLast());

        long firstId = Long.parseLong(service.after(q(p1.getId(), null, null, null, null, null, null, null), 0).get(0).getId());
        List<LogEntry> replay = service.after(q(p1.getId(), null, null, null, null, null, null, null), firstId);
        assertEquals(2, replay.size());
        assertTrue(Long.parseLong(replay.get(0).getId()) < Long.parseLong(replay.get(1).getId()), "replay is oldest first");
    }
}
