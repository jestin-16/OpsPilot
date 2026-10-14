package com.opspilot.projectlogs;

import com.opspilot.connector.LogEntry;
import com.opspilot.connector.Levels;
import com.opspilot.entity.LogEntity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/** Filters for reading project logs, shared by the paged query and the live stream. */
public record LogQuery(Long projectId, Long integrationId, String type, String level, Instant from, Instant to,
                       String text, Map<String, String> metadata) {

    private static final ZoneId ZONE = ZoneId.systemDefault();

    public LogQuery {
        level = level == null || level.isBlank() || level.equalsIgnoreCase("ALL") ? null : Levels.normalize(level);
        type = type == null || type.isBlank() || type.equalsIgnoreCase("ALL") ? null : type.trim().toUpperCase(Locale.ROOT);
        text = text == null || text.isBlank() ? null : text;
        metadata = metadata == null ? Map.of() : new TreeMap<>(metadata);
    }

    public Specification<LogEntity> toSpecification() {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("project").get("id"), projectId));
            if (integrationId != null) p.add(cb.equal(root.get("integrationId"), integrationId));
            if (type != null) p.add(cb.equal(root.get("sourceType"), type));
            if (level != null) p.add(cb.equal(cb.upper(root.get("logLevel")), level));
            if (from != null) p.add(cb.greaterThanOrEqualTo(root.get("timestamp"), LocalDateTime.ofInstant(from, ZONE)));
            if (to != null) p.add(cb.lessThanOrEqualTo(root.get("timestamp"), LocalDateTime.ofInstant(to, ZONE)));
            if (text != null) p.add(cb.like(cb.lower(root.get("message")), "%" + escape(text.toLowerCase(Locale.ROOT)) + "%", '\\'));
            metadata.forEach((k, v) -> p.add(cb.like(root.get("metadata"), "%" + escape(LogMapper.metadataFragment(k, v)) + "%", '\\')));
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    /** Same filters applied to a live entry. */
    public boolean matches(LogEntry e) {
        if (integrationId != null && !integrationId.equals(e.getIntegrationId())) return false;
        if (type != null && (e.getSourceType() == null || !e.getSourceType().name().equals(type))) return false;
        if (level != null && !level.equalsIgnoreCase(e.getLevel())) return false;
        if (from != null && e.getTimestamp().isBefore(from)) return false;
        if (to != null && e.getTimestamp().isAfter(to)) return false;
        if (text != null && (e.getMessage() == null || !e.getMessage().toLowerCase(Locale.ROOT).contains(text.toLowerCase(Locale.ROOT)))) return false;
        for (Map.Entry<String, String> m : metadata.entrySet()) {
            if (!m.getValue().equals(e.getMetadata().get(m.getKey()))) return false;
        }
        return true;
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
