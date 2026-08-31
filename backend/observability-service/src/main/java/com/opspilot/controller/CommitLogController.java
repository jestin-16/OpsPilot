package com.opspilot.controller;

import com.opspilot.entity.CommitLogEntity;
import com.opspilot.repository.CommitLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.opspilot.service.GithubSyncService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/commits", "/api/commits"})
public class CommitLogController {

    @Autowired
    private CommitLogRepository commitLogRepository;

    @Autowired
    private GithubSyncService githubSyncService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<CommitLogEntity>> getProjectCommits(@PathVariable Long projectId) {
        List<CommitLogEntity> commits = commitLogRepository.findByProject_IdOrderByTimestampDesc(projectId);
        return ResponseEntity.ok(commits);
    }

    @PostMapping("/project/{projectId}/sync")
    public ResponseEntity<?> syncHistoricalCommits(@PathVariable Long projectId) {
        try {
            int count = githubSyncService.syncHistoricalCommits(projectId);
            return ResponseEntity.ok(java.util.Map.of("synced_count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
