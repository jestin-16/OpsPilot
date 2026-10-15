import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { api, type Project, type Deployment, type PipelineRun, type LogEntry, type IntegrationHealthResponse, type PlatformResource, type InfrastructureEvent, type Alert, type Incident } from '../services/api';
import { StatsCard } from '../components/StatsCard';
import { Table, type Column } from '../components/Table';
import { Timeline, type TimelineEvent } from '../components/Timeline';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { StatusIndicator } from '../components/StatusIndicator';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Dropdown } from '../components/Dropdown';
import { 
  Rocket, Server, Activity, RefreshCw, AlertCircle, 
  Terminal, Plus, Filter, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../services/projectApi';
import { deploymentStatusVariant } from '../lib/deployments';

const timelineStatus = (variant: string): 'success' | 'error' | 'warning' =>
  variant === 'success' ? 'success' : variant === 'error' ? 'error' : 'warning';

const PROVIDER_LABELS: Record<string, string> = {
  DOCKER: 'Docker',
  KUBERNETES: 'Kubernetes',
  AWS: 'AWS',
  VERCEL: 'Vercel',
  ORACLE_CLOUD: 'Oracle Cloud',
  GITHUB: 'GitHub',
};

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critical / Error',
  WARNING: 'Warning',
  INFO: 'Info / Success',
};

const BREAKDOWN_PROVIDERS = ['DOCKER', 'KUBERNETES', 'AWS', 'VERCEL', 'ORACLE_CLOUD'];

const FilterTrigger: React.FC<{ label: string }> = ({ label }) => (
  <div className="group flex items-center justify-between min-w-[180px] px-4 py-2.5 bg-op-accent/5 border border-op-accent/15 rounded-full text-sm font-semibold text-op-fg hover:bg-op-accent/10 hover:border-op-accent/40 transition-colors duration-200 cursor-pointer shadow-sm">
    <span className="truncate">{label}</span>
    <ChevronDown className="w-4 h-4 text-op-accent ml-3 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5" />
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [health, setHealth] = useState<IntegrationHealthResponse | null>(null);
  
  const [resources, setResources] = useState<PlatformResource[]>([]);
  const [events, setEvents] = useState<InfrastructureEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Filters
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterProvider, setFilterProvider] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [
        projectsData, deploymentsData, pipelinesData, 
        logsData, healthData, resourcesData, eventsData, 
        alertsData, incidentsData
      ] = await Promise.all([
        api.getProjects().catch(() => [] as Project[]),
        api.getAllDeployments().catch(() => [] as Deployment[]),
        api.getPipelineRuns().catch(() => [] as PipelineRun[]),
        api.getLogs({ logLevel: 'ERROR', limit: 50 }).catch(() => [] as LogEntry[]),
        api.getIntegrationHealth().catch(() => null),
        api.getResources().catch(() => []),
        api.getEvents().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getIncidents().catch(() => []),
      ]);

      setProjects(projectsData);
      setDeployments(deploymentsData);
      setPipelines(pipelinesData);
      setLogs(logsData);
      setHealth(healthData);
      
      setResources(resourcesData);
      setEvents(eventsData);
      setAlerts(alertsData);
      setIncidents(incidentsData);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived metrics for resources

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (filterProject !== 'ALL' && r.projectId?.toString() !== filterProject) return false;
      if (filterProvider !== 'ALL' && r.provider !== filterProvider) return false;
      return true;
    });
  }, [resources, filterProject, filterProvider]);

  const healthyResources = filteredResources.filter(r => r.status === 'HEALTHY' || r.status === 'RUNNING' || r.status === 'ACTIVE').length;
  const criticalResources = filteredResources.filter(r => r.status === 'CRITICAL' || r.status === 'FAILED' || r.status === 'STOPPED').length;
  const warningResources = filteredResources.filter(r => r.status === 'WARNING' || r.status === 'DEGRADED').length;

  const providerCounts = filteredResources.reduce((acc: Record<string, number>, r) => {
    acc[r.provider] = (acc[r.provider] || 0) + 1;
    return acc;
  }, {});

  const successPipelines = pipelines.filter(p => ['success', 'SUCCESS', 'completed'].includes(p.status.toLowerCase())).length;
  const pipelineSuccessRate = pipelines.length > 0 ? Math.round((successPipelines / pipelines.length) * 100) : 0;

  // Build live activity feed timeline
  const activityFeed = useMemo(() => {
    const allActivities: (TimelineEvent & { rawDate: string })[] = [];
    
    // Add deployments
    deployments.forEach(d => {
      allActivities.push({
        id: `dep-${d.id}`,
        title: `Deployment ${d.status}: ${d.projectName}`,
        description: `Version ${d.version} to ${d.environment}`,
        timestamp: new Date(d.deployedAt).toLocaleString(),
        rawDate: d.deployedAt,
        icon: <Rocket className="w-4 h-4" />,
        status: timelineStatus(deploymentStatusVariant(d.status))
      });
    });

    // Add events
    events.forEach(e => {
      allActivities.push({
        id: `evt-${e.id}`,
        title: `Event: ${e.eventType}`,
        description: errorMessage(e, `Provider: ${e.provider}`),
        timestamp: new Date(e.timestamp).toLocaleString(),
        rawDate: e.timestamp,
        icon: <Activity className="w-4 h-4" />,
        status: e.severity === 'CRITICAL' ? 'error' : e.severity === 'WARNING' ? 'warning' : 'success'
      });
    });

    // Add incidents
    incidents.forEach(i => {
      allActivities.push({
        id: `inc-${i.id}`,
        title: `Incident [${i.status}]: ${i.title}`,
        description: `Severity: ${i.severity}`,
        timestamp: new Date(i.startedAt || i.createdAt).toLocaleString(),
        rawDate: i.startedAt || i.createdAt,
        icon: <AlertCircle className="w-4 h-4" />,
        status: i.status === 'OPEN' ? 'error' : 'success'
      });
    });
    
    // Add errors logs
    logs.forEach(l => {
      allActivities.push({
        id: `log-${l.logId}`,
        title: `Error Log: ${l.sourceService}`,
        description: l.message,
        timestamp: new Date(l.timestamp).toLocaleString(),
        rawDate: l.timestamp,
        icon: <Terminal className="w-4 h-4" />,
        status: 'error'
      });
    });

    // Sort by timestamp desc and filter
    const sorted = allActivities
      .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
      .filter(a => {
        if (filterSeverity !== 'ALL' && a.status !== filterSeverity.toLowerCase() && !(filterSeverity === 'CRITICAL' && a.status === 'error')) return false;
        return true;
      });
      
    return sorted.slice(0, 50);
  }, [deployments, events, incidents, logs, filterSeverity]);

  const deploymentColumns: Column<Deployment>[] = [
    { key: 'projectName', header: 'Project' },
    { key: 'version', header: 'Version', render: (d) => <Badge>{d.version}</Badge> },
    { key: 'environment', header: 'Environment', render: (d) => <span className="capitalize">{d.environment}</span> },
    { key: 'status', header: 'Status', render: (d) => (
      <Badge variant={deploymentStatusVariant(d.status)}>
        {d.status}
      </Badge>
    )},
    { key: 'deployedAt', header: 'Deployed At', render: (d) => new Date(d.deployedAt).toLocaleString() }
  ];

  const getSystemStatus = () => {
    if (criticalResources > 0) return 'error';
    if (!health) return 'inactive';
    if (health.overallStatus === 'CRITICAL') return 'error';
    if (health.overallStatus === 'DEGRADED' || health.overallStatus === 'OPERATIONAL_WITH_WARNINGS' || warningResources > 0) return 'pending';
    return 'active';
  };

  const getSystemStatusReason = () => {
    if (criticalResources > 0) return 'Critical';
    if (!health) return 'Inactive';
    if (health.overallStatus === 'CRITICAL') return 'Critical';
    if (health.overallStatus === 'DEGRADED') return 'Degraded';
    if (health.overallStatus === 'OPERATIONAL_WITH_WARNINGS' || warningResources > 0) return 'Operational with warnings';
    return 'Operational';
  };

  if (loading && !refreshing && projects.length === 0) {
    return (
      <SidebarLayout>
        <div className="flex h-full min-h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-op-accent"></div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-6 lg:p-8 space-y-6">

        {/* Top Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-op-fg">
              OpsPilot Command Center
            </h1>
            <p className="text-sm font-medium text-op-muted mt-2">
              Welcome, {user?.name}. Here is your operational overview across all connected providers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusIndicator status={getSystemStatus()} text={`System: ${getSystemStatusReason()}`} className="mr-1" />
            <Button variant="secondary" onClick={() => fetchData(true)} disabled={refreshing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="primary" onClick={() => navigate('/projects/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Global Filters */}
        <div className="bg-op-surface/70 backdrop-blur-md p-4 rounded-xl shadow-sm border border-op-border flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-xs text-op-muted font-bold mr-2 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-op-accent" /> Filters
          </div>

          <Dropdown
            align="left"
            trigger={
              <FilterTrigger
                label={filterProject === 'ALL' ? 'All Projects' : projects.find(p => p.id.toString() === filterProject)?.projectName || 'Select Project'}
              />
            }
            items={[
              { key: 'ALL', label: 'All Projects', onClick: () => setFilterProject('ALL') },
              ...projects.map(p => ({
                key: p.id.toString(),
                label: p.projectName,
                onClick: () => setFilterProject(p.id.toString())
              }))
            ]}
          />

          <Dropdown
            align="left"
            trigger={<FilterTrigger label={filterProvider === 'ALL' ? 'All Providers' : PROVIDER_LABELS[filterProvider] ?? filterProvider} />}
            items={[
              { key: 'ALL', label: 'All Providers', onClick: () => setFilterProvider('ALL') },
              ...Object.entries(PROVIDER_LABELS).map(([key, label]) => ({
                key,
                label,
                onClick: () => setFilterProvider(key)
              }))
            ]}
          />

          <Dropdown
            align="left"
            trigger={<FilterTrigger label={filterSeverity === 'ALL' ? 'All Severities' : SEVERITY_LABELS[filterSeverity] ?? filterSeverity} />}
            items={[
              { key: 'ALL', label: 'All Severities', onClick: () => setFilterSeverity('ALL') },
              ...Object.entries(SEVERITY_LABELS).map(([key, label]) => ({
                key,
                label,
                onClick: () => setFilterSeverity(key)
              }))
            ]}
          />
        </div>

        {/* Statistics Grid - Normalized Resources */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Resources"
            value={filteredResources.length}
            icon={<Server className="w-6 h-6" />}
          />
          <StatsCard
            title="Healthy Resources"
            value={healthyResources}
            icon={<Activity className="w-6 h-6 text-emerald-600" />}
          />
          <StatsCard
            title="Warning Resources"
            value={warningResources}
            icon={<AlertCircle className="w-6 h-6 text-amber-600" />}
          />
          <StatsCard
            title="Critical Resources"
            value={criticalResources}
            icon={<AlertCircle className="w-6 h-6 text-rose-600" />}
          />
        </div>

        {/* Provider Breakdown & Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-3">
            <h3 className="text-lg font-bold text-op-fg mb-4">Provider Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              {BREAKDOWN_PROVIDERS.map(provider => (
                <div key={provider} className="p-4 bg-op-raised rounded-xl border border-op-border text-center">
                  <p className="text-xs text-op-muted font-semibold uppercase tracking-wider mb-1 truncate">{PROVIDER_LABELS[provider]}</p>
                  <p className="text-2xl font-bold text-op-accent">{providerCounts[provider] || 0}</p>
                </div>
              ))}
            </div>
          </Card>
          <StatsCard
            title="Pipeline Success Rate"
            value={`${pipelineSuccessRate}%`}
            icon={<Activity className="w-6 h-6" />}
            className="lg:col-span-2 justify-between"
          />
        </div>

        {/* Middle Section: Tables and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Recent Deployments</h3>
              {deployments.length > 0 ? (
                <Table data={deployments.slice(0, 5)} columns={deploymentColumns} keyExtractor={(d) => d.id} />
              ) : (
                <EmptyState title="No Deployments" description="There are currently no deployments across any project." icon={<Rocket />} />
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Normalized Alerts & Incidents</h3>
              {incidents.length > 0 || alerts.length > 0 ? (
                <div className="space-y-3">
                  {incidents.slice(0, 5).map(i => (
                    <div key={`inc-${i.id}`} className="flex justify-between items-center gap-4 p-4 bg-rose-50 border border-rose-100 rounded-lg">
                      <div className="min-w-0">
                        <p className="font-semibold text-rose-700 truncate">Incident: {i.title}</p>
                        <p className="text-xs text-rose-600 mt-1">Severity: {i.severity} | Status: {i.status}</p>
                      </div>
                      <Badge variant="error" className="shrink-0">Active</Badge>
                    </div>
                  ))}
                  {alerts.slice(0, 5).map(a => (
                    <div key={`alert-${a.id}`} className="flex justify-between items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="min-w-0">
                        <p className="font-semibold text-amber-800 truncate">Alert: {a.eventType}</p>
                        <p className="text-xs text-amber-700 mt-1">Severity: {a.severity} | Resource: {a.resource ?? '—'}</p>
                      </div>
                      <Badge variant="warning" className="shrink-0">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="System Healthy" description="No active incidents or alerts detected." icon={<Activity />} />
              )}
            </Card>
          </div>

          <div className="space-y-6 min-w-0">
            <Card>
              <div className="flex justify-between items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-op-fg">Live Activity Feed</h3>
                <Badge variant="info" className="shrink-0">{activityFeed.length} events</Badge>
              </div>
              {activityFeed.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto pr-2 pt-1">
                  <Timeline events={activityFeed} />
                </div>
              ) : (
                <EmptyState title="No Activity" description="No recent events, alerts, or deployments found." />
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Infrastructure Health</h3>
              {health?.integrations && health.integrations.length > 0 ? (
                <div className="space-y-3">
                  {health.integrations.map(integration => (
                    <div key={integration.provider} className="flex flex-col gap-1 p-3 border border-op-border rounded-lg bg-op-raised">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-sm text-op-fg truncate">{PROVIDER_LABELS[integration.provider] ?? integration.provider}</span>
                        <StatusIndicator
                          status={integration.status === 'CONNECTED' ? 'active' : integration.status === 'DISABLED' ? 'inactive' : 'error'}
                          text={integration.status.toLowerCase()}
                          className="shrink-0"
                        />
                      </div>
                      {integration.message && (
                        <span className="text-xs text-op-muted break-words">{integration.message}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No Integrations" description="Health metrics are unavailable." />
              )}
            </Card>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
};
