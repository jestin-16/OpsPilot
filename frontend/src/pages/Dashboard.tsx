import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { 
  api, type Project, type Deployment, 
  type PipelineRun, type LogEntry, type IntegrationHealthResponse 
} from '../services/api';
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
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [health, setHealth] = useState<IntegrationHealthResponse | null>(null);
  
  const [resources, setResources] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);

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
        alertsData, incidentsData, integrationsData
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
        api.getAdminIntegrations().catch(() => []) // To map integrationId to provider
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
      setIntegrations(integrationsData);
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

  // Derived metrics for resources
  const getProviderName = useCallback((integrationId: number) => {
    const integ = integrations.find(i => i.id === integrationId);
    return integ ? integ.provider : 'Unknown';
  }, [integrations]);

  const enrichedResources = useMemo(() => {
    return resources.map(r => ({ ...r, provider: getProviderName(r.integrationId) }));
  }, [resources, getProviderName]);

  const filteredResources = useMemo(() => {
    return enrichedResources.filter(r => {
      if (filterProject !== 'ALL' && r.projectId?.toString() !== filterProject) return false;
      if (filterProvider !== 'ALL' && r.provider !== filterProvider) return false;
      return true;
    });
  }, [enrichedResources, filterProject, filterProvider]);

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
    const allActivities: TimelineEvent[] = [];
    
    // Add deployments
    deployments.forEach(d => {
      allActivities.push({
        id: `dep-${d.id}`,
        title: `Deployment ${d.status}: ${d.projectName}`,
        description: `Version ${d.version} to ${d.environment}`,
        timestamp: new Date(d.deployedAt).toLocaleString(),
        icon: <Rocket className="w-4 h-4" />,
        status: d.status.toLowerCase() === 'success' ? 'success' : d.status.toLowerCase() === 'failed' ? 'error' : 'warning'
      });
    });

    // Add events
    events.forEach(e => {
      allActivities.push({
        id: `evt-${e.id}`,
        title: `Event: ${e.eventType}`,
        description: e.message || `Provider: ${e.provider}`,
        timestamp: new Date(e.timestamp).toLocaleString(),
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
        icon: <Terminal className="w-4 h-4" />,
        status: 'error'
      });
    });

    // Sort by timestamp desc and filter
    const sorted = allActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
      <Badge variant={d.status.toLowerCase() === 'running' || d.status.toLowerCase() === 'success' ? 'success' : d.status.toLowerCase() === 'failed' ? 'error' : 'warning'}>
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
    if (!health) return 'Inactive';
    if (health.overallStatus === 'CRITICAL' || criticalResources > 0) return 'System Critical';
    if (health.overallStatus === 'DEGRADED') return 'System Degraded';
    if (health.overallStatus === 'OPERATIONAL_WITH_WARNINGS' || warningResources > 0) return 'System Operational with Warnings';
    return 'System Operational';
  };

  if (loading && !refreshing && projects.length === 0) {
    return (
      <SidebarLayout>
        <div className="flex h-full min-h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              OpsPilot Command Center
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
              Welcome, {user?.name}. Here is your operational overview across all connected providers.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusIndicator status={getSystemStatus()} text={`System: ${getSystemStatusReason()}`} />
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
          <div className="bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl border border-rose-200 dark:border-rose-900/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Global Filters */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-bold mr-2 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-500 dark:text-indigo-400"/> Filters
          </div>
          
          <Dropdown
            align="left"
            trigger={
              <div className="group flex items-center justify-between min-w-[190px] px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-sm font-bold text-indigo-900 dark:text-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
                <span className="truncate">{filterProject === 'ALL' ? 'All Projects' : projects.find(p => p.id.toString() === filterProject)?.projectName || 'Select Project'}</span>
                <ChevronDown className="w-4 h-4 text-indigo-400 dark:text-indigo-300 transition-transform duration-300 group-hover:translate-y-0.5 ml-3 flex-shrink-0" />
              </div>
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
              <div className="group flex items-center justify-between min-w-[180px] px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-sm font-bold text-indigo-900 dark:text-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
                <span className="truncate">{
                  filterProvider === 'ALL' ? 'All Providers' : 
                  filterProvider === 'DOCKER' ? 'Docker' :
                  filterProvider === 'KUBERNETES' ? 'Kubernetes' :
                  filterProvider === 'AWS' ? 'AWS' :
                  filterProvider === 'VERCEL' ? 'Vercel' :
                  filterProvider === 'ORACLE_CLOUD' ? 'Oracle Cloud' :
                  filterProvider === 'GITHUB' ? 'GitHub' : filterProvider
                }</span>
                <ChevronDown className="w-4 h-4 text-indigo-400 dark:text-indigo-300 transition-transform duration-300 group-hover:translate-y-0.5 ml-3 flex-shrink-0" />
              </div>
            }
            items={[
              { key: 'ALL', label: 'All Providers', onClick: () => setFilterProvider('ALL') },
              { key: 'DOCKER', label: 'Docker', onClick: () => setFilterProvider('DOCKER') },
              { key: 'KUBERNETES', label: 'Kubernetes', onClick: () => setFilterProvider('KUBERNETES') },
              { key: 'AWS', label: 'AWS', onClick: () => setFilterProvider('AWS') },
              { key: 'VERCEL', label: 'Vercel', onClick: () => setFilterProvider('VERCEL') },
              { key: 'ORACLE_CLOUD', label: 'Oracle Cloud', onClick: () => setFilterProvider('ORACLE_CLOUD') },
              { key: 'GITHUB', label: 'GitHub', onClick: () => setFilterProvider('GITHUB') }
            ]}
          />

          <Dropdown
            align="left"
            trigger={
              <div className="group flex items-center justify-between min-w-[180px] px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-sm font-bold text-indigo-900 dark:text-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
                <span className="truncate">{
                  filterSeverity === 'ALL' ? 'All Severities' : 
                  filterSeverity === 'CRITICAL' ? 'Critical / Error' :
                  filterSeverity === 'WARNING' ? 'Warning' :
                  filterSeverity === 'INFO' ? 'Info / Success' : filterSeverity
                }</span>
                <ChevronDown className="w-4 h-4 text-indigo-400 dark:text-indigo-300 transition-transform duration-300 group-hover:translate-y-0.5 ml-3 flex-shrink-0" />
              </div>
            }
            items={[
              { key: 'ALL', label: 'All Severities', onClick: () => setFilterSeverity('ALL') },
              { key: 'CRITICAL', label: 'Critical / Error', onClick: () => setFilterSeverity('CRITICAL') },
              { key: 'WARNING', label: 'Warning', onClick: () => setFilterSeverity('WARNING') },
              { key: 'INFO', label: 'Info / Success', onClick: () => setFilterSeverity('INFO') }
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
            icon={<Activity className="w-6 h-6 text-green-500" />} 
          />
          <StatsCard 
            title="Warning Resources" 
            value={warningResources} 
            icon={<AlertCircle className="w-6 h-6 text-yellow-500" />} 
          />
          <StatsCard 
            title="Critical Resources" 
            value={criticalResources} 
            icon={<AlertCircle className="w-6 h-6 text-red-500" />} 
          />
        </div>

        {/* Provider Breakdown & Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
             <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Provider Breakdown</h3>
              <div className="flex flex-wrap gap-4">
                {['DOCKER', 'KUBERNETES', 'AWS', 'VERCEL', 'ORACLE_CLOUD'].map(provider => (
                  <div key={provider} className="flex-1 min-w-[120px] p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">{provider.replace('_', ' ')}</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{providerCounts[provider] || 0}</p>
                  </div>
                ))}
              </div>
             </Card>
          </div>
          <div className="lg:col-span-2">
             <StatsCard 
              title="Pipeline Success Rate" 
              value={`${pipelineSuccessRate}%`} 
              icon={<Activity className="w-6 h-6" />}
              className="h-full"
            />
          </div>
        </div>

        {/* Middle Section: Tables and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Deployments</h3>
              {deployments.length > 0 ? (
                <Table data={deployments.slice(0, 5)} columns={deploymentColumns} keyExtractor={(d) => d.id} />
              ) : (
                <EmptyState title="No Deployments" description="There are currently no deployments across any project." icon={<Rocket />} />
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Normalized Alerts & Incidents</h3>
              {incidents.length > 0 || alerts.length > 0 ? (
                <div className="space-y-4">
                  {incidents.slice(0, 5).map(i => (
                    <div key={`inc-${i.id}`} className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                      <div>
                        <span className="font-bold text-red-700 dark:text-red-400">Incident: {i.title}</span>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">Severity: {i.severity} | Status: {i.status}</p>
                      </div>
                      <Badge variant="error">Active</Badge>
                    </div>
                  ))}
                  {alerts.slice(0, 5).map(a => (
                     <div key={`alert-${a.id}`} className="flex justify-between items-center p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                     <div>
                       <span className="font-bold text-yellow-700 dark:text-yellow-400">Alert: {a.ruleName || a.eventType}</span>
                       <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Severity: {a.severity} | Provider: {a.provider}</p>
                     </div>
                     <Badge variant="warning">{a.status}</Badge>
                   </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="System Healthy" description="No active incidents or alerts detected." icon={<Activity />} />
              )}
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Live Activity Feed</h3>
                 <Badge variant="info">{activityFeed.length} events</Badge>
              </div>
              {activityFeed.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto pr-2">
                  <Timeline events={activityFeed} />
                </div>
              ) : (
                <EmptyState title="No Activity" description="No recent events, alerts, or deployments found." />
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Infrastructure Health</h3>
              <div className="space-y-4">
                {health?.integrations && health.integrations.length > 0 ? (
                  health.integrations.map(integration => (
                    <div key={integration.provider} className="flex flex-col p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{integration.provider}</span>
                        <StatusIndicator 
                          status={integration.status === 'CONNECTED' ? 'active' : integration.status === 'DISABLED' ? 'inactive' : 'error'} 
                          text={integration.status} 
                        />
                      </div>
                      {integration.message && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{integration.message}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyState title="No Integrations" description="Health metrics are unavailable." />
                )}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
};
