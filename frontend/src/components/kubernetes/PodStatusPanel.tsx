import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  type WatcherPodSummary,
  type ClusterHealthSummary
} from '../../services/api';
import {
  Server,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Terminal,
  HardDrive,
  XCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

interface PodStatusPanelProps {
  onSelectPod?: (podName: string, namespace: string) => void;
  selectedPodName?: string;
}

export const PodStatusPanel: React.FC<PodStatusPanelProps> = ({
  onSelectPod,
  selectedPodName
}) => {
  const [pods, setPods] = useState<WatcherPodSummary[]>([]);
  const [healthSummary, setHealthSummary] = useState<ClusterHealthSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const refreshInterval = 5000;
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [podsData, healthData] = await Promise.all([
        api.getWatcherPods(),
        api.getClusterHealthSummary(15)
      ]);
      setPods(podsData);
      setHealthSummary(healthData);
      setError('');
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to load pod status:', err);
      setError(err.message || 'Failed to communicate with log-watcher service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'running') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Running
        </span>
      );
    }
    if (s.includes('crashloop') || s === 'crashloopbackoff') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          CrashLoopBackOff
        </span>
      );
    }
    if (s.includes('oom') || s === 'oomkilled') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
          <HardDrive className="w-3 h-3 text-purple-400" />
          OOMKilled
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    }
    if (s === 'failed' || s === 'error') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3 text-rose-400" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
        <HelpCircle className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cluster Health Metrics Bar */}
      {healthSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-[#11141E] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Pods</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white font-mono">{healthSummary.totalPods}</span>
              <span className="text-xs text-slate-500 font-sans">monitored</span>
            </div>
          </div>

          <div className="bg-[#11141E] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Running</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {healthSummary.podsByPhase?.Running || 0}
              </span>
              <span className="text-xs text-emerald-500/70 font-sans">healthy</span>
            </div>
          </div>

          <div className="bg-[#11141E] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">CrashLoopBackOff</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${healthSummary.crashLoopPods?.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                {healthSummary.crashLoopPods?.length || 0}
              </span>
              <span className="text-xs text-rose-500/70 font-sans">critical</span>
            </div>
          </div>

          <div className="bg-[#11141E] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">OOMKilled</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${healthSummary.oomKilledPods?.length > 0 ? 'text-purple-400' : 'text-slate-400'}`}>
                {healthSummary.oomKilledPods?.length || 0}
              </span>
              <span className="text-xs text-purple-400/70 font-sans">memory</span>
            </div>
          </div>

          <div className="bg-[#11141E] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Restarts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${healthSummary.totalRestarts > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {healthSummary.totalRestarts}
              </span>
              <span className="text-xs text-amber-500/70 font-sans">events</span>
            </div>
          </div>

          <div className="bg-[#11141E] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Error Rate (15m)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${healthSummary.overallErrorRate > 5 ? 'text-rose-400' : 'text-cyan-400'}`}>
                {healthSummary.overallErrorRate}%
              </span>
              <span className="text-xs text-slate-500 font-sans">avg</span>
            </div>
          </div>
        </div>
      )}

      {/* Critical Failure Alerts Banner if CrashLoopBackOff or OOMKilled exists */}
      {healthSummary && (healthSummary.crashLoopPods.length > 0 || healthSummary.oomKilledPods.length > 0) && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <span className="font-semibold text-rose-200">Failure Signals Detected: </span>
              {healthSummary.crashLoopPods.map(p => (
                <span key={p.podName} className="mr-3 font-mono">
                  {p.podName} (CrashLoopBackOff, restarts: {p.restartCount})
                </span>
              ))}
              {healthSummary.oomKilledPods.map(p => (
                <span key={p.podName} className="mr-3 font-mono">
                  {p.podName} (OOMKilled, exitCode: {p.exitCode})
                </span>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-rose-400/80 font-mono shrink-0">Previous logs auto-captured</span>
        </div>
      )}

      {/* Pod Status Table */}
      <div className="bg-[#11141E] border border-white/10 rounded-xl shadow-xl overflow-hidden">
        {/* Table Controls Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Monitored Pods & Health State</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/5 text-slate-400 border border-white/10">
              {pods.length} active
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Auto-Refresh Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span>Auto-refresh</span>
            </label>

            {/* Manual Refresh Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
              title="Refresh now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <span className="text-[11px] text-slate-500">
              Updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {loading && pods.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin opacity-50" />
              Loading cluster pod information...
            </div>
          ) : pods.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <Server className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
              No pods found in the watched namespace.
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#0B0D13] text-slate-400 font-semibold border-b border-white/5 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Pod Name</th>
                  <th className="py-2.5 px-4">Namespace</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Ready</th>
                  <th className="py-2.5 px-4">Restarts</th>
                  <th className="py-2.5 px-4">Age</th>
                  <th className="py-2.5 px-4">Error Rate (15m)</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200 font-mono">
                {pods.map((pod) => {
                  const isSelected = pod.name === selectedPodName;
                  const errRate = healthSummary?.errorRatePerPod?.[pod.name] ?? 0;

                  return (
                    <tr
                      key={`${pod.namespace}/${pod.name}`}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isSelected ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[220px]" title={pod.name}>{pod.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{pod.namespace}</td>
                      <td className="py-3 px-4 font-sans">{getStatusBadge(pod.status)}</td>
                      <td className="py-3 px-4 text-slate-300">{pod.ready}</td>
                      <td className="py-3 px-4">
                        {pod.restarts > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {pod.restarts}
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{pod.age}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className={errRate > 10 ? 'text-rose-400 font-bold' : errRate > 0 ? 'text-amber-400' : 'text-slate-500'}>
                          {errRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectPod && onSelectPod(pod.name, pod.namespace)}
                          className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-sans text-xs transition-colors"
                        >
                          Stream Logs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
