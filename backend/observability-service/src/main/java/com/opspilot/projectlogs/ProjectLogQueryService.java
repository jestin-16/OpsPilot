package com.opspilot.projectlogs;

import com.opspilot.connector.LogEntry;
import com.opspilot.dto.PagedResponse;
import com.opspilot.entity.LogEntity;
import com.opspilot.repository.LogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectLogQueryService {

    public static final int DEFAULT_SIZE = 100;
    public static final int MAX_SIZE = 500;
    public static final int REPLAY_LIMIT = 1000;

    private final LogRepository logRepository;

    public ProjectLogQueryService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    /** Newest first. */
    @Transactional(readOnly = true)
    public PagedResponse<LogEntry> query(LogQuery query, int page, int size) {
        int pageSize = size <= 0 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        Page<LogEntity> result = logRepository.findAll(query.toSpecification(),
                PageRequest.of(Math.max(page, 0), pageSize, Sort.by(Sort.Direction.DESC, "timestamp").and(Sort.by(Sort.Direction.DESC, "logId"))));
        List<LogEntry> content = result.getContent().stream().map(LogMapper::toEntry).collect(Collectors.toList());
        return new PagedResponse<>(content, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    /** Rows stored after {@code lastId}, oldest first, for SSE Last-Event-ID replay. */
    @Transactional(readOnly = true)
    public List<LogEntry> after(LogQuery query, long lastId) {
        Specification<LogEntity> after = (root, q, cb) -> cb.greaterThan(root.get("logId"), lastId);
        return logRepository.findAll(query.toSpecification().and(after),
                        PageRequest.of(0, REPLAY_LIMIT, Sort.by(Sort.Direction.ASC, "logId")))
                .getContent().stream().map(LogMapper::toEntry).collect(Collectors.toList());
    }
}
