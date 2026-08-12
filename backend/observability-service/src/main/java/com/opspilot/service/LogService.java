package com.opspilot.service;

import com.opspilot.entity.Deployment;
import com.opspilot.entity.LogEntity;
import com.opspilot.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LogService {

    @Autowired
    private LogRepository logRepository;

    public List<LogEntity> searchLogs(String sourceService, String logLevel, String query) {
        String serviceParam = (sourceService == null || sourceService.trim().isEmpty() || "ALL".equalsIgnoreCase(sourceService)) ? null : sourceService;
        String levelParam = (logLevel == null || logLevel.trim().isEmpty() || "ALL".equalsIgnoreCase(logLevel)) ? null : logLevel;
        String queryParam = (query == null || query.trim().isEmpty()) ? null : "%" + query.toLowerCase() + "%";

        return logRepository.searchLogs(serviceParam, levelParam, queryParam);
    }

    public LogEntity createLog(Deployment deployment, String sourceService, String logLevel, String message) {
        LogEntity log = new LogEntity(deployment, sourceService, logLevel, message);
        return logRepository.save(log);
    }
}
