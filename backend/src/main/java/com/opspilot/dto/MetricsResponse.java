package com.opspilot.dto;

import java.util.List;

public class MetricsResponse {
    private double cpuUsagePercent;
    private long memoryUsedMb;
    private long memoryTotalMb;
    private int activeRequests;
    private int totalDeployments;
    private List<MetricPoint> history;

    public MetricsResponse() {}

    public MetricsResponse(double cpuUsagePercent, long memoryUsedMb, long memoryTotalMb, int activeRequests, int totalDeployments, List<MetricPoint> history) {
        this.cpuUsagePercent = cpuUsagePercent;
        this.memoryUsedMb = memoryUsedMb;
        this.memoryTotalMb = memoryTotalMb;
        this.activeRequests = activeRequests;
        this.totalDeployments = totalDeployments;
        this.history = history;
    }

    public double getCpuUsagePercent() {
        return cpuUsagePercent;
    }

    public void setCpuUsagePercent(double cpuUsagePercent) {
        this.cpuUsagePercent = cpuUsagePercent;
    }

    public long getMemoryUsedMb() {
        return memoryUsedMb;
    }

    public void setMemoryUsedMb(long memoryUsedMb) {
        this.memoryUsedMb = memoryUsedMb;
    }

    public long getMemoryTotalMb() {
        return memoryTotalMb;
    }

    public void setMemoryTotalMb(long memoryTotalMb) {
        this.memoryTotalMb = memoryTotalMb;
    }

    public int getActiveRequests() {
        return activeRequests;
    }

    public void setActiveRequests(int activeRequests) {
        this.activeRequests = activeRequests;
    }

    public int getTotalDeployments() {
        return totalDeployments;
    }

    public void setTotalDeployments(int totalDeployments) {
        this.totalDeployments = totalDeployments;
    }

    public List<MetricPoint> getHistory() {
        return history;
    }

    public void setHistory(List<MetricPoint> history) {
        this.history = history;
    }

    public static class MetricPoint {
        private String time;
        private double cpu;
        private long memory;
        private int requests;

        public MetricPoint() {}

        public MetricPoint(String time, double cpu, long memory, int requests) {
            this.time = time;
            this.cpu = cpu;
            this.memory = memory;
            this.requests = requests;
        }

        public String getTime() {
            return time;
        }

        public void setTime(String time) {
            this.time = time;
        }

        public double getCpu() {
            return cpu;
        }

        public void setCpu(double cpu) {
            this.cpu = cpu;
        }

        public long getMemory() {
            return memory;
        }

        public void setMemory(long memory) {
            this.memory = memory;
        }

        public int getRequests() {
            return requests;
        }

        public void setRequests(int requests) {
            this.requests = requests;
        }
    }
}
