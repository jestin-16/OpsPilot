package com.opspilot.service;

import com.opspilot.dto.DockerLogSourceRequest;
import com.opspilot.dto.DockerLogSourceResponse;
import com.opspilot.entity.DockerLogSource;
import com.opspilot.entity.Project;
import com.opspilot.entity.Role;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.DockerLogSourceRepository;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.security.ingest.IngestTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DockerLogSourceServiceTest {

    private DockerLogSourceRepository repo;
    private ProjectRepository projects;
    private DockerLogSourceService service;
    private final IngestTokenService tokens = new IngestTokenService();
    private User owner;
    private User stranger;

    @BeforeEach
    void setUp() {
        repo = mock(DockerLogSourceRepository.class);
        projects = mock(ProjectRepository.class);
        service = new DockerLogSourceService(repo, projects, tokens,
                new DockerSourceStatusService(repo, Duration.ofMinutes(5)),
                new DockerAgentConfigService("http://localhost"));
        owner = user(1L, "DEVELOPER");
        stranger = user(2L, "DEVELOPER");
        Project p = new Project();
        p.setId(10L);
        p.setOwner(owner);
        when(projects.findById(10L)).thenReturn(Optional.of(p));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private User user(long id, String role) {
        User u = new User();
        u.setId(id);
        Role r = new Role();
        r.setRoleName(role);
        u.setRoles(Set.of(r));
        return u;
    }

    private DockerLogSourceRequest req(String name, String env) {
        DockerLogSourceRequest r = new DockerLogSourceRequest();
        r.setName(name);
        r.setEnvironment(env);
        r.setProjectId(10L);
        return r;
    }

    @Test
    void createReturnsRawTokenOnceAndStoresOnlyItsHash() {
        DockerLogSourceResponse res = service.create(req("host-a", "Prod"), owner);

        assertNotNull(res.getToken());
        assertTrue(res.getToken().startsWith("opl_"));
        assertEquals("prod", res.getEnvironment());
        assertEquals("WAITING", res.getStatus());
        ArgumentCaptor<DockerLogSource> cap = ArgumentCaptor.forClass(DockerLogSource.class);
        verify(repo).save(cap.capture());
        DockerLogSource saved = cap.getValue();
        assertEquals(tokens.hash(res.getToken()), saved.getTokenHash());
        assertNotEquals(res.getToken(), saved.getTokenHash());
        assertTrue(res.getToken().startsWith(saved.getTokenPrefix()));
    }

    @Test
    void subsequentReadsNeverContainTheToken() {
        DockerLogSource s = new DockerLogSource();
        s.setProjectId(10L);
        s.setName("n");
        s.setEnvironment("prod");
        s.setTokenHash("h");
        s.setTokenPrefix("opl_abcd");
        when(repo.findById(any())).thenReturn(Optional.of(s));
        assertNull(service.get(java.util.UUID.randomUUID(), owner).getToken());
    }

    @Test
    void rotateInvalidatesOldTokenAndReturnsNewOnce() {
        DockerLogSource s = new DockerLogSource();
        s.setProjectId(10L);
        s.setName("n");
        s.setEnvironment("prod");
        String old = tokens.generate();
        s.setTokenHash(tokens.hash(old));
        s.setTokenPrefix(tokens.displayPrefix(old));
        when(repo.findById(any())).thenReturn(Optional.of(s));

        DockerLogSourceResponse res = service.rotateToken(java.util.UUID.randomUUID(), owner);

        assertNotNull(res.getToken());
        assertFalse(tokens.matches(old, s.getTokenHash()));
        assertTrue(tokens.matches(res.getToken(), s.getTokenHash()));
    }

    @Test
    void nonOwnerCannotCreate() {
        assertThrows(ForbiddenException.class, () -> service.create(req("x", "prod"), stranger));
    }

    @Test
    void adminCanCreateOnAnyProject() {
        assertNotNull(service.create(req("x", "prod"), user(99L, "ADMIN")).getToken());
    }

    @Test
    void rejectsInvalidInput() {
        assertThrows(IllegalArgumentException.class, () -> service.create(req("", "prod"), owner));
        assertThrows(IllegalArgumentException.class, () -> service.create(req("x", "prod env"), owner));
        assertThrows(IllegalArgumentException.class, () -> service.create(req("x", "a\"b"), owner));
        assertThrows(IllegalArgumentException.class, () -> service.create(req("x", ""), owner));
        DockerLogSourceRequest noProject = req("x", "prod");
        noProject.setProjectId(null);
        assertThrows(IllegalArgumentException.class, () -> service.create(noProject, owner));
    }
}
