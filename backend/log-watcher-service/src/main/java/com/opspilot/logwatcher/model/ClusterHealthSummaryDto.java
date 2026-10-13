package com.opspilot.logwatcher.model;

import java.util.List;
import java.util.Map;

public class ClusterHealthSummaryDto {
    private int totalPods;
    private Map<String, Integer> podsByPhase; // Running: 5, Pending: 1, Failed: 0, Succeeded: 2
    private int totalRestarts;
    private double overallErrorRate; // Percentage e.g. 2.4%
    private Map<String, Double> errorRatePerPod; // podName -> errorRate percentage over last N minutes
    private List<CrashLoopPodDto> crashLoopPods;
    private List<CrashLoopPodDto> oomKilledPods;
    private int windowMinutes;
    private long totalLogLinesAnalyzed;

    public ClusterHealthSummaryDto() {
    }

    public ClusterHealthSummaryDto(int totalPods, Map<String, Integer> podsByPhase, int totalRestarts,
                                  double overallErrorRate, Map<String, Double> errorRatePerPod,
                                  List<CrashLoopPodDto> crashLoopPods, List<CrashLoopPodDto> oomKilledPods,
                                  int windowMinutes, long totalLogLinesAnalyzed) {
        this.totalPods = totalPods;
        this.podsByPhase = podsByPhase;
        this.totalRestarts = totalRestarts;
        this.overallErrorRate = overallErrorRate;
        this.errorRatePerPod = errorRatePerPod;
        this.crashLoopPods = crashLoopPods;
        this.oomKilledPods = oomKilledPods;
        this.windowMinutes = windowMinutes;
        this.totalLogLinesAnalyzed = totalLogLinesAnalyzed;
    }

    public int getTotalPods() {
        return totalPods;
    }

    public void setTotalPods(int totalPods) {
        this.totalPods = totalPods;
    }

    public Map<String, Integer> getPodsByPhase() {
        return podsByPhase;
    }

    public void setPodsByPhase(Map<String, Integer> podsByPhase) {
        this.podsByPhase = podsByPhase;
    }

    public int getTotalRestarts() {
        return totalRestarts;
    }

    public void setTotalRestarts(int totalRestarts) {
        this.totalRestarts = totalRestarts;
    }

    public double getOverallErrorRate() {
        return overallErrorRate;
    }

    public void setOverallErrorRate(double overallErrorRate) {
        this.overallErrorRate = overallErrorRate;
    }

    public Map<String, Double> getErrorRatePerPod() {
        return errorRatePerPod;
    }

    public void setErrorRatePerPod(Map<String, Double> errorRatePerPod) {
        this.errorRatePerPod = errorRatePerPod;
    }

    public List<CrashLoopPodDto> getCrashLoopPods() {
        return crashLoopPods;
    }

    public void setCrashLoopPods(List<CrashLoopPodDto> crashLoopPods) {
        this.crashLoopPods = crashLoopPods;
    }

    public List<CrashLoopPodDto> getOomKilledPods() {
        return oomKilledPods;
    }

    public void setOomKilledPods(List<CrashLoopPodDto> oomKilledPods) {
        this.oomKilledPods = oomKilledPods;
    }

    public int getWindowMinutes() {
        return windowMinutes;
    }

    public void setWindowMinutes(int windowMinutes) {
        this.windowMinutes = windowMinutes;
    }

    public long getTotalLogLinesAnalyzed() {
        return totalLogLinesAnalyzed;
    }

    public void setTotalLogLinesAnalyzed(long totalLogLinesAnalyzed) {
        this.totalLogLinesAnalyzed = totalLogLinesAnalyzed;
    }
}
