import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type PipelineRun } from '../services/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { 
  ArrowLeft, RefreshCw, Terminal, GitPullRequest, GitBranch, GitCommit,
  CheckCircle2, XCircle, Clock, AlertCircle, PlayCircle, ExternalLink, RefreshCcw, Activity
} from 'lucide-react';

export const PipelineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [logs, setLogs] = useState<{ logs: string; exitCode: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = async (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [runData, logsData] = await Promise.all([
        api.getPipelineRun(Number(id)),
        api.getPipelineRunLogs(Number(id))
      ]);
      setRun(runData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to fetch pipeline detail', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading && !refreshing) {
    return (
      <SidebarLayout>
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-op-accent"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (!run) {
    return (
      <SidebarLayout>
        <div className="p-8 text-center text-op-muted">Pipeline run not found.</div>
      </SidebarLayout>
    );
  }

  const isSuccess = run.status.toLowerCase() === 'success' || run.status.toLowerCase() === 'completed';
  const isFailed = run.status.toLowerCase() === 'failed';
  
  // Create logical stages for visual representation based on final status
  const stages = [
    { name: 'Source', icon: <GitPullRequest className="w-5 h-5" />, status: 'success' },
    { name: 'Webhook', icon: <PlayCircle className="w-5 h-5" />, status: 'success' },
    { name: 'Build', icon: <Terminal className="w-5 h-5" />, status: isFailed && (run.exitCode !== 0) ? 'error' : 'success' },
    { name: 'Test', icon: <CheckCircle2 className="w-5 h-5" />, status: isFailed && (run.exitCode !== 0) ? 'error' : (isSuccess ? 'success' : 'pending') },
    { name: 'Docker', icon: <Terminal className="w-5 h-5" />, status: isFailed ? 'pending' : (isSuccess ? 'success' : 'pending') },
    { name: 'Deploy', icon: <PlayCircle className="w-5 h-5" />, status: isFailed ? 'pending' : (isSuccess ? 'success' : 'pending') },
    { name: 'Health Check', icon: <Activity className="w-5 h-5" />, status: isFailed ? 'pending' : (isSuccess ? 'success' : 'pending') },
  ];

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/pipelines')} className="p-2 hover:bg-op-raised rounded-lg text-op-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-op-fg">Pipeline #{run.runId}</h1>
                <Badge variant={isSuccess ? 'success' : isFailed ? 'error' : 'warning'}>{run.status}</Badge>
              </div>
              <p className="text-sm font-medium text-op-subtle mt-1 flex items-center gap-2">
                Triggered by <span className="text-op-fg">{run.author}</span> on {new Date(run.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => fetchDetail(true)} isLoading={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="primary" disabled title="Retry safely unsupported in this mock">
              <RefreshCcw className="w-4 h-4 mr-2" /> Retry Pipeline
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col gap-2">
            <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Repository Info</span>
            <div className="flex items-center gap-2 text-op-fg font-medium">
              <GitPullRequest className="w-4 h-4 text-op-accent" />
              {run.repoUrl || 'Unknown Repository'}
            </div>
            <div className="flex items-center gap-2 text-sm text-op-subtle mt-2">
              <GitBranch className="w-4 h-4" /> {run.branch}
            </div>
          </Card>
          
          <Card className="flex flex-col gap-2">
            <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Commit Detail</span>
            <div className="flex items-center gap-2 text-op-fg font-mono text-sm">
              <GitCommit className="w-4 h-4 text-op-accent" />
              {run.commitSha}
            </div>
            <div className="text-sm text-op-subtle mt-2 truncate" title={run.commitMessage}>
              "{run.commitMessage}"
            </div>
          </Card>

          <Card className="flex flex-col gap-2 relative overflow-hidden">
            <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Execution Summary</span>
            <div className="flex items-center gap-2 text-op-fg font-medium">
              <Clock className="w-4 h-4 text-op-accent" />
              Duration: {run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-sm text-op-subtle mt-2">
              <Terminal className="w-4 h-4" /> Exit Code: {logs?.exitCode ?? '-'}
            </div>
            {isFailed && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full flex items-start justify-end p-3">
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </div>
            )}
          </Card>
        </div>

        {/* Visual Pipeline Stages */}
        <div className="bg-op-surface border border-op-border rounded-2xl p-8 shadow-sm">
          <h3 className="text-sm font-bold text-op-muted uppercase tracking-wider mb-8">Pipeline Stages</h3>
          <div className="relative flex justify-between items-center w-full">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-op-raised -z-10 rounded-full"></div>
            
            {stages.map((stage, i) => {
              const bg = stage.status === 'success' ? 'bg-emerald-500' : stage.status === 'error' ? 'bg-rose-500' : 'bg-op-raised';
              const text = stage.status === 'success' ? 'text-white' : stage.status === 'error' ? 'text-white' : 'text-op-muted';
              const ring = stage.status === 'success' ? 'ring-emerald-100' : stage.status === 'error' ? 'ring-rose-100' : 'ring-op-surface';
              
              return (
                <div key={i} className="flex flex-col items-center gap-3 bg-op-surface px-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg} ${text} ring-8 ${ring} transition-all duration-300`}>
                    {stage.status === 'error' ? <XCircle className="w-6 h-6" /> : stage.icon}
                  </div>
                  <div className="text-sm font-bold text-op-fg">{stage.name}</div>
                  <div className="text-xs font-medium text-op-muted uppercase">
                    {stage.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Links to Projects / Deployments */}
        <div className="flex gap-4">
          {run.project?.id && (
            <Link to={`/projects/${run.project.id}`}>
              <Button variant="secondary">
                <ExternalLink className="w-4 h-4 mr-2" /> Open Project
              </Button>
            </Link>
          )}
          <Link to="/deployments">
            <Button variant="secondary">
              <ExternalLink className="w-4 h-4 mr-2" /> Open Deployments
            </Button>
          </Link>
        </div>

        {/* Logs Console */}
        <Card className="p-0 overflow-hidden bg-[#1E1E1E] border-none shadow-xl">
          <div className="bg-[#2D2D2D] px-4 py-3 flex items-center justify-between border-b border-[#404040]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-200">Execution Logs</span>
            </div>
            {logs?.exitCode !== undefined && (
              <Badge variant={logs.exitCode === 0 ? 'success' : 'error'} className="bg-opacity-20 border-opacity-20">
                Exit Code: {logs.exitCode}
              </Badge>
            )}
          </div>
          <div className="p-6 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed">
            {logs?.logs ? logs.logs : <span className="text-slate-500 italic">No logs available for this pipeline run.</span>}
          </div>
        </Card>

      </div>
    </SidebarLayout>
  );
};
