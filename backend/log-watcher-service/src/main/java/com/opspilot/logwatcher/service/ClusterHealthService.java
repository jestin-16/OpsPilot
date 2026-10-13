package com.opspilot.logwatcher.service;

import com.opspilot.logwatcher.model.ClusterHealthSummaryDto;
import com.opspilot.logwatcher.model.CrashLoopPodDto;
import com.opspilot.logwatcher.model.ParsedLogLine;
import com.opspilot.logwatcher.model.PodSummaryDto;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ClusterHealthService {

    private final KubernetesPodWatcher podWatcher;
    private final PodLogBufferManager bufferManager;
    private final MetricsService metricsService;

    public ClusterHealthService(KubernetesPodWatcher podWatcher,
                                PodLogBufferManager bufferManager,
                                MetricsService metricsService) {
        this.podWatcher = podWatcher;
        this.bufferManager = bufferManager;
        this.metricsService = metricsService;
    }

    public ClusterHealthSummaryDto getSummary(int windowMinutes) {
        if (windowMinutes <= 0) {
            windowMinutes = 15; // default 15 minutes window
        }

        Instant since = Instant.now().minus(windowMinutes, ChronoUnit.MINUTES);
        List<PodSummaryDto> pods = podWatcher.getAllPods();

        Map<String, Integer> phaseCounts = new HashMap<>();
        int totalRestarts = 0;
        List<CrashLoopPodDto> crashLoopPods = new ArrayList<>();
        List<CrashLoopPodDto> oomKilledPods = new ArrayList<>();
        Map<String, Double> errorRatePerPod = new HashMap<>();

        long totalErrors = 0;
        long totalLinesInWindow = 0;

        for (PodSummaryDto pod : pods) {
            String phase = pod.getStatus() != null ? pod.getStatus() : "Unknown";
            phaseCounts.merge(phase, 1, Integer::sum);
            totalRestarts += pod.getRestarts();

            // Check container statuses for CrashLoopBackOff and OOMKilled
            if (pod.getContainerStatuses() != null) {
                for (Map.Entry<String, String> entry : pod.getContainerStatuses().entrySet()) {
                    String containerName = entry.getKey();
                    String state = entry.getValue();

                    if ("CrashLoopBackOff".equalsIgnoreCase(state) || "CrashLoopBackOff".equalsIgnoreCase(phase)) {
                        crashLoopPods.add(new CrashLoopPodDto(
                                pod.getName(),
                                pod.getNamespace(),
                                containerName,
                                pod.getRestarts(),
                                "CrashLoopBackOff",
                                1,
                                "Container failed and is restarting",
                                pod.getCreationTimestamp()
                        ));
                    } else if ("OOMKilled".equalsIgnoreCase(state) || "OOMKilled".equalsIgnoreCase(phase)) {
                        oomKilledPods.add(new CrashLoopPodDto(
                                pod.getName(),
                                pod.getNamespace(),
                                containerName,
                                pod.getRestarts(),
                                "OOMKilled",
                                137,
                                "Container exceeded memory limits",
                                pod.getCreationTimestamp()
                        ));
                    }
                }
            }

            // Calculate error rate over window
            List<ParsedLogLine> windowLogs = bufferManager.getLogs(pod.getNamespace(), pod.getName(), null, null, since, 0);
            long podErrors = 0;
            for (ParsedLogLine line : windowLogs) {
                if ("ERROR".equalsIgnoreCase(line.getLevel())) {
                    podErrors++;
                }
            }

            double rate = 0.0;
            if (!windowLogs.isEmpty()) {
                rate = Math.round(((double) podErrors / windowLogs.size() * 100.0) * 10.0) / 10.0;
            }
            errorRatePerPod.put(pod.getName(), rate);
            totalErrors += podErrors;
            totalLinesInWindow += windowLogs.size();
        }

        // Update Micrometer metrics
        phaseCounts.forEach(metricsService::updatePodPhaseCount);

        double overallErrorRate = 0.0;
        if (totalLinesInWindow > 0) {
            overallErrorRate = Math.round(((double) totalErrors / totalLinesInWindow * 100.0) * 10.0) / 10.0;
        }

        return new ClusterHealthSummaryDto(
                pods.size(),
                phaseCounts,
                totalRestarts,
                overallErrorRate,
                errorRatePerPod,
                crashLoopPods,
                oomKilledPods,
                windowMinutes,
                totalLinesInWindow
        );
    }
}
