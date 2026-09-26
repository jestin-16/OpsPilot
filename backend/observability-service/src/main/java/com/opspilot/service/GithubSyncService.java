package com.opspilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opspilot.entity.CommitLogEntity;
import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.Project;
import com.opspilot.repository.CommitLogRepository;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
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

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public int syncHistoricalCommits(Long projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            throw new IllegalArgumentException("Project not found with id: " + projectId);
        }

        Project project = projectOpt.get();
        String[] repoInfo = extractOwnerAndRepo(project);

        if (repoInfo == null) {
            logger.info("Project {} does not have a recognizable GitHub owner/repo format. Falling back to pipeline run logs.", projectId);
            return importCommitsFromPipelineRuns(project);
        }

        String owner = repoInfo[0];
        String repo = repoInfo[1];
        String apiUrl = String.format("https://api.github.com/repos/%s/%s/commits", owner, repo);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "OpsPilot-Observability/1.0");
            headers.set("Accept", "application/vnd.github.v3+json");

            String token = resolveGithubToken(project);
            if (token != null && !token.isBlank()) {
                headers.set("Authorization", "Bearer " + token);
            }

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.GET, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                int savedCount = 0;

                for (JsonNode node : root) {
                    String sha = node.path("sha").asText();
                    if (sha == null || sha.isBlank()) continue;

                    // Project-scoped commit uniqueness check
                    if (commitLogRepository.existsByCommitShaAndProject_Id(sha, project.getId())) {
                        continue;
                    }

                    JsonNode commitInfo = node.path("commit");
                    String message = commitInfo.path("message").asText("Update");
                    String authorName = commitInfo.path("author").path("name").asText("GitHub Committer");
                    if (authorName.isBlank()) {
                        authorName = node.path("author").path("login").asText("GitHub Committer");
                    }
                    String dateStr = commitInfo.path("author").path("date").asText();

                    LocalDateTime timestamp;
                    try {
                        timestamp = LocalDateTime.ofInstant(Instant.parse(dateStr), ZoneId.of("UTC"));
                    } catch (Exception parseEx) {
                        timestamp = LocalDateTime.now();
                    }

                    CommitLogEntity commitLog = new CommitLogEntity(project, sha, "main", authorName, message, timestamp);
                    commitLogRepository.save(commitLog);
                    savedCount++;
                }

                logger.info("Successfully synced {} commits from GitHub for project {}", savedCount, projectId);
                return savedCount;
            }
        } catch (HttpClientErrorException.NotFound e) {
            logger.warn("GitHub repo {}/{} not found (404). Falling back to pipeline runs.", owner, repo);
            return importCommitsFromPipelineRuns(project);
        } catch (HttpClientErrorException.Forbidden e) {
            logger.warn("GitHub API rate limit or forbidden (403) for {}/{}. Falling back to pipeline runs.", owner, repo);
            return importCommitsFromPipelineRuns(project);
        } catch (Exception e) {
            logger.warn("Failed to fetch commits from GitHub API for project {}: {}. Falling back to pipeline runs.", projectId, e.getMessage());
            return importCommitsFromPipelineRuns(project);
        }

        return importCommitsFromPipelineRuns(project);
    }

    public int syncAllProjects() {
        List<Project> projects = projectRepository.findAll();
        int total = 0;
        for (Project project : projects) {
            try {
                total += syncHistoricalCommits(project.getId());
            } catch (Exception e) {
                logger.warn("Failed to sync project {}: {}", project.getId(), e.getMessage());
            }
        }
        return total;
    }

    private int importCommitsFromPipelineRuns(Project project) {
        if (project == null || project.getId() == null) return 0;

        List<PipelineRunEntity> runs = pipelineRunRepository.findByProject_IdOrderByCreatedAtDesc(project.getId());
        int imported = 0;

        for (PipelineRunEntity run : runs) {
            String sha = run.getCommitSha();
            if (sha == null || sha.isBlank()) continue;

            if (!commitLogRepository.existsByCommitShaAndProject_Id(sha, project.getId())) {
                String branch = run.getBranch() != null ? run.getBranch() : "main";
                String author = run.getAuthor() != null ? run.getAuthor() : "CI/CD Pipeline";
                String message = run.getCommitMessage() != null ? run.getCommitMessage() : "Triggered run #" + run.getRunId();
                LocalDateTime time = run.getCreatedAt() != null ? run.getCreatedAt() : LocalDateTime.now();

                CommitLogEntity commitLog = new CommitLogEntity(project, sha, branch, author, message, time);
                commitLogRepository.save(commitLog);
                imported++;
            }
        }

        return imported;
    }

    private String[] extractOwnerAndRepo(Project project) {
        String repoName = project.getGithubRepoName();
        if (repoName != null && repoName.contains("/")) {
            String[] parts = repoName.trim().split("/");
            if (parts.length >= 2 && !parts[0].isBlank() && !parts[1].isBlank()) {
                return new String[]{parts[0].trim(), parts[1].trim().replaceAll("\\.git$", "").replaceAll("/$", "")};
            }
        }

        String repoUrl = project.getRepositoryUrl();
        if (repoUrl != null && !repoUrl.isBlank()) {
            Pattern pattern = Pattern.compile("github\\.com[:/]([^/]+)/([^/\\s]+)");
            Matcher matcher = pattern.matcher(repoUrl.trim());
            if (matcher.find()) {
                String owner = matcher.group(1).trim();
                String repo = matcher.group(2).trim().replaceAll("\\.git$", "").replaceAll("/$", "");
                return new String[]{owner, repo};
            }
        }
        return null;
    }

    private String resolveGithubToken(Project project) {
        String envToken = System.getenv("GITHUB_TOKEN");
        if (envToken != null && !envToken.isBlank()) {
            return envToken.trim();
        }

        String creds = project.getCredentialsJson();
        if (creds != null && !creds.isBlank()) {
            try {
                JsonNode json = objectMapper.readTree(creds);
                if (json.has("github_token")) return json.get("github_token").asText();
                if (json.has("token")) return json.get("token").asText();
                if (json.has("githubToken")) return json.get("githubToken").asText();
            } catch (Exception ignored) {
                if (creds.startsWith("ghp_") || creds.startsWith("github_pat_")) {
                    return creds.trim();
                }
            }
        }

        return null;
    }
}
