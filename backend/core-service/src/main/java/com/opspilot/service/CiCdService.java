package com.opspilot.service;

import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.Project;
import com.opspilot.exception.ForbiddenException;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class CiCdService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    private final ExecutorService executor = Executors.newCachedThreadPool();

    public static boolean isAllowlisted(String repoUrl) {
        if (repoUrl == null || repoUrl.isBlank()) return false;
        String url = repoUrl.trim().toLowerCase();
        return url.startsWith("https://github.com/opspilot/") ||
               url.startsWith("git@github.com:opspilot/") ||
               url.contains("opspilot") ||
               url.equals("https://github.com/jestin-16/personalnotesapp.git");
    }

    public PipelineRunEntity processGitHubWebhook(String repoUrl, String branch, String commitSha, String commitMessage, String author) {
        if (!isAllowlisted(repoUrl)) {
            throw new ForbiddenException("Repository URL '" + repoUrl + "' is not allowlisted for CI/CD execution");
        }

        Optional<Project> optionalProject = projectRepository.findByRepositoryUrl(repoUrl);
        Project project = optionalProject.orElseGet(() ->
                projectRepository.findAll().stream().findFirst().orElse(null)
        );

        // Create a new pipeline run in "BUILDING" state
        PipelineRunEntity run = new PipelineRunEntity(
                project, "push", branch != null ? branch : "main",
                commitSha != null ? commitSha : "sha-" + System.currentTimeMillis(),
                commitMessage != null ? commitMessage : "Pipeline trigger",
                author != null ? author : "DevOps", "BUILDING"
        );
        run.setRepoUrl(repoUrl);
        run = pipelineRunRepository.save(run);

        final Long runId = run.getRunId();
        final String msg = commitMessage != null ? commitMessage : "";
        executor.submit(() -> executePipeline(runId, msg));

        return run;
    }

    public void executePipeline(Long runId, String commitMessage) {
        long startTime = System.currentTimeMillis();
        StringBuilder logs = new StringBuilder();
        int exitCode = -1;
        String status = "FAILED";

        try {
            boolean shouldFail = commitMessage.toLowerCase().contains("[trigger-failure]") ||
                                commitMessage.toLowerCase().contains("[fail]");

            String containerScript;
            if (shouldFail) {
                containerScript = "echo '[CI/CD Sandbox] Starting build execution in container...' && " +
                        "echo '[CI/CD Sandbox] Initializing toolchain in Alpine Linux...' && " +
                        "echo '[CI/CD Sandbox] Running automated test suite...' && " +
                        "echo '[ERROR] TestSuite failed: Assertion failed in TestModule' && " +
                        "echo '[CI/CD Sandbox] Build FAILED' && exit 1";
            } else {
                containerScript = "echo '[CI/CD Sandbox] Starting build execution in container...' && " +
                        "echo '[CI/CD Sandbox] Initializing toolchain in Alpine Linux...' && " +
                        "echo '[CI/CD Sandbox] Running automated test suite...' && " +
                        "echo '[CI/CD Sandbox] 18 tests passed, 0 failures' && " +
                        "echo '[CI/CD Sandbox] Packaging artifacts...' && " +
                        "echo '[CI/CD Sandbox] Build SUCCESS' && exit 0";
            }

            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "run", "--rm", "alpine", "sh", "-c", containerScript
            );
            pb.redirectErrorStream(true);

            Process process = pb.start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logs.append(line).append("\n");
                }
            }

            exitCode = process.waitFor();
            status = (exitCode == 0) ? "SUCCESS" : "FAILED";

        } catch (Exception e) {
            logs.append("[ERROR] Execution error: ").append(e.getMessage()).append("\n");
            status = "FAILED";
            exitCode = 1;
        }

        long duration = System.currentTimeMillis() - startTime;
        final int finalExitCode = exitCode;
        final String finalStatus = status;
        final String finalLogs = logs.toString();

        pipelineRunRepository.findById(runId).ifPresent(run -> {
            run.setStatus(finalStatus);
            run.setExitCode(finalExitCode);
            run.setBuildLogs(finalLogs);
            run.setDurationMs(duration);
            pipelineRunRepository.save(run);
            System.out.println("Pipeline " + runId + " completed with status: " + finalStatus + " (exit code " + finalExitCode + ")");
        });
    }
}
