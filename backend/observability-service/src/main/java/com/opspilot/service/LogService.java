package com.opspilot.service;

import com.opspilot.entity.Deployment;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.User;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LogService {

    @Autowired
    private LogRepository logRepository;

    @Autowired(required = false)
    private List<com.opspilot.provider.LogProvider> logProviders;

    public List<LogEntity> searchLogs(User currentUser, Long projectId, String sourceService, String logLevel, String query, String providerName) {
        if (currentUser == null) throw new ForbiddenException("Authentication is required to view logs");
        String serviceParam = (sourceService == null || sourceService.trim().isEmpty() || "ALL".equalsIgnoreCase(sourceService)) ? null : sourceService;
        String levelParam = (logLevel == null || logLevel.trim().isEmpty() || "ALL".equalsIgnoreCase(logLevel)) ? null : logLevel;
        String queryParam = (query == null || query.trim().isEmpty()) ? null : "%" + query.toLowerCase() + "%";

        List<LogEntity> mergedLogs = new java.util.ArrayList<>();

        boolean fetchLocal = (providerName == null || providerName.equalsIgnoreCase("local") || providerName.equalsIgnoreCase("all"));
        boolean fetchExternal = isAdministrator(currentUser) && logProviders != null
            && (providerName != null && !providerName.equalsIgnoreCase("local"));

        if (fetchLocal) {
            List<LogEntity> localLogs = isAdministrator(currentUser)
                    ? logRepository.searchLogs(projectId, serviceParam, levelParam, queryParam)
                    : logRepository.searchLogsForOwner(currentUser.getId(), projectId, serviceParam, levelParam, queryParam);
            localLogs.forEach(log -> log.setProviderSource("local"));
            mergedLogs.addAll(localLogs);
        }

        if (fetchExternal) {
            for (com.opspilot.provider.LogProvider provider : logProviders) {
                if (providerName.equalsIgnoreCase("all") || provider.getProviderName().equalsIgnoreCase(providerName)) {
                    List<LogEntity> externalLogs = provider.fetchLogs(sourceService, logLevel, query);
                    if (externalLogs != null) {
                        externalLogs.forEach(log -> log.setProviderSource(provider.getProviderName()));
                        mergedLogs.addAll(externalLogs);
                    }
                }
            }
        }

        mergedLogs.sort((l1, l2) -> {
            if (l1.getTimestamp() == null) return 1;
            if (l2.getTimestamp() == null) return -1;
            return l2.getTimestamp().compareTo(l1.getTimestamp());
        });

        return mergedLogs;
    }

    private boolean isAdministrator(User user) {
        return user.getRoles().stream().anyMatch(role ->
                "ADMIN".equalsIgnoreCase(role.getRoleName()) || "ROLE_ADMIN".equalsIgnoreCase(role.getRoleName()));
    }

    public LogEntity createLog(Deployment deployment, String sourceService, String logLevel, String message) {
        LogEntity log = new LogEntity(deployment, sourceService, logLevel, message);
        return logRepository.save(log);
    }
}
