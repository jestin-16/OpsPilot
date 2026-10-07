package com.opspilot.config;

import com.opspilot.entity.DockerLogSource;
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
    static final List<String> INGEST_PREFIXES = List.of("/api/v1/ingest/loki/", "/api/ingest/loki/");

    private final DockerLogSourceRepository sourceRepository;
    private final IngestTokenService tokenService;

    public IngestTokenFilter(DockerLogSourceRepository sourceRepository, IngestTokenService tokenService) {
        this.sourceRepository = sourceRepository;
        this.tokenService = tokenService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return INGEST_PREFIXES.stream().noneMatch(path::startsWith);
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
}
