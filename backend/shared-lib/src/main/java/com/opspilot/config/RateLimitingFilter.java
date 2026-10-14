package com.opspilot.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_ATTEMPTS = 50;
    private static final long WINDOW_MS = 15 * 60 * 1000; // 15 minutes

    /** Above this many tracked clients, idle entries are swept so the map can't grow without bound. */
    static final int SWEEP_THRESHOLD = 10_000;

    private final Map<String, List<Long>> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (isRateLimitedEndpoint(path) && "POST".equalsIgnoreCase(request.getMethod())) {
            String clientIp = getClientIP(request);
            long currentTime = System.currentTimeMillis();

            List<Long> timestamps = requestCounts.computeIfAbsent(clientIp, k -> new ArrayList<>());

            synchronized (timestamps) {
                // Remove timestamps older than window
                timestamps.removeIf(t -> (currentTime - t) > WINDOW_MS);

                if (timestamps.size() >= MAX_ATTEMPTS) {
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Maximum attempts allowed per 15 minutes.\"}");
                    return;
                }

                timestamps.add(currentTime);
            }

            if (requestCounts.size() > SWEEP_THRESHOLD) {
                sweepIdle(currentTime);
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimitedEndpoint(String path) {
        return path.endsWith("/api/auth/login") || path.endsWith("/api/auth/register") ||
               path.endsWith("/api/v1/auth/login") || path.endsWith("/api/v1/auth/register");
    }

    /**
     * The API gateway appends the address it received the request from to X-Forwarded-For, so the right-most
     * entry is the only one a client can't forge; anything to its left is client-supplied.
     */
    String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null) {
            String[] hops = xfHeader.split(",");
            for (int i = hops.length - 1; i >= 0; i--) {
                String hop = hops[i].trim();
                if (!hop.isEmpty()) {
                    return hop;
                }
            }
        }
        return request.getRemoteAddr();
    }

    private void sweepIdle(long now) {
        requestCounts.entrySet().removeIf(entry -> {
            List<Long> timestamps = entry.getValue();
            synchronized (timestamps) {
                timestamps.removeIf(t -> (now - t) > WINDOW_MS);
                return timestamps.isEmpty();
            }
        });
    }

    int trackedClients() {
        return requestCounts.size();
    }
}
