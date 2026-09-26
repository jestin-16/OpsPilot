package com.opspilot.controller;

import com.opspilot.entity.CommitLogEntity;
import com.opspilot.repository.CommitLogRepository;
import com.opspilot.service.GithubSyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/commits", "/api/commits"})
public class CommitLogController {

    @Autowired
    private CommitLogRepository commitLogRepository;

    @Autowired
    private GithubSyncService githubSyncService;

    @GetMapping
    public ResponseEntity<List<CommitLogEntity>> getAllCommits() {
        List<CommitLogEntity> commits = commitLogRepository.findTop50ByOrderByTimestampDesc();
        return ResponseEntity.ok(commits);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<CommitLogEntity>> getProjectCommits(@PathVariable Long projectId) {
        List<CommitLogEntity> commits = commitLogRepository.findByProject_IdOrderByTimestampDesc(projectId);
        return ResponseEntity.ok(commits);
    }

    @PostMapping("/sync")
    public ResponseEntity<?> syncAllProjects() {
        try {
            int count = githubSyncService.syncAllProjects();
            return ResponseEntity.ok(Map.of("synced_count", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("synced_count", 0, "warning", e.getMessage()));
        }
    }

    @PostMapping("/project/{projectId}/sync")
    public ResponseEntity<?> syncHistoricalCommits(@PathVariable Long projectId) {
        try {
            int count = githubSyncService.syncHistoricalCommits(projectId);
            return ResponseEntity.ok(Map.of("synced_count", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("synced_count", 0, "warning", e.getMessage()));
        }
    }
}
