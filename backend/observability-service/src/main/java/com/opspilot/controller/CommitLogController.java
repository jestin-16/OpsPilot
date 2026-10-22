package com.opspilot.controller;

import com.opspilot.entity.CommitLogEntity;
import com.opspilot.entity.User;
import com.opspilot.security.ProjectScope;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @Autowired
    private ProjectScope projectScope;

    @GetMapping
    public ResponseEntity<List<CommitLogEntity>> getAllCommits(@AuthenticationPrincipal User currentUser) {
        List<CommitLogEntity> commits = projectScope.visibleProjectIds(currentUser)
                .map(ids -> ids.isEmpty() ? List.<CommitLogEntity>of() : commitLogRepository.findTop50ByProject_IdInOrderByTimestampDesc(ids))
                .orElseGet(commitLogRepository::findTop50ByOrderByTimestampDesc);
        return ResponseEntity.ok(commits);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<CommitLogEntity>> getProjectCommits(@PathVariable Long projectId, @AuthenticationPrincipal User currentUser) {
        if (projectId == null || projectId <= 0) {
            return getAllCommits(currentUser);
        }
        projectScope.require(projectId, currentUser);
        List<CommitLogEntity> commits = commitLogRepository.findByProject_IdOrderByTimestampDesc(projectId);
        return ResponseEntity.ok(commits);
    }

    @PostMapping("/sync")
    public ResponseEntity<?> syncAllProjects(@AuthenticationPrincipal User currentUser) {
        try {
            // DevOps and Admin sync every project; anyone else syncs only the projects they own.
            java.util.Optional<List<Long>> visible = projectScope.visibleProjectIds(currentUser);
            int count = visible.isEmpty()
                    ? githubSyncService.syncAllProjects()
                    : visible.get().stream().mapToInt(githubSyncService::syncHistoricalCommits).sum();
            return ResponseEntity.ok(Map.of("synced_count", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("synced_count", 0, "warning", e.getMessage()));
        }
    }

    @PostMapping("/project/{projectId}/sync")
    public ResponseEntity<?> syncHistoricalCommits(@PathVariable Long projectId, @AuthenticationPrincipal User currentUser) {
        if (projectId == null || projectId <= 0) {
            return syncAllProjects(currentUser);
        }
        projectScope.require(projectId, currentUser);
        try {
            int count = githubSyncService.syncHistoricalCommits(projectId);
            return ResponseEntity.ok(Map.of("synced_count", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("synced_count", 0, "warning", e.getMessage()));
        }
    }
}
