package com.opspilot.controller;

import com.opspilot.security.ingest.IngestPrincipal;
import com.opspilot.service.DockerSourceStatusService;
import com.opspilot.service.PrometheusPushRewriter;
import com.opspilot.service.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

class PrometheusPushControllerTest {

    private PrometheusPushRewriter rewriter;
    private DockerSourceStatusService statusService;
    private RateLimitService rateLimitService;
    private PrometheusPushController controller;

    @BeforeEach
    void setUp() {
        rewriter = Mockito.mock(PrometheusPushRewriter.class);
        statusService = Mockito.mock(DockerSourceStatusService.class);
        rateLimitService = Mockito.mock(RateLimitService.class);
        
        io.github.bucket4j.Bucket bucket = Mockito.mock(io.github.bucket4j.Bucket.class);
        when(bucket.tryConsume(1)).thenReturn(true);
        when(rateLimitService.resolveBucket(any())).thenReturn(bucket);

        controller = new PrometheusPushController(rewriter, statusService, rateLimitService, 1000, 100, "http://localhost:9090");
    }

    @Test
    void testUnauthenticatedReturns401() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        ResponseEntity<Void> res = controller.push(null, req);
        assertEquals(401, res.getStatusCode().value());
    }

    @Test
    void testOversizedBodyReturns413() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setContent(new byte[2000]);
        IngestPrincipal principal = new IngestPrincipal(UUID.randomUUID(), 1L, "env1", "src1");
        ResponseEntity<Void> res = controller.push(principal, req);
        assertEquals(413, res.getStatusCode().value());
    }

    @Test
    void testMalformedReturns400() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setContent(new byte[10]);
        when(rewriter.rewrite(any(), any(), anyInt(), any())).thenThrow(new PrometheusPushRewriter.RewriteException("bad", null));
        
        IngestPrincipal principal = new IngestPrincipal(UUID.randomUUID(), 1L, "env1", "src1");
        ResponseEntity<Void> res = controller.push(principal, req);
        assertEquals(400, res.getStatusCode().value());
    }

    @Test
    void testRateLimitExceededReturns429() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        io.github.bucket4j.Bucket bucket = Mockito.mock(io.github.bucket4j.Bucket.class);
        when(bucket.tryConsume(1)).thenReturn(false);
        when(rateLimitService.resolveBucket(any())).thenReturn(bucket);
        
        IngestPrincipal principal = new IngestPrincipal(UUID.randomUUID(), 1L, "env1", "src1");
        ResponseEntity<Void> res = controller.push(principal, req);
        assertEquals(429, res.getStatusCode().value());
    }
}
