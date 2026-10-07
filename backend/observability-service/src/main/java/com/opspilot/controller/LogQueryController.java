package com.opspilot.controller;

import com.opspilot.dto.LogQueryResponse;
import com.opspilot.entity.User;
import com.opspilot.service.LogQueryService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.UUID;

/** Log search over Loki. Takes structured filters only; the backend builds the query and scopes it to the caller. */
@RestController
@RequestMapping({"/api/v1/logs/query", "/api/logs/query"})
public class LogQueryController {

    private final LogQueryService service;

    public LogQueryController(LogQueryService service) {
        this.service = service;
    }

    @GetMapping
    public LogQueryResponse query(
            @RequestParam(required = false) Long project,
            @RequestParam(required = false) String environment,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String container,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String text,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal User user) {
        return service.query(user, new LogQueryService.Params(project, blankToNull(environment), parseUuid(source),
                blankToNull(container), blankToNull(level), blankToNull(text), parseTime(from, "from"),
                parseTime(to, "to"), limit), Instant.now());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static UUID parseUuid(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return UUID.fromString(s.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid source id");
        }
    }

    /** Accepts ISO-8601 instants or epoch milliseconds. */
    static Instant parseTime(String s, String name) {
        if (s == null || s.isBlank()) return null;
        try {
            String t = s.trim();
            return t.matches("^\\d{10,16}$") ? Instant.ofEpochMilli(Long.parseLong(t)) : Instant.parse(t);
        } catch (DateTimeParseException | NumberFormatException e) {
            throw new IllegalArgumentException("Invalid " + name + " timestamp");
        }
    }
}
