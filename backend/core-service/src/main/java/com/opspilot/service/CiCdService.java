package com.opspilot.service;

import com.opspilot.entity.PipelineRunEntity;
import com.opspilot.entity.Project;
import com.opspilot.repository.PipelineRunRepository;
import com.opspilot.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CiCdService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PipelineRunRepository pipelineRunRepository;

    public void processGitHubWebhook(String repoUrl, String branch, String commitSha, String commitMessage, String author) {
        Optional<Project> optionalProject = projectRepository.findByRepositoryUrl(repoUrl);
        if (optionalProject.isEmpty()) {
            System.out.println("Webhook ignored: No project found for repo " + repoUrl);
            return;
        }

        Project project = optionalProject.get();

        // Create a new pipeline run in "BUILDING" state
        PipelineRunEntity run = new PipelineRunEntity(
                project, "push", branch, commitSha, commitMessage, author, "BUILDING"
        );
        run = pipelineRunRepository.save(run);

        // Trigger the asynchronous build process
        executePipeline(run.getRunId());
    }

    @Async
    public void executePipeline(Long runId) {
        try {
            // Simulate build time
            Thread.sleep(5000);

            // Fetch the run, update status to SUCCESS
            pipelineRunRepository.findById(runId).ifPresent(run -> {
                run.setStatus("SUCCESS");
                pipelineRunRepository.save(run);
                System.out.println("Pipeline " + runId + " completed successfully.");
            });

        } catch (InterruptedException e) {
            pipelineRunRepository.findById(runId).ifPresent(run -> {
                run.setStatus("FAILED");
                pipelineRunRepository.save(run);
            });
        }
    }
}
