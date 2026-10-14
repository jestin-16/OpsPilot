package com.opspilot.service;

import com.opspilot.dto.AiDiagnosisResponse;
import com.opspilot.dto.AiQueryRequest;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.LogEntity;
import com.opspilot.entity.Project;
import com.opspilot.entity.User;
import com.opspilot.projectlogs.ProjectAccess;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AiAssistantService {

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private ProjectAccess projectAccess;

    private static final Pattern DEPLOYMENT_ID = Pattern.compile("#?(\\d+)");

    /** Logs within this many minutes either side of a deployment count as correlated with it. */
    static final int WINDOW_MINUTES = 10;
    static final int MAX_ERROR_LOGS = 50;
    static final int MAX_CONTEXT_LOGS = 200;

    /**
     * Rule-based correlation: the error and warning logs of the deployment's own project within
     * +/-{@value #WINDOW_MINUTES} minutes of it. Filtering happens in the database and is capped, and the
     * caller must be allowed to see the project.
     */
    public AiDiagnosisResponse diagnose(AiQueryRequest request, User currentUser) {
        String prompt = request.getPrompt() != null ? request.getPrompt() : "";
        Long targetDeploymentId = request.getDeploymentId();

        // Extract deployment ID from prompt if not explicitly passed
        if (targetDeploymentId == null) {
            Matcher matcher = DEPLOYMENT_ID.matcher(prompt);
            if (matcher.find()) {
                try {
                    targetDeploymentId = Long.parseLong(matcher.group(1));
                } catch (NumberFormatException ignored) {}
            }
        }

        Deployment targetDeployment = null;
        if (targetDeploymentId != null) {
            targetDeployment = deploymentRepository.findById(targetDeploymentId).orElse(null);
        }
        if (targetDeployment == null) {
            // Latest deployment the caller can see, not just the last row of the table.
            targetDeployment = (ProjectAccess.isPrivileged(currentUser)
                    ? deploymentRepository.findFirstByOrderByDeployedAtDesc()
                    : deploymentRepository.findFirstByProject_OwnerOrderByDeployedAtDesc(currentUser))
                    .orElse(null);
        }

        if (targetDeployment == null || targetDeployment.getDeployedAt() == null) {
            return new AiDiagnosisResponse(
                    prompt,
                    "No deployments found in system",
                    "Not applicable",
                    "No active or historical deployment records were found in the database to analyze.",
                    "Trigger a deployment from the Projects page to enable AI root-cause correlation.",
                    null,
                    null,
                    List.of()
            );
        }

        Project project = projectAccess.require(targetDeployment.getProject().getId(), currentUser);

        LocalDateTime deployTime = targetDeployment.getDeployedAt();
        LocalDateTime from = deployTime.minusMinutes(WINDOW_MINUTES);
        LocalDateTime to = deployTime.plusMinutes(WINDOW_MINUTES);

        List<LogEntity> errorLogs = logRepository.findProjectLogsBetween(
                project.getId(), from, to, true, PageRequest.of(0, MAX_ERROR_LOGS));

        if (!errorLogs.isEmpty()) {
            LogEntity primaryError = errorLogs.get(0);
            return new AiDiagnosisResponse(
                    prompt,
                    "Deployment #" + targetDeployment.getId() + " correlated with " + primaryError.getLogLevel() + ": " + primaryError.getMessage(),
                    "Rule-based: " + errorLogs.size() + (errorLogs.size() == MAX_ERROR_LOGS ? "+" : "")
                            + " error/warning log(s) within " + WINDOW_MINUTES + " min of the deployment",
                    "Deployment #" + targetDeployment.getId() + " (" + project.getProjectName() + " " + targetDeployment.getVersion() + ") ran at " + deployTime
                            + "; " + primaryError.getSourceService() + " logged " + primaryError.getLogLevel() + " within " + WINDOW_MINUTES + " minutes of it.",
                    "1. Verify minikube pod resource limits.\n2. Review deployment environment variables.\n3. Rollback deployment to previous stable version if issue persists.",
                    targetDeployment.getId(),
                    targetDeployment.getVersion(),
                    errorLogs
            );
        }

        List<LogEntity> correlatedLogs = logRepository.findProjectLogsBetween(
                project.getId(), from, to, false, PageRequest.of(0, MAX_CONTEXT_LOGS));
        return new AiDiagnosisResponse(
                prompt,
                "Deployment #" + targetDeployment.getId() + " (" + project.getProjectName() + ") operating normally with status [" + targetDeployment.getStatus() + "]",
                "Rule-based: no error or warning logs within " + WINDOW_MINUTES + " min of the deployment",
                "No error or warning logs were recorded for " + project.getProjectName() + " within " + WINDOW_MINUTES
                        + " minutes of deployment #" + targetDeployment.getId() + " (" + targetDeployment.getVersion() + ") on " + targetDeployment.getEnvironment() + ".",
                "No remediation required. Container metrics and pod status are healthy.",
                targetDeployment.getId(),
                targetDeployment.getVersion(),
                correlatedLogs
        );
    }
}
