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

const matchesSeverity = (value: string | null | undefined, filter: string) => {
  if (filter === 'ALL') return true;
  const severity = (value ?? '').toUpperCase();
  if (filter === 'CRITICAL') return ['CRITICAL', 'ERROR', 'FATAL'].includes(severity);
  if (filter === 'WARNING') return ['WARNING', 'WARN'].includes(severity);
  return ['INFO', 'SUCCESS', 'LOW'].includes(severity);
};

const BREAKDOWN_PROVIDERS = ['DOCKER', 'KUBERNETES', 'AWS', 'VERCEL', 'ORACLE_CLOUD'];

const FilterTrigger: React.FC<{ label: string }> = ({ label }) => (
  <button type="button" className="group flex min-h-10 min-w-[170px] items-center justify-between gap-4 rounded-full border border-op-border-strong bg-white px-4 py-2 text-left text-xs font-semibold text-op-fg transition-colors hover:bg-op-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
    <span className="truncate">{label}</span>
    <ChevronDown className="w-3.5 h-3.5 text-op-muted shrink-0 transition-transform duration-200 group-hover:translate-y-0.5" />
  </button>
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
      const failedRequests: string[] = [];
      const loadOrDefault = async <T,>(label: string, request: Promise<T>, fallback: T): Promise<T> => {
        try {
          return await request;
        } catch {
          failedRequests.push(label);
          return fallback;
        }
      };
      const [
        projectsData, deploymentsData, pipelinesData, 
        logsData, healthData, resourcesData, eventsData, 
        alertsData, incidentsData
      ] = await Promise.all([
        loadOrDefault('projects', api.getProjects(), [] as Project[]),
        loadOrDefault('deployments', api.getAllDeployments(), [] as Deployment[]),
        loadOrDefault('pipelines', api.getPipelineRuns(), [] as PipelineRun[]),
        loadOrDefault('error logs', api.getLogs({ logLevel: 'ERROR', limit: 50 }), [] as LogEntry[]),
        loadOrDefault('integration health', api.getIntegrationHealth(), null),
        loadOrDefault('resources', api.getResources(), [] as PlatformResource[]),
        loadOrDefault('events', api.getEvents(), [] as InfrastructureEvent[]),
        loadOrDefault('alerts', api.getAlerts(), [] as Alert[]),
        loadOrDefault('incidents', api.getIncidents(), [] as Incident[]),
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
      if (failedRequests.length > 0) {
        setError(`Dashboard data is incomplete. Could not load: ${failedRequests.join(', ')}. Use Refresh to try again.`);
      }
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

  const scopedDeployments = deployments
    .filter(d => filterProject === 'ALL' || d.projectId?.toString() === filterProject)
    .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
  const scopedPipelines = pipelines.filter(p => filterProject === 'ALL' || p.project?.id?.toString() === filterProject);
  const scopedIncidents = incidents.filter(i =>
    (filterProject === 'ALL' || i.project?.id?.toString() === filterProject) && matchesSeverity(i.severity, filterSeverity)
  ).sort((a, b) => new Date(b.startedAt || b.createdAt).getTime() - new Date(a.startedAt || a.createdAt).getTime());
  const scopedAlerts = alerts.filter(a =>
    (filterProject === 'ALL' || a.projectId?.toString() === filterProject) && matchesSeverity(a.severity, filterSeverity)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const issueFeed = [
    ...scopedIncidents.map(incident => ({
      id: `incident-${incident.id}`,
      kind: 'Incident' as const,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      timestamp: incident.startedAt || incident.createdAt,
      resource: undefined as string | undefined,
      resolved: ['RESOLVED', 'CLOSED', 'FIXED'].includes(incident.status.toUpperCase()),
    })),
    ...scopedAlerts.map(alert => ({
      id: `alert-${alert.id}`,
      kind: 'Alert' as const,
      title: alert.eventType,
      severity: alert.severity,
      status: alert.status,
      timestamp: alert.createdAt,
      resource: alert.resource,
      resolved: ['RESOLVED', 'CLOSED', 'FIXED'].includes(alert.status.toUpperCase()),
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);
  const scopedEvents = events.filter(e =>
    (filterProject === 'ALL' || e.projectId?.toString() === filterProject) &&
    (filterProvider === 'ALL' || e.provider === filterProvider)
  );
  const scopedLogs = logs.filter(l =>
    (filterProject === 'ALL' || l.project?.id?.toString() === filterProject) &&
    (filterProvider === 'ALL' || l.providerSource === filterProvider)
  );

  const healthyResources = filteredResources.filter(r => r.status === 'HEALTHY' || r.status === 'RUNNING' || r.status === 'ACTIVE').length;
  const criticalResources = filteredResources.filter(r => r.status === 'CRITICAL' || r.status === 'FAILED' || r.status === 'STOPPED').length;
  const warningResources = filteredResources.filter(r => r.status === 'WARNING' || r.status === 'DEGRADED').length;

  const providerCounts = filteredResources.reduce((acc: Record<string, number>, r) => {
    acc[r.provider] = (acc[r.provider] || 0) + 1;
    return acc;
  }, {});

  const successPipelines = scopedPipelines.filter(p => ['success', 'SUCCESS', 'completed'].includes(p.status.toLowerCase())).length;
  const pipelineSuccessRate = scopedPipelines.length > 0 ? Math.round((successPipelines / scopedPipelines.length) * 100) : 0;

  // Build live activity feed timeline
  const activityFeed = useMemo(() => {
    const allActivities: (TimelineEvent & { rawDate: string; severity: string })[] = [];
    
    // Add deployments
    scopedDeployments.forEach(d => {
      allActivities.push({
        id: `dep-${d.id}`,
        title: `Deployment ${d.status}: ${d.projectName}`,
        description: `Version ${d.version} to ${d.environment}`,
        timestamp: new Date(d.deployedAt).toLocaleString(),
        rawDate: d.deployedAt,
        icon: <Rocket className="w-4 h-4" />,
        status: timelineStatus(deploymentStatusVariant(d.status)),
        severity: deploymentStatusVariant(d.status) === 'error' ? 'CRITICAL' : deploymentStatusVariant(d.status) === 'warning' ? 'WARNING' : 'INFO'
      });
    });

    // Add events
    scopedEvents.forEach(e => {
      allActivities.push({
        id: `evt-${e.id}`,
        title: `Event: ${e.eventType}`,
        description: errorMessage(e, `Provider: ${e.provider}`),
        timestamp: new Date(e.timestamp).toLocaleString(),
        rawDate: e.timestamp,
        icon: <Activity className="w-4 h-4" />,
        status: e.severity === 'CRITICAL' || e.severity === 'ERROR' ? 'error' : e.severity === 'WARNING' ? 'warning' : 'success',
        severity: e.severity ?? 'INFO'
      });
    });

    // Add incidents
    scopedIncidents.forEach(i => {
      allActivities.push({
        id: `inc-${i.id}`,
        title: `Incident [${i.status}]: ${i.title}`,
        description: `Severity: ${i.severity}`,
        timestamp: new Date(i.startedAt || i.createdAt).toLocaleString(),
        rawDate: i.startedAt || i.createdAt,
        icon: <AlertCircle className="w-4 h-4" />,
        status: i.status === 'OPEN' ? 'error' : 'success',
        severity: i.severity
      });
    });
    
    // Add errors logs
    scopedLogs.forEach(l => {
      allActivities.push({
        id: `log-${l.logId}`,
        title: `Error Log: ${l.sourceService}`,
        description: l.message,
        timestamp: new Date(l.timestamp).toLocaleString(),
        rawDate: l.timestamp,
        icon: <Terminal className="w-4 h-4" />,
        status: 'error',
        severity: l.logLevel
      });
    });

    // Sort by timestamp desc and filter
    const sorted = allActivities
      .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
      .filter(a => {
        return matchesSeverity(a.severity, filterSeverity);
      });
      
    return sorted.slice(0, 50);
  }, [scopedDeployments, scopedEvents, scopedIncidents, scopedLogs, filterSeverity]);

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
      <div className="space-y-7">

        {/* Top Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="min-w-0">
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-op-muted">Operations / Overview</p>
            <h1 className="text-3xl font-semibold tracking-tight text-op-fg sm:text-4xl">
              Command center
            </h1>
            <p className="mt-2 text-sm text-op-muted">
              Welcome, {user?.name}. Monitor your projects, infrastructure, and releases in one place.
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
          <div role="alert" className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 flex flex-wrap items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{error}</p>
            <Button variant="secondary" onClick={() => fetchData(true)} disabled={refreshing} className="py-1.5 text-xs">Retry</Button>
          </div>
        )}

        {/* Scope and resource filters */}
        <div className="bg-op-surface p-3 rounded-2xl border border-op-border flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 text-[10px] text-op-muted font-semibold mr-1 uppercase tracking-[0.14em]">
            <Filter className="w-3.5 h-3.5 text-op-muted" /> Scope & resources
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

        </div>

        {/* Statistics Grid - Normalized Resources */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Resources in scope"
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-3">
            <h3 className="text-lg font-bold text-op-fg mb-4">Resources by provider</h3>
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
            title="Pipeline success rate"
            value={`${pipelineSuccessRate}%`}
            icon={<Activity className="w-6 h-6" />}
            className="lg:col-span-2 justify-between"
          />
        </div>

        {/* Middle Section: Tables and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4 min-w-0">
            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Recent Deployments</h3>
              {scopedDeployments.length > 0 ? (
                <Table data={scopedDeployments.slice(0, 5)} columns={deploymentColumns} keyExtractor={(d) => d.id} />
              ) : (
                <EmptyState title="No Deployments" description="There are currently no deployments across any project." icon={<Rocket />} />
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-op-fg mb-4">Alerts and incidents</h3>
              {issueFeed.length > 0 ? (
                <div className="divide-y divide-op-border">
                  {issueFeed.map(issue => (
                    <div key={issue.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${issue.resolved ? 'bg-emerald-500' : issue.severity.toUpperCase() === 'INFO' ? 'bg-sky-500' : issue.severity.toUpperCase() === 'WARNING' || issue.severity.toUpperCase() === 'WARN' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          <p className="truncate text-sm font-semibold text-op-fg">{issue.title}</p>
                        </div>
                        <p className="mt-1 pl-4 text-xs text-op-muted">
                          {issue.kind} · {issue.severity}{issue.resource ? ` · ${issue.resource}` : ''} · {new Date(issue.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={issue.resolved ? 'success' : ['CRITICAL', 'ERROR', 'FATAL'].includes(issue.severity.toUpperCase()) ? 'error' : issue.severity.toUpperCase() === 'INFO' ? 'info' : 'warning'} className="shrink-0">{issue.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No matching issues" description="No alerts or incidents match the current project and severity filters." icon={<Activity />} />
              )}
            </Card>
          </div>

          <div className="space-y-4 min-w-0">
            <Card>
              <div className="flex justify-between items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-op-fg">Recent activity</h3>
                <Badge variant="info" className="shrink-0">{activityFeed.length} events</Badge>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-op-border pb-4">
                <span className="text-xs text-op-muted">Deployments, cluster events, incidents, and error logs.</span>
                <Dropdown
                  align="right"
                  trigger={<FilterTrigger label={filterSeverity === 'ALL' ? 'All severities' : SEVERITY_LABELS[filterSeverity] ?? filterSeverity} />}
                  items={[
                    { key: 'ALL', label: 'All severities', onClick: () => setFilterSeverity('ALL') },
                    ...Object.entries(SEVERITY_LABELS).map(([key, label]) => ({ key, label, onClick: () => setFilterSeverity(key) })),
                  ]}
                />
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
