package com.opspilot.metric;

import com.opspilot.entity.Integration;

import java.util.List;
import java.util.Map;

public interface MetricCollector {
    
    /**
     * Collect current/historical metrics dynamically.
     */
    List<MetricRecord> collectMetrics(Integration integration, Map<String, Object> queryParams);

}
