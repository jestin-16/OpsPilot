import React, { useEffect, useState, useMemo } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type PipelineRun } from '../services/api';
import { Table, type Column } from '../components/Table';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { RefreshCw, PlayCircle, GitCommit, GitBranch, GitPullRequest, Clock, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Pipelines: React.FC = () => {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const navigate = useNavigate();

  const fetchRuns = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.getPipelineRuns();
      setRuns(data);
    } catch (err) {
      console.error('Failed to fetch pipeline runs', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const matchesSearch = 
        run.commitMessage.toLowerCase().includes(search.toLowerCase()) || 
        run.commitSha.toLowerCase().includes(search.toLowerCase()) ||
        run.author.toLowerCase().includes(search.toLowerCase()) ||
        (run.project?.projectName || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || run.status.toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [runs, search, statusFilter]);

  const columns: Column<PipelineRun>[] = [
    { key: 'runId', header: 'Run ID', render: (r) => <span className="font-mono font-medium text-op-fg">#{r.runId}</span> },
    { key: 'project', header: 'Repository', render: (r) => (
      <div className="flex items-center gap-2">
        <GitPullRequest className="w-4 h-4 text-op-muted" />
        <span className="font-medium text-op-fg">{r.project?.projectName || r.repoUrl?.split('/').pop() || 'Unknown'}</span>
      </div>
    )},
    { key: 'branch', header: 'Branch', render: (r) => (
      <div className="flex items-center gap-1.5 text-op-muted bg-op-raised px-2 py-1 rounded-md text-xs font-mono max-w-fit">
        <GitBranch className="w-3.5 h-3.5" /> {r.branch}
      </div>
    )},
    { key: 'commit', header: 'Commit', render: (r) => (
      <div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-op-accent hover:underline cursor-pointer mb-1">
          <GitCommit className="w-3.5 h-3.5" /> {r.commitSha.substring(0, 7)}
        </div>
        <div className="text-xs text-op-subtle truncate max-w-[200px]" title={r.commitMessage}>{r.commitMessage}</div>
      </div>
    )},
    { key: 'status', header: 'Status', render: (r) => {
      const s = r.status.toLowerCase();
      const v = s === 'success' || s === 'completed' ? 'success' : s === 'failed' ? 'error' : 'warning';
      return <Badge variant={v}>{r.status}</Badge>;
    }},
    { key: 'duration', header: 'Duration', render: (r) => (
      <div className="flex items-center gap-1.5 text-op-muted text-sm">
        <Clock className="w-3.5 h-3.5" />
        {r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : '-'}
      </div>
    )},
    { key: 'createdAt', header: 'Triggered', render: (r) => (
      <div className="text-sm text-op-muted">
        {new Date(r.createdAt).toLocaleString()}
      </div>
    )}
  ];

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-op-fg flex items-center gap-3">
              <PlayCircle className="w-8 h-8 text-op-accent" /> CI/CD Pipelines
            </h1>
            <p className="text-sm font-medium text-op-muted mt-2">
              Monitor and manage active deployment and test workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => fetchRuns(true)} isLoading={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="primary" onClick={() => api.simulateGitHubWebhook('push').then(() => fetchRuns(true))}>
              Simulate Webhook
            </Button>
          </div>
        </div>

        <Card className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-op-raised/50 border-none shadow-none p-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-op-muted" />
            <input 
              type="text"
              placeholder="Search by commit, author, or project..."
              className="w-full pl-9 pr-4 py-2 bg-op-surface border border-op-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-op-accent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-op-muted" />
            <select 
              className="bg-op-surface border border-op-border rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-op-accent cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          {loading && !refreshing ? (
            <div className="py-12 text-center text-op-muted animate-pulse">Loading pipeline runs...</div>
          ) : (
            <Table 
              data={filteredRuns} 
              columns={columns} 
              keyExtractor={(r) => r.runId} 
              onRowClick={(r) => navigate(`/pipelines/${r.runId}`)}
              emptyMessage="No pipeline runs match the current filters."
            />
          )}
        </Card>

      </div>
    </SidebarLayout>
  );
};
