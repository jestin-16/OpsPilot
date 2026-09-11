package com.opspilot.dto;

import java.util.List;

public record KubernetesSummaryResponse(String status, String error, int nodeCount, int healthyNodeCount,
                                        int podCount, int runningPodCount, int pendingPodCount,
                                        int failedPodCount, List<PodSummary> pods) {
    public record PodSummary(String name, String namespace, String phase, String nodeName,
                              int restartCount, boolean ready) {
    }
}