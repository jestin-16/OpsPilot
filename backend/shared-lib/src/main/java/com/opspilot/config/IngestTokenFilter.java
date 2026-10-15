package com.opspilot.config;

import com.opspilot.entity.DockerLogSource;
import com.opspilot.entity.Integration;
import com.opspilot.enums.IntegrationStatus;
import com.opspilot.enums.ProviderType;
import com.opspilot.repository.IntegrationRepository;
import com.opspilot.security.ingest.ProjectIngestPrincipal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import com.opspilot.repository.DockerLogSourceRepository;
import com.opspilot.security.ingest.IngestPrincipal;
import com.opspilot.security.ingest.IngestTokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates agent pushes on the ingest paths with a per-source Bearer token. Runs before the JWT filter and only
 * touches the paths below. A missing header falls through to the entry point (401); a bad token is rejected here.
 * Tokens are never logged.
 */
@Component
public class IngestTokenFilter extends OncePerRequestFilter {

    public static final String AUTHORITY = "SCOPE_INGEST";
    static final List<String> INGEST_PREFIXES = List.of("/api/v1/ingest/loki/", "/api/ingest/loki/", "/api/v1/ingest/metrics/", "/api/ingest/metrics/");

    /** POST /api/ingest/{projectId}: pushed application logs, authenticated by an APP_LOGS integration token. */
    // Project-token paths: pushed logs (/ingest/{projectId}) and CI-reported deployments (/ingest/{projectId}/deployments).
    static final Pattern PROJECT_INGEST_PATH = Pattern.compile("^/api(?:/v1)?/ingest/(\\d+)(?:/deployments)?/?$");

    private final DockerLogSourceRepository sourceRepository;
    private final IntegrationRepository integrationRepository;
    private final IngestTokenService tokenService;

    public IngestTokenFilter(DockerLogSourceRepository sourceRepository, IntegrationRepository integrationRepository,
                             IngestTokenService tokenService) {
        this.sourceRepository = sourceRepository;
        this.integrationRepository = integrationRepository;
        this.tokenService = tokenService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return INGEST_PREFIXES.stream().noneMatch(path::startsWith) && !PROJECT_INGEST_PATH.matcher(path).matches();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            chain.doFilter(request, response);
            return;
        }
        String token = header.substring(7).trim();
        Matcher projectPath = PROJECT_INGEST_PATH.matcher(request.getRequestURI());
        if (projectPath.matches()) {
            authenticateProjectIngest(Long.parseLong(projectPath.group(1)), token, response, chain, request);
            return;
        }
        Optional<DockerLogSource> source = Optional.empty();
        if (token.startsWith(IngestTokenService.PREFIX) && token.length() <= 128) {
            source = sourceRepository.findByTokenHash(tokenService.hash(token))
                    .filter(s -> tokenService.matches(token, s.getTokenHash()));
        }
        if (source.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Invalid ingest token\"}");
            return;
        }
        DockerLogSource s = source.get();
        IngestPrincipal principal = new IngestPrincipal(s.getId(), s.getProjectId(), s.getEnvironment(), s.getName());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority(AUTHORITY))));
        chain.doFilter(request, response);
    }

    private void authenticateProjectIngest(Long projectId, String token, HttpServletResponse response, FilterChain chain,
                                           HttpServletRequest request) throws IOException, ServletException {
        Optional<Integration> integration = Optional.empty();
        if (token.startsWith(IngestTokenService.PREFIX) && token.length() <= 128) {
            integration = integrationRepository.findByIngestTokenHash(tokenService.hash(token))
                    .filter(i -> tokenService.matches(token, i.getIngestTokenHash()))
                    .filter(i -> i.getProvider() == ProviderType.APP_LOGS)
                    .filter(i -> i.getStatus() != IntegrationStatus.DISCONNECTED)
                    .filter(i -> i.getProject() != null && projectId.equals(i.getProject().getId()));
        }
        if (integration.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Invalid ingest token\"}");
            return;
        }
        Integration i = integration.get();
        ProjectIngestPrincipal principal = new ProjectIngestPrincipal(projectId, i.getId(), i.getName());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority(AUTHORITY))));
        chain.doFilter(request, response);
    }
}
