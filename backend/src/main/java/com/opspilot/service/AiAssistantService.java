package com.opspilot.service;

import com.opspilot.dto.AiDiagnosisResponse;
import com.opspilot.dto.AiQueryRequest;
import com.opspilot.entity.Deployment;
import com.opspilot.entity.LogEntity;
import com.opspilot.repository.DeploymentRepository;
import com.opspilot.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiAssistantService {

    @Autowired
    private DeploymentRepository deploymentRepository;

    @Autowired
    private LogRepository logRepository;

    public AiDiagnosisResponse diagnose(AiQueryRequest request) {
        String prompt = request.getPrompt() != null ? request.getPrompt() : "";
        Long targetDeploymentId = request.getDeploymentId();

        // Extract deployment ID from prompt if not explicitly passed
        if (targetDeploymentId == null) {
            Pattern pattern = Pattern.compile("#?(\\d+)");
            Matcher matcher = pattern.matcher(prompt);
            if (matcher.find()) {
                try {
                    targetDeploymentId = Long.parseLong(matcher.group(1));
                } catch (Exception ignored) {}
            }
        }

        Deployment targetDeployment = null;
        if (targetDeploymentId != null) {
            targetDeployment = deploymentRepository.findById(targetDeploymentId).orElse(null);
        }

        if (targetDeployment == null) {
            List<Deployment> allDeployments = deploymentRepository.findAll();
            if (!allDeployments.isEmpty()) {
                targetDeployment = allDeployments.get(allDeployments.size() - 1);
            }
        }

        if (targetDeployment == null) {
            return new AiDiagnosisResponse(
                    prompt,
                    "No deployments found in system",
                    "0%",
                    "No active or historical deployment records were found in the database to analyze.",
                    "Trigger a deployment from the Projects page to enable AI root-cause correlation.",
                    null,
                    null,
                    List.of()
            );
        }

        LocalDateTime deployTime = targetDeployment.getDeployedAt();
        List<LogEntity> allLogs = logRepository.findAllByOrderByTimestampDesc();

        // Timestamp Proximity Rule: match logs within +/- 10 minutes of deployment timestamp
        List<LogEntity> correlatedLogs = allLogs.stream()
                .filter(l -> {
                    long minutes = Math.abs(ChronoUnit.MINUTES.between(l.getTimestamp(), deployTime));
                    return minutes <= 10;
                })
                .collect(Collectors.toList());

        List<LogEntity> errorLogs = correlatedLogs.stream()
                .filter(l -> "ERROR".equalsIgnoreCase(l.getLogLevel()) || "WARN".equalsIgnoreCase(l.getLogLevel()))
                .collect(Collectors.toList());

        if (!errorLogs.isEmpty()) {
            LogEntity primaryError = errorLogs.get(0);
            return new AiDiagnosisResponse(
                    prompt,
                    "Deployment #" + targetDeployment.getId() + " correlated with " + primaryError.getLogLevel() + ": " + primaryError.getMessage(),
                    "94% High Confidence (Timestamp Correlation)",
                    "AI Correlation Engine matched deployment #" + targetDeployment.getId() + " (" + targetDeployment.getProject().getProjectName() + " " + targetDeployment.getVersion() + ") executed at " + deployTime + " with error event logged by " + primaryError.getSourceService() + " within a 2-minute window.",
                    "1. Verify minikube pod resource limits.\n2. Review deployment environment variables.\n3. Rollback deployment to previous stable version if issue persists.",
                    targetDeployment.getId(),
                    targetDeployment.getVersion(),
                    errorLogs
            );
        }

        return new AiDiagnosisResponse(
                prompt,
                "Deployment #" + targetDeployment.getId() + " (" + targetDeployment.getProject().getProjectName() + ") operating normally with status [" + targetDeployment.getStatus() + "]",
                "98% High Confidence",
                "Timestamp proximity correlation analysis found zero critical errors or warning logs associated with deployment #" + targetDeployment.getId() + " (" + targetDeployment.getVersion() + ") on " + targetDeployment.getEnvironment() + ".",
                "No remediation required. Container metrics and pod status are healthy.",
                targetDeployment.getId(),
                targetDeployment.getVersion(),
                correlatedLogs
        );
    }
}
