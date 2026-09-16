import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { api, type MetricsData } from '../../services/api';

export const MonitoringView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'5m' | '1h' | '24h' | '7d'>('1h');

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchMonitoringData = async () => {
      try {
        const [metricsData, notifications] = await Promise.all([
          api.getMetrics('local').catch(() => null),
          api.getNotifications().catch(() => [])
        ]);

        if (!active) return;
        
        if (metricsData) {
          setMetrics(metricsData);
        }

        const filteredAlerts = notifications
          .filter(n => {
             const t = (n.type || '').toLowerCase();
             return t === 'alert' || t === 'error' || t === 'critical' || t === 'warning';
          })
          .map(n => {
             let severity = 'warning';
             const t = (n.type || '').toLowerCase();
             if (t === 'error' || t === 'critical' || t === 'alert') severity = 'critical';
             
             return {
               id: `alert-${n.notificationId}`,
               name: n.type,
               severity,
               service: 'System',
               summary: n.message,
               time: new Date(n.createdAt).toLocaleTimeString(),
               source: 'Backend'
             };
          });
        setAlerts(filteredAlerts);
      } catch (err) {
        console.error("Monitoring fetch failed", err);
      }
    };
    
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 10000); // 10s poll
    return () => { active = false; clearInterval(interval); };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Activity className="w-6 h-6 text-op-accent" /> Telemetry, Prometheus & Grafana Monitoring
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Real-time infrastructure performance, response time latency metrics, CPU/RAM charts & alert thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-op-raised border border-op-border rounded-lg p-0.5 text-xs">
            {(['5m', '1h', '24h', '7d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                  timeframe === tf
                    ? 'bg-op-accent text-op-accent-fg shadow-sm'
                    : 'text-op-muted hover:text-op-fg'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={() => alert('Launching Grafana Dashboard in new tab...')}
            className="text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-op-accent" /> Grafana Board
          </Button>
        </div>
      </div>

      {/* 4 Metric Telemetry Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-op-muted uppercase">Avg CPU Usage</span>
            <Cpu className="w-4 h-4 text-op-accent" />
          </div>
          <p className="text-2xl font-extrabold text-op-fg mt-2">{metrics?.cpuUsagePercent?.toFixed(1) || '0.0'}%</p>
          <div className="w-full bg-op-input h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-op-accent h-full" style={{ width: `${metrics?.cpuUsagePercent || 0}%` }} />
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-op-muted uppercase">Memory Allocated</span>
            <HardDrive className="w-4 h-4 text-op-highlight" />
          </div>
          <p className="text-2xl font-extrabold text-op-fg mt-2">{metrics ? (metrics.memoryUsedMb / 1024).toFixed(1) : '0'} GB / {metrics ? (metrics.memoryTotalMb / 1024).toFixed(1) : '0'} GB</p>
          <div className="w-full bg-op-input h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-op-highlight h-full" style={{ width: `${metrics ? (metrics.memoryUsedMb / metrics.memoryTotalMb) * 100 : 0}%` }} />
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-op-muted uppercase">Active Requests</span>
            <Zap className="w-4 h-4 text-op-success" />
          </div>
          <p className="text-2xl font-extrabold text-op-fg mt-2">{metrics?.activeRequests || 0}</p>
          <div className="w-full bg-op-input h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-op-success h-full w-full opacity-30" />
          </div>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-op-muted uppercase">Error Rate (5xx)</span>
            <AlertTriangle className="w-4 h-4 text-op-warn" />
          </div>
          <p className="text-2xl font-extrabold text-op-fg mt-2">0.00%</p>
          <div className="w-full bg-op-input h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-op-warn h-full w-0" />
          </div>
        </Card>
      </div>

      {/* 2 Big Chart Canvas Mockups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-op-fg uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-op-accent" /> Cluster CPU Utilization Over Time ({timeframe})
            </h3>
            <span className="text-[11px] font-mono text-op-muted">Prometheus Metric: node_cpu_seconds</span>
          </div>

          <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 pb-2 px-3 bg-op-bg/60 rounded-xl border border-op-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#363d4d15_1px,transparent_1px),linear-gradient(to_bottom,#363d4d15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            {metrics?.history?.length ? metrics.history.slice(-16).map((pt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative z-10">
                <div
                  style={{ height: `${pt.cpu}%` }}
                  className="w-full bg-gradient-to-t from-op-accent/30 to-op-accent rounded-t transition-all group-hover:from-op-accent group-hover:to-op-accent-hover cursor-pointer relative"
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-op-surface text-[10px] text-op-fg font-mono px-2 py-0.5 rounded border border-op-border shadow-lg pointer-events-none whitespace-nowrap z-20">
                    {pt.cpu.toFixed(1)}%
                  </div>
                </div>
              </div>
            )) : <div className="text-[11px] text-op-subtle z-10 p-2">Waiting for data...</div>}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-op-fg uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-op-highlight" /> Active Requests Over Time
            </h3>
            <span className="text-[11px] font-mono text-op-muted">Prometheus Metric: http_server_requests_active</span>
          </div>

          <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 pb-2 px-3 bg-op-bg/60 rounded-xl border border-op-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#363d4d15_1px,transparent_1px),linear-gradient(to_bottom,#363d4d15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            {metrics?.history?.length ? metrics.history.slice(-16).map((pt, i) => {
              const maxReqs = Math.max(...metrics.history.map(m => m.requests), 10);
              const height = (pt.requests / maxReqs) * 100;
              return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative z-10">
                <div
                  style={{ height: `${height}%` }}
                  className={`w-full rounded-t transition-all cursor-pointer relative ${
                    height > 80 ? 'bg-gradient-to-t from-op-highlight/40 to-op-highlight' : 'bg-gradient-to-t from-op-accent/30 to-op-accent'
                  }`}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-op-surface text-[10px] text-op-fg font-mono px-2 py-0.5 rounded border border-op-border shadow-lg pointer-events-none whitespace-nowrap z-20">
                    {pt.requests} reqs
                  </div>
                </div>
              </div>
            )}) : <div className="text-[11px] text-op-subtle z-10 p-2">Waiting for data...</div>}
          </div>
        </Card>
      </div>

      {/* Active Prometheus Alerts Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-op-fg">Prometheus Active Alerts</h2>

        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-op-border">
            {alerts.map((al) => (
              <div key={al.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-op-raised transition-colors">
                <div className="flex items-start gap-3">
                  {al.severity === 'critical' && <AlertTriangle className="w-4 h-4 text-op-danger flex-shrink-0 mt-0.5" />}
                  {al.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-op-warn flex-shrink-0 mt-0.5" />}
                  {al.severity === 'resolved' && <CheckCircle2 className="w-4 h-4 text-op-success flex-shrink-0 mt-0.5" />}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-op-fg font-mono">{al.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        al.severity === 'critical' ? 'bg-op-danger/15 text-op-danger border border-op-danger/30' : al.severity === 'warning' ? 'bg-op-warn/15 text-op-warn border border-op-warn/30' : 'bg-op-success/15 text-op-success border border-op-success/30'
                      }`}>
                        {al.severity}
                      </span>
                    </div>
                    <p className="text-xs text-op-muted mt-1">{al.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-op-subtle font-mono text-right">
                  <span>{al.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
