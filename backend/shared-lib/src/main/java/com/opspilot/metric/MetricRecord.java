package com.opspilot.metric;

import com.opspilot.enums.ProviderType;
import java.time.LocalDateTime;
import java.util.Map;

public class MetricRecord {
    private LocalDateTime timestamp;
    private Long projectId;
    private Long integrationId;
    private ProviderType provider;
    private String resourceId;
    private String metricName;
    private Double value;
    private String unit;
    private Map<String, String> dimensions;

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getIntegrationId() {
        return integrationId;
    }

    public void setIntegrationId(Long integrationId) {
        this.integrationId = integrationId;
    }

    public ProviderType getProvider() {
        return provider;
    }

    public void setProvider(ProviderType provider) {
        this.provider = provider;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getMetricName() {
        return metricName;
    }

    public void setMetricName(String metricName) {
        this.metricName = metricName;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Map<String, String> getDimensions() {
        return dimensions;
    }

    public void setDimensions(Map<String, String> dimensions) {
        this.dimensions = dimensions;
    }
}
