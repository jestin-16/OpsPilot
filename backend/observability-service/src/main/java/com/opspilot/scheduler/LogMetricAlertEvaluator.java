package com.opspilot.scheduler;

import com.opspilot.alerting.AlertEvaluator;
import com.opspilot.entity.AlertRule;
import com.opspilot.entity.DockerLogSource;
import com.opspilot.logstore.LogStore;
import com.opspilot.logstore.PromQlBuilder;
import com.opspilot.repository.AlertRuleRepository;
import com.opspilot.repository.DockerLogSourceRepository;
import com.opspilot.service.PrometheusService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class LogMetricAlertEvaluator {

    private static final Logger log = LoggerFactory.getLogger(LogMetricAlertEvaluator.class);

    private final AlertRuleRepository ruleRepository;
    private final DockerLogSourceRepository sourceRepository;
    private final PrometheusService prometheusService;
    private final LogStore logStore;
    private final AlertEvaluator alertEvaluator;

    public LogMetricAlertEvaluator(AlertRuleRepository ruleRepository,
                                   DockerLogSourceRepository sourceRepository,
                                   PrometheusService prometheusService,
                                   LogStore logStore,
                                   AlertEvaluator alertEvaluator) {
        this.ruleRepository = ruleRepository;
        this.sourceRepository = sourceRepository;
        this.prometheusService = prometheusService;
        this.logStore = logStore;
        this.alertEvaluator = alertEvaluator;
    }

    @Scheduled(fixedDelayString = "${opspilot.alert.evaluation-ms:60000}")
    public void evaluateRules() {
        List<AlertRule> rules = ruleRepository.findByEnabledTrue();
        if (rules.isEmpty()) return;

        List<DockerLogSource> sources = sourceRepository.findAll();
        if (sources.isEmpty()) return;

        for (AlertRule rule : rules) {
            String eventType = rule.getEventType();
            if (!isMetricOrLogRule(eventType)) continue;

            for (DockerLogSource source : sources) {
                if (rule.getProjectId() != null && !rule.getProjectId().equals(source.getProjectId())) {
                    continue;
                }
                if (rule.getResource() != null && !rule.getResource().equals(source.getId().toString())) {
                    continue;
                }
                evaluateSourceRule(rule, source);
            }
        }
    }

    private boolean isMetricOrLogRule(String eventType) {
        return "HIGH_CPU".equals(eventType) || 
               "HIGH_MEMORY".equals(eventType) || 
               "REPEATED_ERROR_LOGS".equals(eventType);
    }

    private void evaluateSourceRule(AlertRule rule, DockerLogSource source) {
        try {
            if ("HIGH_CPU".equals(rule.getEventType()) || "HIGH_MEMORY".equals(rule.getEventType())) {
                evaluateMetric(rule, source);
            } else if ("REPEATED_ERROR_LOGS".equals(rule.getEventType())) {
                evaluateLog(rule, source);
            }
        } catch (Exception e) {
            log.warn("Failed to evaluate rule {} for source {}: {}", rule.getEventType(), source.getId(), e.getMessage());
        }
    }

    private void evaluateMetric(AlertRule rule, DockerLogSource source) {
        if (!prometheusService.isAvailable()) return;
        
        PromQlBuilder.Filter filter = new PromQlBuilder.Filter(
                Collections.singletonList(source.getProjectId()),
                Collections.singletonList(source.getId())
        );

        String query = "HIGH_CPU".equals(rule.getEventType()) 
            ? PromQlBuilder.buildCpuQuery(filter, rule.getTimeWindow())
            : PromQlBuilder.buildMemoryQuery(filter);

        List<PrometheusService.PrometheusResult> results = prometheusService.queryVector(query);
        for (PrometheusService.PrometheusResult result : results) {
            if (result.value() >= rule.getThreshold()) {
                alertEvaluator.triggerAlert(rule, source.getProjectId(), source.getId().toString());
            }
        }
    }

    private void evaluateLog(AlertRule rule, DockerLogSource source) {
        if (!logStore.isEnabled()) return;
        
        String query = String.format("count_over_time({project=\"%s\", source=\"%s\"} |~ \"(?i)\\\\b(error|fatal|panic|critical)\\\\b\" [%dm])",
                source.getProjectId(), source.getId(), rule.getTimeWindow());
                
        // Loki query range backward to get the scalar vector at "now"
        Instant now = Instant.now();
        List<LogStore.LogStream> streams = logStore.query(query, now.minusSeconds(10), now, 1);
        
        for (LogStore.LogStream stream : streams) {
            if (!stream.lines().isEmpty()) {
                try {
                    double count = Double.parseDouble(stream.lines().get(0).line());
                    if (count >= rule.getThreshold()) {
                        alertEvaluator.triggerAlert(rule, source.getProjectId(), source.getId().toString());
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
    }
}
