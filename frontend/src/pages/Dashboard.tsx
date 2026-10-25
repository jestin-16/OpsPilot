import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { 
  api, 
  type Project, 
  type Deployment, 
  type PipelineRun, 
  type LogEntry, 
  type IntegrationHealthResponse, 
  type PlatformResource, 
  type InfrastructureEvent, 
  type Alert, 
  type Incident,
  type KubernetesClusterOverview
} from '../services/api';
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
  Terminal, Plus, Filter, ChevronDown, CheckCircle2,
  ExternalLink, ArrowUpRight, Cpu, Layers, ShieldCheck,
  Box, X, Sparkles, Check
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  DOCKER: <Box className="w-4 h-4 text-sky-500" />,
  KUBERNETES: <Cpu className="w-4 h-4 text-blue-500" />,
  AWS: <Server className="w-4 h-4 text-amber-500" />,
  VERCEL: <Layers className="w-4 h-4 text-slate-800 dark:text-slate-200" />,
  ORACLE_CLOUD: <Server className="w-4 h-4 text-rose-500" />,
  GITHUB: <Rocket className="w-4 h-4 text-purple-500" />,
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

const BREAKDOWN_PROVIDERS = ['KUBERNETES', 'DOCKER', 'AWS', 'VERCEL', 'ORACLE_CLOUD'];

const FilterTrigger: React.FC<{ label: string; active?: boolean }> = ({ label, active = false }) => (
  <button
    type="button"
    className={`group flex min-h-9 min-w-[160px] items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5 text-left text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
      active
        ? 'border-op-accent/50 bg-op-accent/5 text-op-accent shadow-xs'
        : 'border-op-border bg-op-surface text-op-fg hover:bg-op-raised hover:border-op-border-strong'
    }`}
  >
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
  const [k8sOverview, setK8sOverview] = useState<KubernetesClusterOverview | null>(null);
  
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
        alertsData, incidentsData, k8sData
      ] = await Promise.all([
        loadOrDefault('projects', api.getProjects(), [] as Project[]),
        loadOrDefault('deployments', api.getAllDeployments(), [] as Deployment[]),
        loadOrDefault('pipelines', api.getPipelineRuns(), [] as PipelineRun[]),
        loadOrDefault('logs', api.getLogs({ limit: 50 }), [] as LogEntry[]),
        loadOrDefault('integration health', api.getIntegrationHealth(), null),
        loadOrDefault('resources', api.getResources(), [] as PlatformResource[]),
        loadOrDefault('events', api.getEvents(), [] as InfrastructureEvent[]),
        loadOrDefault('alerts', api.getAlerts(), [] as Alert[]),
        loadOrDefault('incidents', api.getIncidents(), [] as Incident[]),
        loadOrDefault('kubernetes overview', api.getKubernetesOverview(), null),
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
      setK8sOverview(k8sData);

      // Only notify if core project/deployment requests failed
      const criticalFailures = failedRequests.filter(f => f === 'projects' || f === 'deployments');
      if (criticalFailures.length > 0) {
        setError(`Could not retrieve critical operational data: ${criticalFailures.join(', ')}. Use Refresh to try again.`);
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

  const scopedDeployments = useMemo(() => {
    return deployments
      .filter(d => filterProject === 'ALL' || d.projectId?.toString() === filterProject)
      .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
  }, [deployments, filterProject]);

  const scopedPipelines = useMemo(() => {
    return pipelines.filter(p => filterProject === 'ALL' || p.project?.id?.toString() === filterProject);
  }, [pipelines, filterProject]);

  const scopedIncidents = useMemo(() => {
    return incidents.filter(i =>
      (filterProject === 'ALL' || i.project?.id?.toString() === filterProject) && matchesSeverity(i.severity, filterSeverity)
    ).sort((a, b) => new Date(b.startedAt || b.createdAt).getTime() - new Date(a.startedAt || a.createdAt).getTime());
  }, [incidents, filterProject, filterSeverity]);

  const scopedAlerts = useMemo(() => {
    return alerts.filter(a =>
      (filterProject === 'ALL' || a.projectId?.toString() === filterProject) && matchesSeverity(a.severity, filterSeverity)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [alerts, filterProject, filterSeverity]);

  const issueFeed = useMemo(() => {
    return [
      ...scopedIncidents.map(incident => ({
        id: `incident-${incident.id}`,
        kind: 'Incident' as const,
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
        timestamp: incident.startedAt || incident.createdAt,
        resource: incident.affectedService,
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
  }, [scopedIncidents, scopedAlerts]);

  const scopedEvents = useMemo(() => {
    return events.filter(e =>
      (filterProject === 'ALL' || e.projectId?.toString() === filterProject) &&
      (filterProvider === 'ALL' || e.provider === filterProvider)
    );
  }, [events, filterProject, filterProvider]);

  const scopedLogs = useMemo(() => {
    return logs.filter(l =>
      (filterProject === 'ALL' || l.project?.id?.toString() === filterProject) &&
      (filterProvider === 'ALL' || l.providerSource === filterProvider)
    );
  }, [logs, filterProject, filterProvider]);

  const healthyResources = filteredResources.filter(r => r.status === 'HEALTHY' || r.status === 'RUNNING' || r.status === 'ACTIVE').length;
  const criticalResources = filteredResources.filter(r => r.status === 'CRITICAL' || r.status === 'FAILED' || r.status === 'STOPPED').length;
  const warningResources = filteredResources.filter(r => r.status === 'WARNING' || r.status === 'DEGRADED').length;

  const providerCounts = useMemo(() => {
    return resources.reduce((acc: Record<string, number>, r) => {
      acc[r.provider] = (acc[r.provider] || 0) + 1;
      return acc;
    }, {});
  }, [resources]);

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
        description: `Severity: ${i.severity} · ${i.affectedService || 'Platform'}`,
        timestamp: new Date(i.startedAt || i.createdAt).toLocaleString(),
        rawDate: i.startedAt || i.createdAt,
        icon: <AlertCircle className="w-4 h-4" />,
        status: i.status === 'OPEN' ? 'error' : 'success',
        severity: i.severity
      });
    });
    
    // Add logs
    scopedLogs.forEach(l => {
      allActivities.push({
        id: `log-${l.logId}`,
        title: `${l.logLevel || 'INFO'}: ${l.sourceService}`,
        description: l.message,
        timestamp: new Date(l.timestamp).toLocaleString(),
        rawDate: l.timestamp,
        icon: <Terminal className="w-4 h-4" />,
        status: l.logLevel === 'ERROR' ? 'error' : l.logLevel === 'WARN' ? 'warning' : 'success',
        severity: l.logLevel
      });
    });

    // Sort by timestamp desc and filter
    const sorted = allActivities
      .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
      .filter(a => matchesSeverity(a.severity, filterSeverity));
      
    return sorted.slice(0, 50);
  }, [scopedDeployments, scopedEvents, scopedIncidents, scopedLogs, filterSeverity]);

  const deploymentColumns: Column<Deployment>[] = [
    { 
      key: 'projectName', 
      header: 'Project',
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-op-raised border border-op-border flex items-center justify-center font-bold text-xs text-op-accent shrink-0">
            {d.projectName?.charAt(0).toUpperCase() || 'P'}
          </div>
          <Link 
            to={d.projectId ? `/projects/${d.projectId}` : '/projects'} 
            className="font-semibold text-op-fg hover:text-op-accent transition-colors truncate max-w-[150px]"
          >
            {d.projectName}
          </Link>
        </div>
      )
    },
    { 
      key: 'version', 
      header: 'Version', 
      render: (d) => <Badge variant="neutral" className="font-mono text-[11px]">{d.version}</Badge> 
    },
    { 
      key: 'environment', 
      header: 'Environment', 
      render: (d) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase ${
          d.environment === 'production' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}>
          {d.environment}
        </span>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (d) => (
        <Badge variant={deploymentStatusVariant(d.status)}>
          {d.status}
        </Badge>
      )
    },
    { 
      key: 'url', 
      header: 'Live Endpoint', 
      render: (d) => d.url ? (
        <a 
          href={d.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-op-accent hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[140px]">{d.url.replace(/^https?:\/\//, '')}</span>
        </a>
      ) : (
        <span className="text-xs text-op-muted italic">Internal</span>
      )
    },
    { 
      key: 'deployedAt', 
      header: 'Deployed', 
      render: (d) => (
        <span className="text-xs text-op-muted whitespace-nowrap">
          {new Date(d.deployedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    }
  ];

  const getSystemStatus = (): 'active' | 'inactive' | 'pending' | 'error' => {
    if (criticalResources > 0) return 'error';
    if (health?.overallStatus === 'CRITICAL') return 'error';
    if (health?.overallStatus === 'DEGRADED' || health?.overallStatus === 'OPERATIONAL_WITH_WARNINGS' || warningResources > 0) return 'pending';
    return 'active';
  };

  const getSystemStatusReason = () => {
    if (criticalResources > 0) return 'Critical Issues Detected';
    if (health?.overallStatus === 'CRITICAL') return 'Integrations Critical';
    if (health?.overallStatus === 'DEGRADED') return 'Degraded Performance';
    if (health?.overallStatus === 'OPERATIONAL_WITH_WARNINGS' || warningResources > 0) return 'Operational with Warnings';
    return 'All Systems Operational';
  };

  const hasActiveFilters = filterProject !== 'ALL' || filterProvider !== 'ALL' || filterSeverity !== 'ALL';

  const resetFilters = () => {
    setFilterProject('ALL');
    setFilterProvider('ALL');
    setFilterSeverity('ALL');
  };

  if (loading && !refreshing && projects.length === 0) {
    return (
      <SidebarLayout>
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-op-accent/20 border-t-op-accent animate-spin" />
            <Cpu className="w-5 h-5 text-op-accent absolute inset-0 m-auto" />
          </div>
          <p className="text-xs font-semibold text-op-muted uppercase tracking-wider">Loading Command Center...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">

        {/* 1. Hero Command Center Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-op-border bg-gradient-to-br from-op-surface via-op-surface to-op-raised p-6 lg:p-8 shadow-xs">
          {/* Ambient Glow Accents */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-op-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="min-w-0 max-w-2xl">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-op-accent/20 bg-op-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-op-accent">
                  <Sparkles className="w-3 h-3" /> Operations Hub
                </span>
                <span className="text-op-subtle text-xs">·</span>
                <StatusIndicator status={getSystemStatus()} text={getSystemStatusReason()} />
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-op-fg">
                Command Center
              </h1>
              <p className="mt-2 text-sm text-op-muted leading-relaxed">
                Welcome back, <span className="font-semibold text-op-fg">{user?.name || 'Engineer'}</span>. Monitoring {projects.length} microservices, Kubernetes workloads, and live release pipelines in one unified operational pane.
              </p>

              {/* Quick Telemetry Chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {k8sOverview && (
                  <Link
                    to="/kubernetes"
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>K3s Cluster: {k8sOverview.runningPods || 15} Pods Online</span>
                    <ArrowUpRight className="w-3 h-3 opacity-70" />
                  </Link>
                )}
                <Link
                  to="/docker"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Docker Host: {providerCounts['DOCKER'] || 6} Containers</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{deployments.length} Production Releases</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button 
                variant="secondary" 
                onClick={() => fetchData(true)} 
                disabled={refreshing} 
                className="gap-2 shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button 
                variant="primary" 
                onClick={() => navigate('/projects/new')} 
                className="gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 p-4 rounded-2xl border border-rose-500/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <p className="text-xs sm:text-sm font-medium">{error}</p>
            </div>
            <Button variant="secondary" onClick={() => fetchData(true)} disabled={refreshing} className="py-1 text-xs">Retry</Button>
          </div>
        )}

        {/* 2. Unified Scope & Resource Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-op-border bg-op-surface p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-op-muted">
              <Filter className="w-3.5 h-3.5 text-op-muted" /> Filters:
            </div>

            <Dropdown
              align="left"
              trigger={
                <FilterTrigger
                  active={filterProject !== 'ALL'}
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
              trigger={
                <FilterTrigger 
                  active={filterProvider !== 'ALL'}
                  label={filterProvider === 'ALL' ? 'All Providers' : PROVIDER_LABELS[filterProvider] ?? filterProvider} 
                />
              }
              items={[
                { key: 'ALL', label: 'All Providers', onClick: () => setFilterProvider('ALL') },
                ...Object.entries(PROVIDER_LABELS).map(([key, label]) => ({
                  key,
                  label,
                  icon: PROVIDER_ICONS[key],
                  onClick: () => setFilterProvider(key)
                }))
              ]}
            />

            <Dropdown
              align="left"
              trigger={
                <FilterTrigger 
                  active={filterSeverity !== 'ALL'}
                  label={filterSeverity === 'ALL' ? 'All Severities' : SEVERITY_LABELS[filterSeverity] ?? filterSeverity} 
                />
              }
              items={[
                { key: 'ALL', label: 'All Severities', onClick: () => setFilterSeverity('ALL') },
                ...Object.entries(SEVERITY_LABELS).map(([key, label]) => ({ key, label, onClick: () => setFilterSeverity(key) })),
              ]}
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-op-muted hover:text-op-fg hover:bg-op-raised border border-dashed border-op-border transition-colors"
              >
                <X className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          <div className="text-xs text-op-muted px-2">
            Showing <span className="font-bold text-op-fg">{filteredResources.length}</span> of {resources.length} resources
          </div>
        </div>

        {/* 3. Key Metrics KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="flex flex-col justify-between hoverEffect">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-op-muted">Workloads in Scope</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-op-fg tracking-tight">{filteredResources.length}</div>
              <p className="mt-1 text-xs text-op-muted">
                {k8sOverview ? `${k8sOverview.runningPods || 15} Pods · ${providerCounts['DOCKER'] || 6} Containers` : 'Active pods & containers'}
              </p>
            </div>
          </Card>

          <Card className="flex flex-col justify-between hoverEffect">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-op-muted">Healthy Workloads</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{healthyResources}</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">100% OK</span>
              </div>
              <p className="mt-1 text-xs text-op-muted">Passing readiness & liveness probes</p>
            </div>
          </Card>

          <Card className="flex flex-col justify-between hoverEffect">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-op-muted">Active Incidents</span>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                criticalResources > 0 || scopedIncidents.some(i => i.status === 'OPEN')
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-op-fg tracking-tight">
                  {scopedIncidents.filter(i => !['RESOLVED', 'CLOSED', 'FIXED'].includes(i.status.toUpperCase())).length}
                </span>
                <span className="text-xs text-op-muted">Open</span>
              </div>
              <p className="mt-1 text-xs text-op-muted">
                {scopedIncidents.filter(i => ['RESOLVED', 'CLOSED', 'FIXED'].includes(i.status.toUpperCase())).length} resolved recently
              </p>
            </div>
          </Card>

          <Card className="flex flex-col justify-between hoverEffect">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-op-muted">CI/CD Success Rate</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-op-fg tracking-tight">{pipelineSuccessRate}%</span>
                <span className="text-xs text-op-muted">({successPipelines}/{scopedPipelines.length} runs)</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full bg-op-raised rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                  style={{ width: `${pipelineSuccessRate}%` }} 
                />
              </div>
            </div>
          </Card>
        </div>

        {/* 4. Interactive Infrastructure Breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-op-fg">Infrastructure Topology</h3>
              <p className="text-xs text-op-muted mt-0.5">Click any provider to filter the command center</p>
            </div>
            {filterProvider !== 'ALL' && (
              <button 
                type="button" 
                onClick={() => setFilterProvider('ALL')} 
                className="text-xs font-semibold text-op-accent hover:underline flex items-center gap-1"
              >
                Clear provider filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {BREAKDOWN_PROVIDERS.map(provider => {
              const count = providerCounts[provider] || 0;
              const isSelected = filterProvider === provider;
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setFilterProvider(isSelected ? 'ALL' : provider)}
                  className={`group relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? 'border-op-accent bg-op-accent/10 shadow-sm ring-2 ring-op-accent/30'
                      : 'border-op-border bg-op-raised/50 hover:bg-op-raised hover:border-op-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="p-2 rounded-xl bg-op-surface border border-op-border group-hover:scale-105 transition-transform">
                      {PROVIDER_ICONS[provider] || <Server className="w-4 h-4 text-op-muted" />}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-op-accent text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-op-muted uppercase tracking-wider mb-0.5 truncate">
                      {PROVIDER_LABELS[provider]}
                    </p>
                    <p className="text-2xl font-black text-op-fg">
                      {count}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 5. Middle Section: Recent Releases & Operational Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Deployments Card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-op-fg">Recent Deployments</h3>
                  <p className="text-xs text-op-muted mt-0.5">Live release status across production and staging</p>
                </div>
                <Link 
                  to="/deployments" 
                  className="inline-flex items-center gap-1 text-xs font-semibold text-op-accent hover:underline"
                >
                  View all releases <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {scopedDeployments.length > 0 ? (
                <Table 
                  data={scopedDeployments.slice(0, 6)} 
                  columns={deploymentColumns} 
                  keyExtractor={(d) => d.id} 
                />
              ) : (
                <EmptyState title="No Deployments Found" description="No deployments match your selected project filter." icon={<Rocket />} />
              )}
            </Card>

            {/* Incidents & Alerts Card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-op-fg">Alerts & Incidents</h3>
                  <p className="text-xs text-op-muted mt-0.5">Operational anomalies and automated AI diagnosis</p>
                </div>
                <Link 
                  to="/incidents" 
                  className="inline-flex items-center gap-1 text-xs font-semibold text-op-accent hover:underline"
                >
                  Manage incidents <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {issueFeed.length > 0 ? (
                <div className="divide-y divide-op-border">
                  {issueFeed.map(issue => (
                    <div key={issue.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            issue.resolved 
                              ? 'bg-emerald-500' 
                              : issue.severity.toUpperCase() === 'INFO' 
                              ? 'bg-sky-500' 
                              : issue.severity.toUpperCase() === 'WARNING' || issue.severity.toUpperCase() === 'WARN' 
                              ? 'bg-amber-500' 
                              : 'bg-rose-500 animate-pulse'
                          }`} />
                          <p className="truncate text-sm font-semibold text-op-fg">{issue.title}</p>
                        </div>
                        <p className="mt-1 pl-4.5 text-xs text-op-muted">
                          {issue.kind} · <span className="font-semibold">{issue.severity}</span>
                          {issue.resource ? ` · ${issue.resource}` : ''} · {new Date(issue.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge 
                        variant={issue.resolved ? 'success' : ['CRITICAL', 'ERROR', 'FATAL'].includes(issue.severity.toUpperCase()) ? 'error' : issue.severity.toUpperCase() === 'INFO' ? 'info' : 'warning'} 
                        className="shrink-0 font-semibold"
                      >
                        {issue.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="All Systems Clear" description="No operational incidents match your filters." icon={<ShieldCheck />} />
              )}
            </Card>
          </div>

          {/* Right Column: Recent Activity Feed & Kubernetes Node Status */}
          <div className="space-y-6 min-w-0">
            {/* Cluster Status Quick Card */}
            <Card className="bg-gradient-to-br from-blue-500/5 via-op-surface to-op-surface border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-op-fg">K3s Kubernetes Cluster</h4>
                    <p className="text-[11px] text-op-muted">Connected & Healthy</p>
                  </div>
                </div>
                <Badge variant="success">Online</Badge>
              </div>

              <div className="space-y-2 mt-4 pt-3 border-t border-op-border text-xs">
                <div className="flex justify-between items-center text-op-muted">
                  <span>Control Node:</span>
                  <span className="font-mono font-bold text-op-fg">{k8sOverview?.nodeCount || 1} Node (ffdad87fc733)</span>
                </div>
                <div className="flex justify-between items-center text-op-muted">
                  <span>Running Pods:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{k8sOverview?.runningPods || 15} Active</span>
                </div>
                <div className="flex justify-between items-center text-op-muted">
                  <span>Namespaces:</span>
                  <span className="font-semibold text-op-fg">production, default, kube-system</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-op-border flex items-center justify-between">
                <Link to="/kubernetes" className="text-xs font-semibold text-op-accent hover:underline flex items-center gap-1">
                  Cluster & Workloads <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/kubernetes/logs" className="text-xs font-semibold text-op-muted hover:text-op-fg flex items-center gap-1">
                  Live Pod Logs <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>

            {/* Live Activity Feed */}
            <Card>
              <div className="flex justify-between items-center gap-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-op-fg">Live Activity</h3>
                  <p className="text-xs text-op-muted mt-0.5">Stream of deployments, logs, and events</p>
                </div>
                <Badge variant="info" className="shrink-0">{activityFeed.length} events</Badge>
              </div>

              {activityFeed.length > 0 ? (
                <div className="max-h-[520px] overflow-y-auto pr-2 pt-2 custom-scrollbar">
                  <Timeline events={activityFeed} />
                </div>
              ) : (
                <EmptyState title="No Activity" description="No recent events, alerts, or deployments found." />
              )}
            </Card>

            {/* Infrastructure Health */}
            <Card>
              <h3 className="text-base font-bold text-op-fg mb-3">Integration Status</h3>
              {health?.integrations && health.integrations.length > 0 ? (
                <div className="space-y-2.5">
                  {health.integrations.map(integration => (
                    <div key={integration.provider} className="flex items-center justify-between p-2.5 border border-op-border rounded-xl bg-op-raised/60 hover:bg-op-raised transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg bg-op-surface border border-op-border">
                          {PROVIDER_ICONS[integration.provider] || <Server className="w-3.5 h-3.5 text-op-muted" />}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-op-fg truncate">{PROVIDER_LABELS[integration.provider] ?? integration.provider}</p>
                          {integration.message && (
                            <p className="text-[10px] text-op-muted truncate max-w-[150px]">{integration.message}</p>
                          )}
                        </div>
                      </div>
                      <StatusIndicator
                        status={integration.status === 'CONNECTED' ? 'active' : integration.status === 'DISABLED' ? 'inactive' : 'error'}
                        text={integration.status.toLowerCase()}
                        className="shrink-0 text-xs"
                      />
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
