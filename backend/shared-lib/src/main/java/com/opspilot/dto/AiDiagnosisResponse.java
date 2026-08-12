package com.opspilot.dto;

import com.opspilot.entity.LogEntity;

import java.util.List;

public class AiDiagnosisResponse {
    private String query;
    private String rootCause;
    private String confidence;
    private String summary;
    private String suggestedRemediation;
    private Long correlatedDeploymentId;
    private String correlatedDeploymentVersion;
    private List<LogEntity> correlatedLogs;

    public AiDiagnosisResponse() {}

    public AiDiagnosisResponse(String query, String rootCause, String confidence, String summary, String suggestedRemediation, Long correlatedDeploymentId, String correlatedDeploymentVersion, List<LogEntity> correlatedLogs) {
        this.query = query;
        this.rootCause = rootCause;
        this.confidence = confidence;
        this.summary = summary;
        this.suggestedRemediation = suggestedRemediation;
        this.correlatedDeploymentId = correlatedDeploymentId;
        this.correlatedDeploymentVersion = correlatedDeploymentVersion;
        this.correlatedLogs = correlatedLogs;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String rootCause) {
        this.rootCause = rootCause;
    }

    public String getConfidence() {
        return confidence;
    }

    public void setConfidence(String confidence) {
        this.confidence = confidence;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getSuggestedRemediation() {
        return suggestedRemediation;
    }

    public void setSuggestedRemediation(String suggestedRemediation) {
        this.suggestedRemediation = suggestedRemediation;
    }

    public Long getCorrelatedDeploymentId() {
        return correlatedDeploymentId;
    }

    public void setCorrelatedDeploymentId(Long correlatedDeploymentId) {
        this.correlatedDeploymentId = correlatedDeploymentId;
    }

    public String getCorrelatedDeploymentVersion() {
        return correlatedDeploymentVersion;
    }

    public void setCorrelatedDeploymentVersion(String correlatedDeploymentVersion) {
        this.correlatedDeploymentVersion = correlatedDeploymentVersion;
    }

    public List<LogEntity> getCorrelatedLogs() {
        return correlatedLogs;
    }

    public void setCorrelatedLogs(List<LogEntity> correlatedLogs) {
        this.correlatedLogs = correlatedLogs;
    }
}
