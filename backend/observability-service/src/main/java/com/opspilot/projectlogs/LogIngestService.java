package com.opspilot.projectlogs;

import com.opspilot.connector.LogEntry;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.Project;
import com.opspilot.repository.LogRepository;
import com.opspilot.repository.ProjectRepository;
import com.opspilot.security.credential.CredentialMasker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/** Single write path for every source: connectors, pushed app logs and webhooks. */
@Service
public class LogIngestService {

    private final LogRepository logRepository;
    private final ProjectRepository projectRepository;
    private final LogHub hub;

    public LogIngestService(LogRepository logRepository, ProjectRepository projectRepository, LogHub hub) {
        this.logRepository = logRepository;
        this.projectRepository = projectRepository;
        this.hub = hub;
    }

    /**
     * Stamps ownership, masks secrets in the message, stores, then publishes to live subscribers.
     * The entries' ids become the stored row ids, which the SSE stream uses as event ids.
     */
    @Transactional
    public List<LogEntry> ingest(Long projectId, Long integrationId, String sourceName, List<LogEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return List.of();
        }
        Project ref = projectRepository.getReferenceById(projectId);
        List<LogEntity> rows = new ArrayList<>(entries.size());
        for (LogEntry entry : entries) {
            entry.owned(projectId, integrationId);
            entry.setMessage(CredentialMasker.mask(entry.getMessage()));
            rows.add(LogMapper.toEntity(entry, ref, sourceName));
        }
        List<LogEntity> saved = logRepository.saveAll(rows);
        for (int i = 0; i < saved.size(); i++) {
            entries.get(i).setId(String.valueOf(saved.get(i).getLogId()));
        }
        entries.forEach(hub::publish);
        return entries;
    }
}
