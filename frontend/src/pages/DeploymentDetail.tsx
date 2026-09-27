import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Deployment, type LogEntry } from '../services/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Timeline } from '../components/Timeline';
import { 
  ArrowLeft, RefreshCw, Terminal, 
  CheckCircle2, XCircle, Clock, PlayCircle, RotateCcw, Building2
} from 'lucide-react';

export const DeploymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [previousStable, setPreviousStable] = useState<Deployment | null>(null);

  const fetchDetail = async (isRefresh = false) => {
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
      
      const allDeps = await api.getDeployments(depData.projectId);
      const stable = allDeps.find(d => 
        d.status.toLowerCase() === 'running' && 
        d.id !== depData.id && 
        new Date(d.deployedAt).getTime() < new Date(depData.deployedAt).getTime()
      );
      setPreviousStable(stable || null);
    } catch (err) {
      console.error('Failed to fetch deployment detail', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(() => fetchDetail(true), 5000);
    return () => clearInterval(interval);
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

  if (!deployment) {
    return (
      <SidebarLayout>
        <div className="p-8 text-center text-op-muted">Deployment not found.</div>
      </SidebarLayout>
    );
  }

  const handleRollback = async () => {
    if (!window.confirm('Trigger a rollback for this deployment to the previous stable version?')) return;
    setRollingBack(true);
    try {
      await api.rollbackDeployment(deployment.id);
      navigate('/deployments');
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        alert('Forbidden: You are not authorized to perform a rollback.');
      } else {
        alert('Failed to rollback: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setRollingBack(false);
    }
  };

  // Determine stage visual state based on backend status string
  const s = deployment.status.toLowerCase();
  
  const lifecycleStages = [
    { name: 'Draft', status: 'success' },
    { name: 'Building', status: s === 'draft' ? 'pending' : (s === 'failed' ? 'error' : 'success') },
    { name: 'Deploying', status: (s === 'draft' || s === 'building') ? 'pending' : (s === 'failed' ? 'error' : 'success') },
    { name: 'Running', status: s === 'running' ? 'success' : (s === 'failed' ? 'error' : 'pending') },
  ];

  if (s.includes('roll')) {
    lifecycleStages.push(
      { name: 'Rolling Back', status: 'success' },
      { name: 'Previous Version', status: 'success' },
      { name: 'Health Check', status: 'pending' }
    );
  }

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
                <Badge variant={s === 'running' ? 'success' : s === 'failed' ? 'error' : 'warning'}>{deployment.status}</Badge>
              </div>
              <p className="text-sm font-medium text-op-subtle mt-1 flex items-center gap-2">
                Deployed by <span className="text-op-fg">{deployment.deployedByName || 'System'}</span> on {new Date(deployment.deployedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => fetchDetail(true)} isLoading={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            {s !== 'rolledback' && previousStable && (
              <Button variant="secondary" onClick={handleRollback} isLoading={rollingBack}>
                <RotateCcw className="w-4 h-4 mr-2 text-rose-500" /> Rollback
              </Button>
            )}
          </div>
        </div>

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
            <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Timing</span>
            <div className="flex items-center gap-2 text-op-fg font-medium">
              <Clock className="w-4 h-4 text-op-accent" />
              {new Date(deployment.deployedAt).toLocaleTimeString()}
            </div>
          </Card>
          
          {previousStable && (
            <Card className="flex flex-col gap-2 md:col-span-4 bg-op-raised/50 border border-op-border">
              <span className="text-xs font-bold text-op-muted uppercase tracking-wider">Previous Stable Version</span>
              <div className="flex items-center gap-2 text-op-fg font-medium text-sm">
                Deployment #{previousStable.id} (<Badge variant="success">{previousStable.version}</Badge>) deployed at {new Date(previousStable.deployedAt).toLocaleString()}
              </div>
            </Card>
          )}
        </div>

        {/* Visual Lifecycle */}
        <div className="bg-op-surface border border-op-border rounded-2xl p-8 shadow-sm">
          <h3 className="text-sm font-bold text-op-muted uppercase tracking-wider mb-8">Deployment Lifecycle</h3>
          <div className="relative flex justify-between items-center w-full">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-op-raised -z-10 rounded-full"></div>
            
            {lifecycleStages.map((stage, i) => {
              const isError = stage.status === 'error';
              const isSuccess = stage.status === 'success';
              const bg = isSuccess ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-op-raised';
              const text = (isSuccess || isError) ? 'text-white' : 'text-op-muted';
              const ring = isSuccess ? 'ring-emerald-100' : isError ? 'ring-rose-100' : 'ring-op-surface';
              
              let Icon = PlayCircle;
              if (stage.name === 'Running' || stage.name === 'Health Check' || stage.name === 'Previous Version') Icon = CheckCircle2;
              if (stage.name === 'Draft' || stage.name === 'Building') Icon = Terminal;
              if (stage.name === 'Rolling Back') Icon = RotateCcw;
              
              return (
                <div key={i} className="flex flex-col items-center gap-3 bg-op-surface px-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg} ${text} ring-8 ${ring} transition-all duration-300`}>
                    {isError ? <XCircle className="w-6 h-6" /> : (
                      stage.status === 'pending' && i > 0 && lifecycleStages[i-1].status === 'success' ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-op-fg whitespace-nowrap">{stage.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Tabs (Logs vs History) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-op-fg">Deployment Logs</h3>
            <Card className="p-0 overflow-hidden bg-[#1E1E1E] border-none shadow-xl">
              <div className="bg-[#2D2D2D] px-4 py-3 flex items-center gap-2 border-b border-[#404040]">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-200">System Logs</span>
              </div>
              <div className="p-6 text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed flex flex-col gap-1">
                {logs.length > 0 ? logs.map(l => (
                  <div key={l.logId} className="flex gap-4">
                    <span className="text-slate-500 shrink-0">{new Date(l.timestamp).toLocaleTimeString()}</span>
                    <span className="text-slate-400 shrink-0">[{l.sourceService}]</span>
                    <span className={l.logLevel === 'ERROR' ? 'text-rose-400' : 'text-slate-300'}>{l.message}</span>
                  </div>
                )) : <span className="text-slate-500 italic">No logs generated for this deployment yet.</span>}
              </div>
            </Card>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-op-fg">Event History</h3>
            <Card>
              <Timeline 
                events={logs.slice(0, 10).map(l => ({
                  id: l.logId,
                  title: l.logLevel,
                  description: l.message,
                  timestamp: new Date(l.timestamp).toLocaleString(),
                  status: l.logLevel === 'ERROR' ? 'error' : 'success'
                }))} 
              />
            </Card>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
};
