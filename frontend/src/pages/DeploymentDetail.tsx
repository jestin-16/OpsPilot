import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Deployment, type LogEntry } from '../services/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Timeline } from '../components/Timeline';
import { ArrowLeft, RefreshCw, Terminal, Clock, Building2, ExternalLink, GitBranch, User } from 'lucide-react';
import { DEPLOYMENT_SOURCE_LABEL, deployedBy, deploymentStatusVariant } from '../lib/deployments';

/** While GitHub is still reporting progress, refresh on this interval; finished deployments don't change. */
const IN_PROGRESS_REFRESH_MS = 10000;

export const DeploymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [depData, logsData] = await Promise.all([
        api.getDeployment(Number(id)),
        api.getDeploymentLogs(Number(id))
      ]);
      setDeployment(depData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to fetch deployment detail', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const inProgress = deployment?.status === 'In progress';
  useEffect(() => {
    if (!inProgress) return;
    const interval = setInterval(() => fetchDetail(true), IN_PROGRESS_REFRESH_MS);
    return () => clearInterval(interval);
  }, [inProgress, fetchDetail]);

  if (loading && !refreshing) {
    return (
      <SidebarLayout>
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-op-accent"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (!deployment) {
    return (
      <SidebarLayout>
        <div className="p-8 text-center text-op-muted">Deployment not found.</div>
      </SidebarLayout>
    );
  }

  const notable = logs.filter(l => l.logLevel === 'ERROR' || l.logLevel === 'WARN').slice(-10).reverse();

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/deployments')} className="p-2 hover:bg-op-raised rounded-lg text-op-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-op-fg">Deployment #{deployment.id}</h1>
                <Badge variant={deploymentStatusVariant(deployment.status)}>{deployment.status}</Badge>
                <Badge variant={deployment.source === 'SIMULATED' ? 'neutral' : 'info'}>{DEPLOYMENT_SOURCE_LABEL[deployment.source]}</Badge>
              </div>
              <p className="text-sm font-medium text-op-subtle mt-1">
                Deployed by <span className="text-op-fg">{deployedBy(deployment)}</span> on {new Date(deployment.deployedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {deployment.url && (
              <a href={deployment.url} target="_blank" rel="noreferrer"
                 className="inline-flex items-center rounded-lg border border-op-border px-4 py-2 text-sm font-semibold text-op-fg hover:bg-op-raised">
                <ExternalLink className="w-4 h-4 mr-2" /> Open
              </a>
            )}
            <Button variant="secondary" onClick={() => fetchDetail(true)} isLoading={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {deployment.source === 'SIMULATED' && (
          <Card className="border border-amber-200 bg-amber-50 text-sm text-amber-800">
            This record was produced by the deployment simulator that has been removed; it does not describe a real deployment.
            Remove such records with <code className="font-mono">scripts/db/delete_simulated_deployments.sql</code>.
          </Card>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="flex flex-col gap-2">
            <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Project</span>
            <div className="flex items-center gap-2 text-op-fg font-medium">
              <Building2 className="w-4 h-4 text-op-accent" />
              {deployment.projectName}
            </div>
          </Card>

          <Card className="flex flex-col gap-2">
            <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Version</span>
            <div className="flex items-center gap-2 text-op-fg font-mono text-sm">
              <GitBranch className="w-4 h-4 text-op-accent" />
              <Badge>{deployment.version}</Badge>
            </div>
          </Card>

          <Card className="flex flex-col gap-2">
            <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Environment</span>
            <div className="flex items-center gap-2 text-op-fg font-mono text-sm capitalize">
              {deployment.environment}
            </div>
          </Card>

          <Card className="flex flex-col gap-2">
            <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Deployed by</span>
            <div className="flex items-center gap-2 text-op-fg font-medium">
              <User className="w-4 h-4 text-op-accent" />
              {deployedBy(deployment)}
              <Clock className="w-4 h-4 text-op-subtle ml-2" />
              <span className="text-sm text-op-muted">{new Date(deployment.deployedAt).toLocaleTimeString()}</span>
            </div>
          </Card>
        </div>

        {/* Logs around the deployment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-op-fg">Project logs around this deployment</h3>
            <p className="text-xs text-op-muted -mt-2">From 5 minutes before to 15 minutes after it was deployed.</p>
            <Card className="p-0 overflow-hidden bg-[#1E1E1E] border-none shadow-xl">
              <div className="bg-[#2D2D2D] px-4 py-3 flex items-center gap-2 border-b border-[#404040]">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-200">Logs</span>
              </div>
              <div className="p-6 text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed flex flex-col gap-1">
                {logs.length > 0 ? logs.map(l => (
                  <div key={l.logId} className="flex gap-4">
                    <span className="text-slate-500 shrink-0">{new Date(l.timestamp).toLocaleTimeString()}</span>
                    <span className="text-slate-400 shrink-0">[{l.sourceService}]</span>
                    <span className={l.logLevel === 'ERROR' ? 'text-rose-400' : l.logLevel === 'WARN' ? 'text-amber-300' : 'text-slate-300'}>{l.message}</span>
                  </div>
                )) : <span className="text-slate-500 italic">No logs from this project around the deployment.</span>}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-op-fg">Errors and warnings</h3>
            <Card>
              {notable.length > 0 ? (
                <Timeline
                  events={notable.map(l => ({
                    id: l.logId,
                    title: `${l.logLevel} · ${l.sourceService}`,
                    description: l.message,
                    timestamp: new Date(l.timestamp).toLocaleString(),
                    status: l.logLevel === 'ERROR' ? 'error' : 'warning'
                  }))}
                />
              ) : (
                <p className="text-sm text-op-muted">None in this window.</p>
              )}
            </Card>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
};
