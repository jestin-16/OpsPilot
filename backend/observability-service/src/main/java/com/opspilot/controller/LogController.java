package com.opspilot.controller;

import com.opspilot.entity.LogEntity;
import com.opspilot.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/logs", "/api/logs"})
public class LogController {

    @Autowired
    private LogService logService;

    @GetMapping
    public ResponseEntity<List<LogEntity>> getLogs(
            @RequestParam(required = false) String sourceService,
            @RequestParam(required = false) String logLevel,
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "local") String providerName
    ) {
        return ResponseEntity.ok(logService.searchLogs(sourceService, logLevel, query, providerName));
    }

    @PostMapping
    public ResponseEntity<LogEntity> createLog(@RequestBody LogEntity log) {
        return ResponseEntity.ok(logService.createLog(null, log.getSourceService(), log.getLogLevel(), log.getMessage()));
    }
}
