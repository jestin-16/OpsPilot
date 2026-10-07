package com.opspilot.config;

import com.opspilot.entity.DockerLogSource;
import com.opspilot.repository.DockerLogSourceRepository;
import com.opspilot.security.ingest.IngestPrincipal;
import com.opspilot.security.ingest.IngestTokenService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class IngestTokenFilterTest {

    private static final String PATH = "/api/v1/ingest/loki/push";

    private final IngestTokenService tokens = new IngestTokenService();
    private DockerLogSourceRepository repo;
    private IngestTokenFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        repo = mock(DockerLogSourceRepository.class);
        chain = mock(FilterChain.class);
        filter = new IngestTokenFilter(repo, tokens);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private DockerLogSource source(String rawToken, long projectId, String env) {
        DockerLogSource s = new DockerLogSource();
        s.setId(UUID.randomUUID());
        s.setProjectId(projectId);
        s.setName("host-a");
        s.setEnvironment(env);
        s.setTokenHash(tokens.hash(rawToken));
        return s;
    }

    private MockHttpServletRequest request(String path, String authHeader) {
        MockHttpServletRequest r = new MockHttpServletRequest("POST", path);
        r.setRequestURI(path);
        if (authHeader != null) r.addHeader("Authorization", authHeader);
        return r;
    }

    @Test
    void validTokenAuthenticatesWithSourceIdentityFromTheRecord() throws Exception {
        String token = tokens.generate();
        DockerLogSource s = source(token, 7L, "prod");
        when(repo.findByTokenHash(tokens.hash(token))).thenReturn(Optional.of(s));

        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(request(PATH, "Bearer " + token), res, chain);

        verify(chain).doFilter(any(), any());
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        IngestPrincipal p = (IngestPrincipal) auth.getPrincipal();
        assertEquals(s.getId(), p.sourceId());
        assertEquals(7L, p.projectId());
        assertEquals("prod", p.environment());
        assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(IngestTokenFilter.AUTHORITY)));
    }

    @Test
    void missingTokenFallsThroughUnauthenticated() throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(request(PATH, null), res, chain);

        verify(chain).doFilter(any(), any());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(repo);
    }

    @Test
    void unknownTokenIsRejectedWith401() throws Exception {
        when(repo.findByTokenHash(any())).thenReturn(Optional.empty());
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(request(PATH, "Bearer " + tokens.generate()), res, chain);

        assertEquals(401, res.getStatus());
        verify(chain, never()).doFilter(any(), any());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void tokenOfAnotherShapeIsRejectedWithoutDbLookup() throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(request(PATH, "Bearer eyJhbGciOiJIUzI1NiJ9.jwt.like"), res, chain);

        assertEquals(401, res.getStatus());
        verifyNoInteractions(repo);
    }

    @Test
    void revokedOrRotatedTokenIsRejected() throws Exception {
        String oldToken = tokens.generate();
        // the record now holds the hash of a different (rotated) token, so lookup of the old hash finds nothing
        when(repo.findByTokenHash(tokens.hash(oldToken))).thenReturn(Optional.empty());
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(request(PATH, "Bearer " + oldToken), res, chain);
        assertEquals(401, res.getStatus());
    }

    @Test
    void hashCollisionWithMismatchedRecordIsRejected() throws Exception {
        String presented = tokens.generate();
        DockerLogSource other = source(tokens.generate(), 1L, "dev"); // stored hash differs from presented token
        when(repo.findByTokenHash(tokens.hash(presented))).thenReturn(Optional.of(other));
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(request(PATH, "Bearer " + presented), res, chain);
        assertEquals(401, res.getStatus());
    }

    @Test
    void nonIngestPathsAreUntouched() throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(request("/api/v1/projects", "Bearer opl_whatever"), res, chain);

        verify(chain).doFilter(any(), any());
        verifyNoInteractions(repo);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
