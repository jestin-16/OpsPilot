package com.opspilot.service;

import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.PipelineSource;
import com.opspilot.entity.Project;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class CiCdService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    @Autowired
    private IncidentService incidentService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    public PipelineRunEntity trackExternalPipelineRun(String repoUrl, String eventType, String branch, String commitSha, String commitMessage, String author, String status, String logs, Long durationMs, String externalRunId) {
        List<Project> projects = projectRepository.findByRepositoryUrl(repoUrl);
        if (projects == null || projects.isEmpty()) {
            throw new IllegalArgumentException("No project found for repository URL: " + repoUrl);
        }
        Project project = projects.get(0);

        PipelineRunEntity run = null;
        if (externalRunId != null && !externalRunId.isBlank()) {
            run = pipelineRunRepository.findByExternalRunId(externalRunId).orElse(null);
        }

        if (run == null) {
            run = new PipelineRunEntity(
                    project, eventType, branch != null ? branch : "main",
                    commitSha != null ? commitSha : "sha-" + System.currentTimeMillis(),
                    commitMessage != null ? commitMessage : "Pipeline update",
                    author != null ? author : "System", status != null ? status : "UNKNOWN"
            );
            run.setRepoUrl(repoUrl);
            run.setExternalRunId(externalRunId);
        } else {
            // Update existing run
            if (status != null) run.setStatus(status);
            // Optionally update other fields if needed, but primarily we want the new status and logs
        }
        
        if (logs != null && !logs.isBlank()) {
            run.setBuildLogs(logs);
        }
        if (durationMs != null) {
            run.setDurationMs(durationMs);
        }
        
        run = pipelineRunRepository.save(run);

        if ("FAILED".equalsIgnoreCase(status) || "failure".equalsIgnoreCase(status)) {
            try {
                incidentService.createIncident(
                    project.getId(),
                    "External Pipeline Failed: #" + run.getRunId(),
                    "Automated incident created due to external CI/CD failure.\nRepository: " + repoUrl + "\nBranch: " + branch,
                    "HIGH",
                    "CI/CD Pipeline",
                    null,
                    run.getRunId(),
                    null
                );
            } catch (Exception e) {
                System.err.println("Failed to auto-create incident: " + e.getMessage());
            }
        }

        return run;
    }

    /**
     * Records a run reported by a standalone source (no Project required). The project comes from the
     * source's optional link. A failed run opens an incident the first time it transitions to FAILED.
     */
    public PipelineRunEntity trackSourceRun(PipelineSource source, String eventType, String branch, String commitSha, String commitMessage, String author, String status, String logs, Long durationMs, String externalRunId, String repoUrl) {
        Project project = source.getProjectId() != null ? projectRepository.findById(source.getProjectId()).orElse(null) : null;

        PipelineRunEntity run = null;
        if (externalRunId != null && !externalRunId.isBlank()) {
            run = pipelineRunRepository.findFirstBySource_IdAndExternalRunId(source.getId(), externalRunId).orElse(null);
        }
        boolean alreadyFailed = run != null && "FAILED".equalsIgnoreCase(run.getStatus());

        if (run == null) {
            run = new PipelineRunEntity(
                    project, eventType, branch != null ? branch : "main",
                    commitSha != null ? commitSha : "sha-" + System.currentTimeMillis(),
                    commitMessage != null ? commitMessage : "Pipeline update",
                    author != null ? author : "System", status != null ? status : "UNKNOWN"
            );
            run.setSource(source);
            run.setRepoUrl(repoUrl);
            run.setExternalRunId(externalRunId);
        } else if (status != null) {
            run.setStatus(status);
        }
        if (logs != null && !logs.isBlank()) run.setBuildLogs(logs);
        if (durationMs != null) run.setDurationMs(durationMs);
        run = pipelineRunRepository.save(run);

        if ("FAILED".equalsIgnoreCase(status) && !alreadyFailed) {
            try {
                incidentService.createSourceIncident(
                        source, project,
                        "External Pipeline Failed: #" + run.getRunId(),
                        "Automated incident created due to external CI/CD failure.\nSource: " + source.getName() + "\nRepository: " + repoUrl + "\nBranch: " + branch,
                        "HIGH", "CI/CD Pipeline", run.getRunId());
            } catch (Exception e) {
                System.err.println("Failed to auto-create incident: " + e.getMessage());
            }
        }
        return run;
    }

    public void fetchAndSaveGitHubLogsAsync(Long runId, String owner, String repo, Long workflowRunId) {
        fetchAndSaveGitHubLogsAsync(runId, owner, repo, workflowRunId, null);
    }

    public void fetchAndSaveGitHubLogsAsync(Long runId, String owner, String repo, Long workflowRunId, String sourceToken) {
        executorService.submit(() -> {
            try {
                String token = sourceToken != null && !sourceToken.isBlank() ? sourceToken : System.getenv("GITHUB_TOKEN");
                String logsUrl = String.format("https://api.github.com/repos/%s/%s/actions/runs/%d/logs", owner, repo, workflowRunId);

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", "OpsPilot");
                if (token != null && !token.isBlank()) {
                    headers.set("Authorization", "Bearer " + token);
                }

                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<byte[]> response = restTemplate.exchange(logsUrl, HttpMethod.GET, entity, byte[].class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    StringBuilder logBuilder = new StringBuilder();
                    try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(response.getBody()))) {
                        ZipEntry zipEntry = zis.getNextEntry();
                        while (zipEntry != null) {
                            if (!zipEntry.isDirectory()) {
                                logBuilder.append("--- Log File: ").append(zipEntry.getName()).append(" ---\n");
                                BufferedReader reader = new BufferedReader(new InputStreamReader(zis));
                                String line;
                                while ((line = reader.readLine()) != null) {
                                    logBuilder.append(line).append("\n");
                                }
                            }
                            zipEntry = zis.getNextEntry();
                        }
                    }

                    String combinedLogs = logBuilder.toString();
                    if (!combinedLogs.isBlank()) {
                        pipelineRunRepository.findById(runId).ifPresent(run -> {
                            run.setBuildLogs(combinedLogs);
                            pipelineRunRepository.save(run);
                            System.out.println("Successfully fetched and saved logs for run " + runId);
                        });
                    }
                } else {
                    System.err.println("Failed to fetch logs. HTTP Status: " + response.getStatusCode());
                }
            } catch (Exception e) {
                System.err.println("Error fetching GitHub Actions logs for run " + runId + ": " + e.getMessage());
            }
        });
    }

    public void fetchAndSaveJenkinsLogsAsync(Long runId, String buildUrl) {
        fetchAndSaveJenkinsLogsAsync(runId, buildUrl, null, null);
    }

    public void fetchAndSaveJenkinsLogsAsync(Long runId, String buildUrl, String sourceUser, String sourceApiToken) {
        executorService.submit(() -> {
            try {
                boolean hasSourceCreds = sourceUser != null && !sourceUser.isBlank() && sourceApiToken != null && !sourceApiToken.isBlank();
                String user = hasSourceCreds ? sourceUser : System.getenv("JENKINS_USER");
                String apiToken = hasSourceCreds ? sourceApiToken : System.getenv("JENKINS_API_TOKEN");
                String consoleUrl = (buildUrl.endsWith("/") ? buildUrl : buildUrl + "/") + "consoleText";

                HttpHeaders headers = new HttpHeaders();
                headers.set("User-Agent", "OpsPilot");
                if (user != null && !user.isBlank() && apiToken != null && !apiToken.isBlank()) {
                    headers.setBasicAuth(user, apiToken);
                }

                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> response = restTemplate.exchange(consoleUrl, HttpMethod.GET, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    String consoleLogs = response.getBody();
                    pipelineRunRepository.findById(runId).ifPresent(run -> {
                        run.setBuildLogs(consoleLogs);
                        pipelineRunRepository.save(run);
                        System.out.println("Successfully fetched and saved Jenkins logs for run " + runId);
                    });
                } else {
                    System.err.println("Failed to fetch Jenkins logs. HTTP Status: " + response.getStatusCode());
                }
            } catch (Exception e) {
                System.err.println("Error fetching Jenkins logs for run " + runId + ": " + e.getMessage());
            }
        });
    }
}
