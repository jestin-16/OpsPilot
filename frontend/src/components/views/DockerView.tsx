import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Play,
  Square,
  RotateCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { api, type Container } from '../../services/api';
import { Link } from 'react-router-dom';

// ─── Status helpers ──────────────────────────────────────────────────────────

const normalizeStatus = (raw: string): string => (raw || '').toUpperCase();

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = normalizeStatus(status);
  if (s === 'RUNNING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-op-success/15 text-op-success border border-op-success/30">
        <span className="w-1.5 h-1.5 rounded-full bg-op-success animate-pulse" />
        Running
      </span>
    );
  }
  if (s === 'STARTING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-op-accent/15 text-op-accent border border-op-accent/30">
        <Loader2 className="w-3 h-3 animate-spin" />
        Starting
      </span>
    );
  }
  if (s === 'STOPPED' || s === 'EXITED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-op-subtle/10 text-op-subtle border border-op-border">
        <span className="w-1.5 h-1.5 rounded-full bg-op-subtle" />
        {s === 'EXITED' ? 'Exited' : 'Stopped'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-op-warn/15 text-op-warn border border-op-warn/30">
      <span className="w-1.5 h-1.5 rounded-full bg-op-warn" />
      {status}
    </span>
  );
};

// ─── Relative time helper ────────────────────────────────────────────────────

const relativeTime = (isoString: string): string => {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return isoString;
  }
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const DockerView: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Per-row action state: containerId → 'start' | 'stop' | 'restart' | null
  const [actionLoading, setActionLoading] = useState<Record<number, string | null>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedLogsContainer, setSelectedLogsContainer] = useState<string | null>(null);

  // ── Fetch containers ───────────────────────────────────────────────────────

  const fetchContainers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getDockerContainers();
      setContainers(data);
      setFetchError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch containers';
      setFetchError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + 5-second polling
  useEffect(() => {
    fetchContainers(false);
    const interval = setInterval(() => fetchContainers(true), 5000);
    return () => clearInterval(interval);
  }, [fetchContainers]);

  // ── Container actions ──────────────────────────────────────────────────────

  const performAction = async (
    containerId: number,
    containerName: string,
    action: 'start' | 'stop' | 'restart'
  ) => {
    setActionLoading((prev) => ({ ...prev, [containerId]: action }));
    setActionError(null);
    try {
      if (action === 'start') await api.startContainer(containerId);
      else if (action === 'stop') await api.stopContainer(containerId);
      else await api.restartContainer(containerId);

      // Fetch real state from backend — no optimistic update
      await fetchContainers(true);
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        `Failed to ${action} ${containerName}`;
      setActionError(serverMsg);
      // Still re-fetch to ensure UI reflects actual state
      await fetchContainers(true);
    } finally {
      setActionLoading((prev) => ({ ...prev, [containerId]: null }));
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────

  const runningCount = containers.filter(
    (c) => normalizeStatus(c.containerStatus) === 'RUNNING'
  ).length;

  const stoppedCount = containers.filter(
    (c) =>
      normalizeStatus(c.containerStatus) === 'STOPPED' ||
      normalizeStatus(c.containerStatus) === 'EXITED'
  ).length;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Box className="w-6 h-6 text-op-accent" /> Docker Container Management
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Live container lifecycle — data polled every 5 seconds from the backend.
            {lastRefreshed && (
              <span className="ml-2 text-op-subtle inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => fetchContainers(false)}
          className="text-xs py-2 px-3 flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-op-accent" /> Refresh Now
        </Button>
      </div>

      {/* Error Toast — action errors */}
      {actionError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-op-danger/10 border border-op-danger/30 text-op-danger text-xs font-semibold animate-fade-in-up">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-op-danger hover:text-op-fg transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-op-warn/10 border border-op-warn/30 text-op-warn text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Unable to reach Docker backend</p>
            <p className="text-op-muted font-normal mt-0.5">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 text-op-accent animate-spin" />
          <p className="text-sm text-op-muted">Fetching containers from backend…</p>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card hoverEffect className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-op-success/15 text-op-success border border-op-success/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-op-muted font-semibold uppercase">Running</span>
                <p className="text-xl font-bold text-op-fg">
                  {runningCount} container{runningCount !== 1 ? 's' : ''}
                </p>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-op-subtle/10 text-op-subtle border border-op-border">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-op-muted font-semibold uppercase">Stopped</span>
                <p className="text-xl font-bold text-op-fg">
                  {stoppedCount} container{stoppedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </Card>

            <Card hoverEffect className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-op-accent/15 text-op-accent border border-op-accent/30">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-op-muted font-semibold uppercase">Total</span>
                <p className="text-xl font-bold text-op-fg">
                  {containers.length} container{containers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </Card>
          </div>

          {/* Empty State */}
          {containers.length === 0 && !fetchError ? (
            <Card className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-5 rounded-2xl bg-op-raised border border-op-border">
                <Box className="w-10 h-10 text-op-subtle" />
              </div>
              <div>
                <p className="text-sm font-bold text-op-fg">No containers found</p>
                <p className="text-xs text-op-muted mt-1">
                  No containers are registered in the backend yet.
                </p>
                <p className="text-xs text-op-muted mt-0.5">
                  Deploy a project to see its containers appear here.
                </p>
              </div>
              <Link
                to="/deployments"
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-op-accent text-op-accent-fg text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Go to Deployment Center
              </Link>
            </Card>
          ) : (
            /* Container Table */
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-op-fg">
                  <thead className="bg-op-raised text-op-subtle uppercase tracking-wider font-semibold border-b border-op-border text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Container ID</th>
                      <th className="px-4 py-3">Image</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-op-border">
                    {containers.map((c) => {
                      const isActing = !!actionLoading[c.containerId];
                      const actingVerb = actionLoading[c.containerId];
                      const statusNorm = normalizeStatus(c.containerStatus);
                      const isRunning = statusNorm === 'RUNNING';

                      return (
                        <tr
                          key={c.containerId}
                          className={`hover:bg-op-raised transition-colors ${isActing ? 'opacity-70' : ''}`}
                        >
                          {/* Status */}
                          <td className="px-4 py-3">
                            <StatusBadge status={c.containerStatus} />
                          </td>

                          {/* Container ID */}
                          <td className="px-4 py-3 font-bold font-mono text-op-fg">
                            #{c.containerId}
                          </td>

                          {/* Image */}
                          <td className="px-4 py-3 font-mono text-[11px] text-op-accent">
                            {c.imageName}
                          </td>

                          {/* Created */}
                          <td className="px-4 py-3 font-mono text-[11px] text-op-muted">
                            {relativeTime(c.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Logs inspect */}
                              <button
                                onClick={() => setSelectedLogsContainer(`Container #${c.containerId} (${c.imageName})`)}
                                title="Inspect Logs"
                                disabled={isActing}
                                className="p-1.5 rounded bg-op-raised hover:bg-op-accent/20 text-op-accent border border-op-border transition-all cursor-pointer disabled:opacity-40"
                              >
                                <Terminal className="w-3.5 h-3.5" />
                              </button>

                              {/* Start or Stop */}
                              {isRunning ? (
                                <button
                                  onClick={() => performAction(c.containerId, `#${c.containerId}`, 'stop')}
                                  title="Stop Container"
                                  disabled={isActing}
                                  className="p-1.5 rounded bg-op-raised hover:bg-op-danger/20 text-op-danger border border-op-border transition-all cursor-pointer disabled:opacity-40 relative"
                                >
                                  {actingVerb === 'stop' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => performAction(c.containerId, `#${c.containerId}`, 'start')}
                                  title="Start Container"
                                  disabled={isActing}
                                  className="p-1.5 rounded bg-op-raised hover:bg-op-success/20 text-op-success border border-op-border transition-all cursor-pointer disabled:opacity-40"
                                >
                                  {actingVerb === 'start' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}

                              {/* Restart */}
                              <button
                                onClick={() => performAction(c.containerId, `#${c.containerId}`, 'restart')}
                                title="Restart Container"
                                disabled={isActing}
                                className="p-1.5 rounded bg-op-raised hover:bg-op-warn/20 text-op-warn border border-op-border transition-all cursor-pointer disabled:opacity-40"
                              >
                                {actingVerb === 'restart' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCw className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer: polling indicator */}
              <div className="px-4 py-2 bg-op-raised border-t border-op-border flex items-center gap-2 text-[10px] text-op-subtle">
                <span className="w-1.5 h-1.5 rounded-full bg-op-success animate-pulse" />
                Auto-refreshing every 5 seconds — changes made outside OpsPilot will appear automatically
              </div>
            </Card>
          )}
        </>
      )}

      {/* Terminal Log Modal */}
      {selectedLogsContainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="bg-op-surface border border-op-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-op-fg flex items-center gap-2">
                <Terminal className="w-4 h-4 text-op-accent" /> Logs — {selectedLogsContainer}
              </h3>
              <button
                onClick={() => setSelectedLogsContainer(null)}
                className="text-xs text-op-muted hover:text-op-fg font-bold cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <div className="bg-black/90 p-4 rounded-xl border border-op-border font-mono text-xs text-op-success h-64 overflow-y-auto flex flex-col gap-1 leading-relaxed">
              <span className="text-op-subtle">[Log streaming for individual containers requires the container logs API endpoint — coming in a future session.]</span>
              <span className="mt-2">[Container] {selectedLogsContainer} — status visible in table above</span>
              <span>[OpsPilot] Use the backend /docker/containers endpoint to verify live state.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
