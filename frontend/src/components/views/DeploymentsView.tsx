import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Play,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Clock,
  Box,
  ExternalLink,
  FolderGit2,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { api, type Deployment, type Project } from '../../services/api';
import { Link } from 'react-router-dom';

// ─── Status helpers ──────────────────────────────────────────────────────────

type DeployStatus = 'Draft' | 'Building' | 'Deploying' | 'Running' | 'Failed' | 'RolledBack' | string;

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; label: string }> = {
  Draft:      { color: 'text-op-subtle',  bg: 'bg-op-subtle/10',   border: 'border-op-border',        dot: 'bg-op-subtle',   label: 'Draft'      },
  Building:   { color: 'text-op-accent',  bg: 'bg-op-accent/15',   border: 'border-op-accent/30',     dot: 'bg-op-accent',   label: 'Building'   },
  Deploying:  { color: 'text-op-warn',    bg: 'bg-op-warn/15',     border: 'border-op-warn/30',       dot: 'bg-op-warn',     label: 'Deploying'  },
  Running:    { color: 'text-op-success', bg: 'bg-op-success/15',  border: 'border-op-success/30',    dot: 'bg-op-success',  label: 'Running'    },
  Failed:     { color: 'text-op-danger',  bg: 'bg-op-danger/15',   border: 'border-op-danger/30',     dot: 'bg-op-danger',   label: 'Failed'     },
  RolledBack: { color: 'text-op-subtle',  bg: 'bg-op-subtle/10',   border: 'border-op-border',        dot: 'bg-op-subtle',   label: 'Rolled Back'},
};

const getStatusCfg = (status: DeployStatus) =>
  STATUS_CONFIG[status] ?? { color: 'text-op-muted', bg: 'bg-op-raised', border: 'border-op-border', dot: 'bg-op-muted', label: status };

const StatusBadge: React.FC<{ status: DeployStatus }> = ({ status }) => {
  const cfg = getStatusCfg(status);
  const isAnimated = status === 'Building' || status === 'Deploying';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      {status === 'Building' || status === 'Deploying' ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : status === 'Failed' ? (
        <AlertTriangle className="w-3 h-3" />
      ) : status === 'Running' ? (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isAnimated ? 'animate-pulse' : ''}`} />
      )}
      {cfg.label}
    </span>
  );
};

// ─── Stage progress bar (status-driven, not timer-driven) ────────────────────

const STAGES = ['Draft', 'Building', 'Deploying', 'Running'];

const StatusProgressBar: React.FC<{ status: DeployStatus }> = ({ status }) => {
  const idx = STAGES.indexOf(status);
  if (status === 'Failed' || status === 'RolledBack') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-op-subtle">
          {STAGES.map((s) => <span key={s}>{s}</span>)}
        </div>
        <div className="w-full bg-op-input h-2 rounded-full overflow-hidden flex">
          <div className="bg-op-danger h-full rounded-full" style={{ width: '100%', opacity: 0.5 }} />
        </div>
        <p className="text-[10px] text-op-danger font-semibold">
          {status === 'Failed' ? 'Pipeline failed — see error details below' : 'Rolled back to previous version'}
        </p>
      </div>
    );
  }

  const pct = idx < 0 ? 0 : (idx / (STAGES.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] font-mono">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={
              i < idx
                ? 'text-op-success font-bold'
                : i === idx
                ? 'text-op-accent font-bold'
                : 'text-op-subtle'
            }
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <div className="w-full bg-op-input h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-700 rounded-full ${
            status === 'Running' ? 'bg-op-success' : 'bg-op-accent animate-pulse'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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

// ─── Deploy Modal ────────────────────────────────────────────────────────────

interface DeployModalProps {
  projects: Project[];
  onClose: () => void;
  onTriggered: () => void;
}

const DeployModal: React.FC<DeployModalProps> = ({ projects, onClose, onTriggered }) => {
  const [projectId, setProjectId] = useState<number | ''>(projects[0]?.id ?? '');
  const [version, setVersion] = useState('v1.0.0');
  const [environment, setEnvironment] = useState('Production');
  const [triggering, setTriggering] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setTriggering(true);
    setErr(null);
    try {
      await api.triggerDeployment(Number(projectId), { version, environment });
      onTriggered();
      onClose();
    } catch (error: any) {
      setErr(error?.response?.data?.message || error?.message || 'Failed to trigger deployment');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-op-surface border border-op-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
        <h3 className="text-base font-bold text-op-fg flex items-center gap-2">
          <Rocket className="w-5 h-5 text-op-accent" /> Trigger New Deployment
        </h3>
        <p className="text-xs text-op-muted">
          Select a project and environment to launch a real deployment pipeline.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          <div>
            <label className="block text-op-muted font-semibold mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="w-full bg-op-input text-op-fg rounded-lg p-2.5 border border-op-border-strong"
              required
            >
              {projects.length === 0 && <option value="">No projects found</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-op-muted font-semibold mb-1">Version Tag</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full bg-op-input text-op-fg rounded-lg p-2.5 border border-op-border-strong font-mono"
              placeholder="v1.0.0"
              required
            />
          </div>
          <div>
            <label className="block text-op-muted font-semibold mb-1">Target Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full bg-op-input text-op-fg rounded-lg p-2.5 border border-op-border-strong"
            >
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Dev">Development</option>
            </select>
          </div>

          {err && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-op-danger/10 border border-op-danger/30 text-op-danger text-[11px] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {err}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-op-border">
            <Button variant="ghost" type="button" onClick={onClose} className="text-xs">Cancel</Button>
            <Button variant="primary" type="submit" isLoading={triggering} className="text-xs">
              Launch Pipeline
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const DeploymentsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

  // ── Load projects ──────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0].id);
      } catch (err: any) {
        setFetchError(err?.message || 'Failed to load projects');
      } finally {
        setLoadingProjects(false);
      }
    };
    load();
  }, []);

  // ── Poll deployments ───────────────────────────────────────────────────────

  const fetchDeployments = useCallback(async (silent = false) => {
    if (!selectedProjectId) return;
    if (!silent) setLoadingDeployments(true);
    try {
      const data = await api.getDeployments(selectedProjectId);
      setDeployments(data);
      setFetchError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch deployments';
      setFetchError(msg);
    } finally {
      if (!silent) setLoadingDeployments(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchDeployments(false);
    const interval = setInterval(() => fetchDeployments(true), 5000);
    return () => clearInterval(interval);
  }, [fetchDeployments, selectedProjectId]);

  // ── Rollback (status update to RolledBack) ─────────────────────────────────

  const handleRollback = async (dep: Deployment) => {
    if (!window.confirm(`Roll back deployment #${dep.id} (${dep.projectName} ${dep.version})? This will trigger a new deployment marked as RolledBack.`)) return;
    setRollingBack(dep.id);
    setActionError(null);
    try {
      // Rollback triggers a new deployment with the same version tagged as rollback
      await api.triggerDeployment(dep.projectId, { version: `${dep.version}-rollback`, environment: dep.environment });
      await fetchDeployments(true);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Rollback failed');
    } finally {
      setRollingBack(null);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeDeployments = deployments.filter(
    (d) => d.status === 'Building' || d.status === 'Deploying' || d.status === 'Draft'
  );

  const environments = [...new Set(deployments.map((d) => d.environment))];

  const filteredHistory = deployments.filter(
    (d) => envFilter === 'all' || d.environment === envFilter
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Rocket className="w-6 h-6 text-op-accent" /> Deployment Center
          </h1>
          <p className="text-xs text-op-muted mt-1">
            Real deployment status polled every 5 seconds from the backend.
            {lastRefreshed && (
              <span className="ml-2 text-op-subtle inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fetchDeployments(false)}
            className="text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-op-accent" /> Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsDeployModalOpen(true)}
            disabled={projects.length === 0}
            className="text-xs py-2.5 px-4 flex items-center gap-1.5 self-start md:self-auto"
          >
            <Play className="w-4 h-4" /> Trigger Deployment
          </Button>
        </div>
      </div>

      {/* Project Selector */}
      {!loadingProjects && (
        <div className="flex items-center gap-3">
          <FolderGit2 className="w-4 h-4 text-op-accent shrink-0" />
          <label className="text-xs font-semibold text-op-muted">Project:</label>
          <div className="flex items-center bg-op-raised border border-op-border rounded-lg p-0.5 text-xs gap-0.5">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedProjectId(p.id); setEnvFilter('all'); }}
                className={`px-3 py-1.5 rounded-md transition-all font-semibold cursor-pointer ${
                  selectedProjectId === p.id
                    ? 'bg-op-accent text-op-accent-fg shadow-sm'
                    : 'text-op-muted hover:text-op-fg'
                }`}
              >
                {p.projectName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Banners */}
      {actionError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-op-danger/10 border border-op-danger/30 text-op-danger text-xs font-semibold animate-fade-in-up">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-op-danger hover:text-op-fg cursor-pointer">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      {fetchError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-op-warn/10 border border-op-warn/30 text-op-warn text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Backend unreachable</p>
            <p className="text-op-muted font-normal mt-0.5">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {(loadingProjects || loadingDeployments) && (
        <Card className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="w-6 h-6 text-op-accent animate-spin" />
          <p className="text-sm text-op-muted">
            {loadingProjects ? 'Loading projects…' : 'Fetching deployments…'}
          </p>
        </Card>
      )}

      {!loadingProjects && !loadingDeployments && selectedProjectId && (
        <>
          {/* Active / In-Progress Deployments */}
          {activeDeployments.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold text-op-fg flex items-center gap-2">
                <Layers className="w-4 h-4 text-op-accent" />
                Active Pipelines ({activeDeployments.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {activeDeployments.map((dep) => (
                  <Card key={dep.id} className="border-l-4 border-l-op-accent bg-op-surface/80">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-op-accent/15 text-op-accent border border-op-accent/30 animate-pulse">
                            <Rocket className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-op-fg">{dep.projectName}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-op-input text-op-accent border border-op-border">
                                {dep.version}
                              </span>
                              <StatusBadge status={dep.status} />
                            </div>
                            <p className="text-xs text-op-muted mt-0.5">
                              Environment: <strong className="text-op-fg">{dep.environment}</strong> •
                              Triggered by {dep.deployedByName} ({relativeTime(dep.deployedAt)})
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Status-driven progress bar — no fixed timers */}
                      <StatusProgressBar status={dep.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No deployments empty state */}
          {deployments.length === 0 && !fetchError && (
            <Card className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-5 rounded-2xl bg-op-raised border border-op-border">
                <Rocket className="w-10 h-10 text-op-subtle" />
              </div>
              <div>
                <p className="text-sm font-bold text-op-fg">No deployments yet</p>
                <p className="text-xs text-op-muted mt-1">
                  Trigger a deployment for this project to see status updates here.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setIsDeployModalOpen(true)}
                className="mt-2 text-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> Trigger First Deployment
              </Button>
            </Card>
          )}

          {/* Deployment History */}
          {deployments.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-bold text-op-fg">Deployment History</h2>
                {environments.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-op-subtle" />
                    <div className="flex items-center bg-op-raised border border-op-border rounded-lg p-0.5 text-xs gap-0.5">
                      <button
                        onClick={() => setEnvFilter('all')}
                        className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                          envFilter === 'all' ? 'bg-op-accent text-op-accent-fg' : 'text-op-muted hover:text-op-fg'
                        }`}
                      >
                        All
                      </button>
                      {environments.map((env) => (
                        <button
                          key={env}
                          onClick={() => setEnvFilter(env)}
                          className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                            envFilter === env ? 'bg-op-accent text-op-accent-fg' : 'text-op-muted hover:text-op-fg'
                          }`}
                        >
                          {env}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-op-fg">
                    <thead className="bg-op-raised text-op-subtle uppercase tracking-wider font-semibold border-b border-op-border text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Project & Version</th>
                        <th className="px-4 py-3">Environment</th>
                        <th className="px-4 py-3">Deployed By</th>
                        <th className="px-4 py-3">When</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-op-border">
                      {filteredHistory.map((dep) => {
                        const isRunning = dep.status === 'Running';
                        const isFailed = dep.status === 'Failed';

                        return (
                          <tr key={dep.id} className="hover:bg-op-raised/60 transition-colors">
                            {/* Status */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <StatusBadge status={dep.status} />
                                {isFailed && (
                                  <span className="text-[10px] text-op-danger font-mono">
                                    Deployment #{dep.id} failed
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Project & Version */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-op-fg">{dep.projectName}</span>
                                <span className="text-[11px] font-mono text-op-accent">{dep.version}</span>
                              </div>
                            </td>

                            {/* Environment */}
                            <td className="px-4 py-3 font-mono text-[11px] text-op-muted">{dep.environment}</td>

                            {/* Deployed By */}
                            <td className="px-4 py-3 text-op-muted">{dep.deployedByName}</td>

                            {/* When */}
                            <td className="px-4 py-3 font-mono text-[11px] text-op-muted">
                              {relativeTime(dep.deployedAt)}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Cross-link to Docker when Running */}
                                {isRunning && (
                                  <Link
                                    to="/docker"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-op-success/15 hover:bg-op-success/25 text-op-success text-[11px] font-semibold border border-op-success/30 transition-all"
                                    title="View containers for this deployment"
                                  >
                                    <Box className="w-3 h-3" />
                                    View Containers
                                    <ChevronRight className="w-3 h-3" />
                                  </Link>
                                )}

                                {/* Rollback */}
                                <button
                                  onClick={() => handleRollback(dep)}
                                  disabled={rollingBack === dep.id}
                                  className="px-2.5 py-1 rounded bg-op-raised hover:bg-op-danger/20 text-op-muted hover:text-op-danger text-[11px] font-semibold flex items-center gap-1 border border-op-border ml-auto transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {rollingBack === dep.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3 h-3" />
                                  )}
                                  Rollback
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Polling footer */}
                <div className="px-4 py-2 bg-op-raised/40 border-t border-op-border flex items-center gap-2 text-[10px] text-op-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-op-success animate-pulse" />
                  Auto-refreshing every 5 seconds — status updates from backend appear without manual reload
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* No projects */}
      {!loadingProjects && projects.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <FolderGit2 className="w-10 h-10 text-op-subtle" />
          <div>
            <p className="text-sm font-bold text-op-fg">No projects found</p>
            <p className="text-xs text-op-muted mt-1">Create a project first, then trigger a deployment from here.</p>
          </div>
          <Link
            to="/projects"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-op-accent text-op-accent-fg text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Go to Projects
          </Link>
        </Card>
      )}

      {/* Deploy Modal */}
      {isDeployModalOpen && (
        <DeployModal
          projects={projects}
          onClose={() => setIsDeployModalOpen(false)}
          onTriggered={() => fetchDeployments(false)}
        />
      )}
    </div>
  );
};
