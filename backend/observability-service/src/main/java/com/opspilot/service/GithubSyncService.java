package com.opspilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.CommitLogEntity;
import com.opspilot.entity.Project;
import com.opspilot.repository.CommitLogRepository;
import com.opspilot.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GithubSyncService {

    private static final Logger logger = LoggerFactory.getLogger(GithubSyncService.class);

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private CommitLogRepository commitLogRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public int syncHistoricalCommits(Long projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            throw new IllegalArgumentException("Project not found");
        }

        Project project = projectOpt.get();
        String repoUrl = project.getRepositoryUrl();
        if (repoUrl == null || repoUrl.isEmpty()) {
            throw new IllegalArgumentException("Project does not have a repository URL");
        }

        // Extract owner and repo from URL (e.g. https://github.com/opspilot/payment-engine)
        Pattern pattern = Pattern.compile("github\\.com/([^/]+)/([^/]+)");
        Matcher matcher = pattern.matcher(repoUrl);
        if (!matcher.find()) {
            throw new IllegalArgumentException("Invalid GitHub repository URL format");
        }

        String owner = matcher.group(1);
        String repo = matcher.group(2).replaceAll("\\.git$", "");

        String apiUrl = String.format("https://api.github.com/repos/%s/%s/commits", owner, repo);
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(apiUrl, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                int savedCount = 0;
                
                for (JsonNode node : root) {
                    String sha = node.path("sha").asText();
                    
                    // Check if commit already exists
                    if (commitLogRepository.existsByCommitSha(sha)) {
                        continue; // Skip already synced commits
                    }

                    JsonNode commitInfo = node.path("commit");
                    String message = commitInfo.path("message").asText();
                    String authorName = commitInfo.path("author").path("name").asText();
                    String dateStr = commitInfo.path("author").path("date").asText();
                    
                    LocalDateTime timestamp = LocalDateTime.ofInstant(Instant.parse(dateStr), ZoneId.of("UTC"));
                    
                    CommitLogEntity commitLog = new CommitLogEntity(project, sha, "main", authorName, message, timestamp);
                    commitLogRepository.save(commitLog);
                    savedCount++;
                }
                
                return savedCount;
            }
        } catch (HttpClientErrorException.NotFound e) {
            logger.error("GitHub repo not found (404): {}", e.getMessage());
            throw new RuntimeException("Repository not found or is private. Please ensure the repository exists and is public.");
        } catch (HttpClientErrorException.Forbidden e) {
            logger.error("GitHub API rate limit or forbidden (403): {}", e.getMessage());
            throw new RuntimeException("GitHub API access forbidden (possibly rate limited).");
        } catch (Exception e) {
            logger.error("Failed to sync GitHub commits: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch commits from GitHub API: " + e.getMessage());
        }
        
        return 0;
    }
}
