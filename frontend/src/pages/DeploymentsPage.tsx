import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Deployment, type Project } from '../services/api';
import { DEPLOYMENT_SOURCE_LABEL, deployedBy, deploymentStatusVariant } from '../lib/deployments';
import { Table, type Column } from '../components/Table';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { 
  Rocket, RefreshCw, Search, PlayCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DeploymentsPage: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const { currentProjectId } = useProject();
  const [projectFilter, setProjectFilter] = useState(currentProjectId != null ? String(currentProjectId) : 'ALL');
  const [envFilter, setEnvFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const navigate = useNavigate();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [depsData, projsData] = await Promise.all([
        api.getAllDeployments().catch(() => []),
        api.getProjects().catch(() => [])
      ]);
      setDeployments(depsData);
      setProjects(projsData);
    } catch (err) {
      console.error('Failed to fetch deployment data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDeployments = useMemo(() => {
    return deployments.filter(dep => {
      const matchesSearch = 
        (dep.projectName || '').toLowerCase().includes(search.toLowerCase()) || 
        dep.version.toLowerCase().includes(search.toLowerCase()) ||
        (dep.deployedByName || '').toLowerCase().includes(search.toLowerCase());
      
      const matchesProject = projectFilter === 'ALL' || dep.projectId.toString() === projectFilter;
      const matchesEnv = envFilter === 'ALL' || dep.environment === envFilter;
      const matchesStatus = statusFilter === 'ALL' || dep.status.toUpperCase() === statusFilter.toUpperCase();
      
      return matchesSearch && matchesProject && matchesEnv && matchesStatus;
    });
  }, [deployments, search, projectFilter, envFilter, statusFilter]);

  const environments = [...new Set(deployments.map(d => d.environment))];

  const columns: Column<Deployment>[] = [
    { key: 'id', header: 'ID', render: (d) => <span className="font-mono text-op-fg">#{d.id}</span> },
    { key: 'projectName', header: 'Project', render: (d) => <span className="font-bold">{d.projectName}</span> },
    { key: 'version', header: 'Version', render: (d) => <Badge>{d.version}</Badge> },
    { key: 'environment', header: 'Environment', render: (d) => <span className="capitalize text-sm font-mono">{d.environment}</span> },
    { key: 'status', header: 'Status', render: (d) => <Badge variant={deploymentStatusVariant(d.status)}>{d.status}</Badge> },
    { key: 'source', header: 'Source', render: (d) => <span className="text-xs text-op-muted">{DEPLOYMENT_SOURCE_LABEL[d.source]}</span> },
    { key: 'deployedByName', header: 'Deployed By', render: (d) => <span className="text-op-subtle">{deployedBy(d)}</span> },
    { key: 'deployedAt', header: 'Time', render: (d) => <span className="text-op-muted text-sm">{new Date(d.deployedAt).toLocaleString()}</span> },
  ];

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-op-fg flex items-center gap-3">
              <Rocket className="w-8 h-8 text-op-accent" /> Deployments
            </h1>
            <p className="text-sm font-medium text-op-muted mt-2">
              Track and manage all deployments across environments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => fetchData(true)} isLoading={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Link to="/projects">
              <Button variant="primary">
                <PlayCircle className="w-4 h-4 mr-2" /> Record a deployment
              </Button>
            </Link>
          </div>
        </div>

        <Card className="flex flex-col gap-4 bg-op-raised/50 border-none shadow-none p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-op-muted" />
              <input 
                type="text"
                placeholder="Search version, user..."
                className="w-full pl-9 pr-4 py-2 bg-op-surface border border-op-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-op-accent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              className="bg-op-surface border border-op-border rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-op-accent"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>

            <select 
              className="bg-op-surface border border-op-border rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-op-accent"
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
            >
              <option value="ALL">All Environments</option>
              {environments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>

            <select 
              className="bg-op-surface border border-op-border rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-op-accent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCEEDED">Succeeded</option>
              <option value="FAILED">Failed</option>
              <option value="IN PROGRESS">In progress</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          {loading && !refreshing ? (
            <div className="py-12 text-center text-op-muted animate-pulse">Loading deployments...</div>
          ) : (
            <Table 
              data={filteredDeployments} 
              columns={columns} 
              keyExtractor={(d) => d.id} 
              onRowClick={(d) => navigate(`/deployments/${d.id}`)}
              emptyMessage="No deployments match your filters."
            />
          )}
        </Card>

      </div>
    </SidebarLayout>
  );
};
