import React, { useEffect, useState, useCallback } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { 
  api, type Project, type Container, type Pod, type Deployment, 
  type PipelineRun, type CommitLog, type LogEntry, type IntegrationHealthResponse 
} from '../services/api';
import { StatsCard } from '../components/StatsCard';
import { Table, type Column } from '../components/Table';
import { Timeline, type TimelineEvent } from '../components/Timeline';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { 
  FolderGit2, Rocket, Server, Activity, RefreshCw, AlertCircle, 
  Terminal, GitCommit, PlayCircle, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [pods, setPods] = useState<Pod[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
  const [commits, setCommits] = useState<CommitLog[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [health, setHealth] = useState<IntegrationHealthResponse | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [
        projectsData,
        containersData,
        podsData,
        deploymentsData,
        pipelinesData,
        commitsData,
        logsData,
        healthData
      ] = await Promise.all([
        api.getProjects().catch(() => [] as Project[]),
        api.getDockerContainers().catch(() => [] as Container[]),
        api.getKubernetesPods().catch(() => [] as Pod[]),
        api.getAllDeployments().catch(() => [] as Deployment[]),
        api.getPipelineRuns().catch(() => [] as PipelineRun[]),
        api.getCommits('ALL').catch(() => [] as CommitLog[]),
        api.getLogs({ logLevel: 'ERROR', limit: 10 }).catch(() => [] as LogEntry[]),
        api.getIntegrationHealth().catch(() => null)
      ]);

      setProjects(projectsData);
      setContainers(containersData);
      setPods(podsData);
      setDeployments(deploymentsData);
      setPipelines(pipelinesData);
      setCommits(commitsData);
      setLogs(logsData);
      setHealth(healthData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const successPipelines = pipelines.filter(p => ['success', 'SUCCESS', 'completed'].includes(p.status.toLowerCase())).length;
  const pipelineSuccessRate = pipelines.length > 0 ? Math.round((successPipelines / pipelines.length) * 100) : 0;

  const deploymentColumns: Column<Deployment>[] = [
    { key: 'projectName', header: 'Project' },
    { key: 'version', header: 'Version', render: (d) => <Badge>{d.version}</Badge> },
    { key: 'environment', header: 'Environment', render: (d) => <span className="capitalize">{d.environment}</span> },
    { key: 'status', header: 'Status', render: (d) => (
      <Badge variant={d.status.toLowerCase() === 'running' || d.status.toLowerCase() === 'success' ? 'success' : d.status.toLowerCase() === 'failed' ? 'error' : 'warning'}>
        {d.status}
      </Badge>
    )},
    { key: 'deployedAt', header: 'Deployed At', render: (d) => new Date(d.deployedAt).toLocaleString() }
  ];

  const logColumns: Column<LogEntry>[] = [
    { key: 'sourceService', header: 'Service', render: (l) => <span className="font-mono text-xs">{l.sourceService}</span> },
    { key: 'message', header: 'Error Message', render: (l) => <span className="text-rose-600 font-medium truncate max-w-md block">{l.message}</span> },
    { key: 'timestamp', header: 'Time', render: (l) => new Date(l.timestamp).toLocaleString() }
  ];

  const commitEvents: TimelineEvent[] = commits.slice(0, 5).map(c => ({
    id: c.commitLogId,
    title: c.message,
    description: `By ${c.author} on ${c.branchName} (${c.projectName || 'Unknown'})`,
    timestamp: new Date(c.timestamp).toLocaleString(),
    icon: <GitCommit className="w-4 h-4" />,
    status: 'neutral'
  }));

  const pipelineEvents: TimelineEvent[] = pipelines.slice(0, 5).map(p => ({
    id: p.runId,
    title: `${p.eventType} on ${p.branch}`,
    description: p.commitMessage,
    timestamp: new Date(p.createdAt).toLocaleString(),
    icon: <PlayCircle className="w-4 h-4" />,
    status: p.status.toLowerCase() === 'success' ? 'success' : p.status.toLowerCase() === 'failed' ? 'error' : 'warning'
  }));

  const getSystemStatus = () => {
    if (!health || health.integrations.length === 0) return 'inactive';
    const hasError = health.integrations.some(i => !i.available && i.enabled);
    return hasError ? 'error' : 'active';
  };

  if (loading && !refreshing && projects.length === 0) {
    return (
      <SidebarLayout>
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-op-accent"></div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-op-fg flex items-center gap-3">
              OpsPilot Command Center
            </h1>
            <p className="text-sm font-medium text-op-muted mt-2">
              Welcome, {user?.name}. Here is your operational overview.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusIndicator status={getSystemStatus()} text={`System: ${getSystemStatus()}`} />
            <Button variant="secondary" onClick={() => fetchData(true)} isLoading={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> 
              <span className="ml-2">Refresh</span>
            </Button>
            <Link to="/projects/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" /> New Project
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard 
            title="Active Projects" 
            value={projects.length} 
            icon={<FolderGit2 className="w-6 h-6" />} 
          />
          <StatsCard 
            title="Running Containers" 
            value={containers.length} 
            icon={<Terminal className="w-6 h-6" />} 
          />
          <StatsCard 
            title="Kubernetes Pods" 
            value={pods.length} 
            icon={<Server className="w-6 h-6" />} 
          />
          <StatsCard 
            title="Total Deployments" 
            value={deployments.length} 
            icon={<Rocket className="w-6 h-6" />} 
          />
          <StatsCard 
            title="Pipeline Success Rate" 
            value={`${pipelineSuccessRate}%`} 
            icon={<Activity className="w-6 h-6" />} 
            trend={pipelines.length > 0 ? { value: pipelineSuccessRate, isPositive: pipelineSuccessRate > 80 } : undefined}
          />
        </div>

        {/* Middle Section: Tables and Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Recent Deployments</h3>
              {deployments.length > 0 ? (
                <Table data={deployments.slice(0, 5)} columns={deploymentColumns} keyExtractor={(d) => d.id} />
              ) : (
                <EmptyState title="No Deployments" description="There are currently no deployments across any project." icon={<Rocket />} />
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Recent Incidents (Errors)</h3>
              {logs.length > 0 ? (
                <Table data={logs} columns={logColumns} keyExtractor={(l) => l.logId} />
              ) : (
                <EmptyState title="No Errors Found" description="System is running smoothly without recent logged errors." icon={<Activity />} />
              )}
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Infrastructure Health</h3>
              <div className="space-y-4">
                {health?.integrations && health.integrations.length > 0 ? (
                  health.integrations.map(integration => (
                    <div key={integration.name} className="flex items-center justify-between p-3 border border-op-border rounded-lg bg-op-raised">
                      <span className="font-medium text-sm text-op-fg">{integration.name}</span>
                      <StatusIndicator status={integration.available ? 'active' : 'error'} text={integration.status} />
                    </div>
                  ))
                ) : (
                  <EmptyState title="No Integrations" description="Health metrics are unavailable." />
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Recent Commits</h3>
              {commits.length > 0 ? (
                <Timeline events={commitEvents} />
              ) : (
                <EmptyState title="No Commits" description="No GitHub commits have been synced." />
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Recent Pipelines</h3>
              {pipelines.length > 0 ? (
                <Timeline events={pipelineEvents} />
              ) : (
                <EmptyState title="No Pipelines" description="No CI/CD pipeline runs recorded." />
              )}
            </Card>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
};
