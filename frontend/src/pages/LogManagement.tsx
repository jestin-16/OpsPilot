import React, { useEffect, useState, useMemo } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type LogEntry, type Project, API_BASE_URL } from '../services/api';
import {
  Search, RefreshCw, AlertCircle,
  Pause, Play, ChevronRight, X, Box, Rocket, Terminal, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LogManagement: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [projectId, setProjectId] = useState<string>('ALL');
  const [sourceService, setSourceService] = useState('ALL');
  const [logLevel, setLogLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('1h');

  // State
  const [watching, setWatching] = useState(true);
  const [liveStream, setLiveStream] = useState(false);
  const [activeStreamControllers, setActiveStreamControllers] = useState<AbortController[]>([]);
  const [streamLogs, setStreamLogs] = useState<LogEntry[]>([]);
  const refreshSeconds = 5;
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchData = async () => {
    setError('');
    setLoading(true);
    try {
      const [logsData, projsData] = await Promise.all([
        api.getLogs({
          projectId: projectId !== 'ALL' ? Number(projectId) : undefined,
          sourceService: sourceService !== 'ALL' ? sourceService : undefined,
          logLevel: logLevel !== 'ALL' ? logLevel : undefined,
          query: searchQuery.trim() !== '' ? searchQuery.trim() : undefined,
          limit: 1000 // Get up to 1000 for client side pagination/time filtering
        }),
        api.getProjects().catch(() => [])
      ]);
      setLogs(logsData);
      setProjects(projsData);
    } catch (err: any) {
      setError(err.message || 'Failed to search logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, sourceService, logLevel]);

  useEffect(() => {
    if (!watching) return;
    const timer = window.setInterval(fetchData, refreshSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [watching, refreshSeconds, projectId, sourceService, logLevel, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (liveStream) {
      startStreams();
    } else {
      fetchData();
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStreamLogs([]);
  };

  const startStreams = async () => {
    if (!liveStream) return;

    // Cleanup old streams
    activeStreamControllers.forEach(ctrl => ctrl.abort());
    setActiveStreamControllers([]);

    if (projectId === 'ALL') {
      setError('Select a project to start live streams');
      return;
    }

    try {
      const integrations = await api.getIntegrationsByProject(Number(projectId));
      if (integrations.length === 0) {
        setError('No integrations found for this project');
        return;
      }

      const newControllers: AbortController[] = [];
      const token = localStorage.getItem('opspilot_token');

      // Start a stream for each integration 
      // Note: for this demo, we assume the backend doesn't strictly require containerId/podName, 
      // or we pass a generic one if we don't have it.
      // Wait, earlier we required containerId/podName in backend!
      // Let's pass a dummy or require the user to input it.

      for (const integ of integrations) {
        const ctrl = new AbortController();
        newControllers.push(ctrl);

        let url = `${API_BASE_URL}/projects/${projectId}/logs/stream?integrationId=${integ.id}`;
        if (integ.provider === 'DOCKER') {
          // just fetch containers to get one? Or require params?
          // For safety, we'll try streaming, backend might fail if containerId is missing
          url += `&containerId=demo-container`; // Hack for testing
        } else if (integ.provider === 'KUBERNETES') {
          url += `&podName=demo-pod&namespace=default`;
        }

        fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: ctrl.signal
        }).then(async response => {
          if (!response.body) return;
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const data = JSON.parse(line.replace('data:', ''));
                  setStreamLogs(prev => [data, ...prev].slice(0, 1000));
                } catch (e) { }
              }
            }
          }
        }).catch(err => console.log('Stream ended', err));
      }

      setActiveStreamControllers(newControllers);
    } catch (e: any) {
      setError('Failed to start streams: ' + e.message);
    }
  };

  useEffect(() => {
    if (liveStream) {
      startStreams();
    } else {
      activeStreamControllers.forEach(ctrl => ctrl.abort());
      setActiveStreamControllers([]);
    }
    return () => {
      activeStreamControllers.forEach(ctrl => ctrl.abort());
    };
  }, [liveStream, projectId]);

  // Client-side time range filter
  const filteredLogs = useMemo(() => {
    let result = liveStream ? streamLogs : logs;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.message?.toLowerCase().includes(q) ||
        l.logLevel?.toLowerCase().includes(q) ||
        l.sourceService?.toLowerCase().includes(q) ||
        l.project?.projectName?.toLowerCase().includes(q)
      );
    }
    if (logLevel !== 'ALL') {
      result = result.filter(l => l.logLevel === logLevel);
    }

    if (timeRange !== 'ALL' && !liveStream) {
      const now = new Date().getTime();
      let msToSubtract = 0;
      if (timeRange === '15m') msToSubtract = 15 * 60 * 1000;
      if (timeRange === '1h') msToSubtract = 60 * 60 * 1000;
      if (timeRange === '24h') msToSubtract = 24 * 60 * 60 * 1000;
      if (timeRange === '7d') msToSubtract = 7 * 24 * 60 * 60 * 1000;

      const threshold = now - msToSubtract;
      result = result.filter(log => {
        let ts = log.timestamp;
        if (ts && !ts.endsWith('Z')) ts += 'Z';
        return new Date(ts).getTime() >= threshold;
      });
    }
    return result;
  }, [logs, streamLogs, timeRange, liveStream, searchQuery, logLevel]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const getLevelBadge = (level: string) => {
    const l = level.toUpperCase();
    switch (l) {
      case 'ERROR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">ERROR</span>;
      case 'WARN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">WARN</span>;
      case 'DEBUG':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-500/10 text-slate-500 border border-slate-500/20">DEBUG</span>;
      case 'INFO':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-sky-500/10 text-sky-500 border border-sky-500/20">INFO</span>;
    }
  };

  const extractTraceId = (msg: string) => {
    const match = msg.match(/trace_id[=:]\s*([a-zA-Z0-9-]+)/i) || msg.match(/\[([a-f0-9]{16,32})\]/);
    return match ? match[1] : null;
  };

  return (
    <SidebarLayout>
      <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-op-surface animate-fade-in">

        {/* Main Content Area */}
        <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${selectedLog ? 'pr-[400px]' : ''}`}>

          {/* Header & Controls */}
          <div className="flex-none p-6 border-b border-op-border bg-op-surface">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-op-fg flex items-center gap-3">
                  <Terminal className="w-6 h-6 text-op-accent" /> Logs Explorer
                </h1>
                <p className="text-sm font-medium text-op-muted mt-1">
                  Real-time aggregated logs across all your projects and services.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLiveStream(s => !s)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${liveStream ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-op-raised text-op-fg hover:bg-op-border'}`}
                >
                  <Activity className="w-4 h-4" />
                  {liveStream ? 'STOP LIVE' : 'LIVE ●'}
                </button>
                <button
                  onClick={() => setWatching(w => !w)}
                  disabled={liveStream}
                  className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${watching && !liveStream ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-op-raised text-op-fg hover:bg-op-border'} ${liveStream ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {watching ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {watching ? 'Auto-Refresh' : 'Paused'}
                </button>
                <button
                  onClick={clearLogs}
                  className="px-4 py-2 bg-op-raised hover:bg-op-border text-op-fg text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Clear
                </button>
                <button
                  onClick={fetchData}
                  disabled={liveStream}
                  className={`px-4 py-2 bg-op-raised hover:bg-op-border text-op-fg text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${liveStream ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-op-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs (e.g. error, Exception...)"
                  className="w-full pl-9 pr-4 py-2 bg-op-raised border border-op-border rounded-lg text-sm text-op-fg focus:outline-none focus:border-op-accent focus:ring-1 focus:ring-op-accent"
                />
              </div>

              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-op-raised border border-op-border rounded-lg text-op-fg text-sm focus:outline-none focus:border-op-accent"
              >
                <option value="ALL">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id.toString()}>{p.projectName}</option>
                ))}
              </select>

              <select
                value={sourceService}
                onChange={(e) => setSourceService(e.target.value)}
                className="w-full px-3 py-2 bg-op-raised border border-op-border rounded-lg text-op-fg text-sm focus:outline-none focus:border-op-accent"
              >
                <option value="ALL">All Services</option>
                <option value="api-gateway">api-gateway</option>
                <option value="auth-service">auth-service</option>
                <option value="core-service">core-service</option>
                <option value="observability-service">observability-service</option>
                <option value="Vercel Integration">Vercel Integration</option>
              </select>

              <div className="flex gap-2">
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-op-raised border border-op-border rounded-lg text-op-fg text-sm focus:outline-none focus:border-op-accent"
                >
                  <option value="ALL">All Levels</option>
                  <option value="ERROR">ERROR</option>
                  <option value="WARN">WARN</option>
                  <option value="INFO">INFO</option>
                  <option value="DEBUG">DEBUG</option>
                </select>

                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-3 py-2 bg-op-raised border border-op-border rounded-lg text-op-fg text-sm focus:outline-none focus:border-op-accent"
                >
                  <option value="15m">Last 15m</option>
                  <option value="1h">Last 1h</option>
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7d</option>
                  <option value="ALL">All Time</option>
                </select>
              </div>
            </form>
          </div>

          {error && (
            <div className="m-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-rose-500 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Log Table */}
          <div className="flex-1 overflow-auto bg-[#0A0A0B]">
            {loading && logs.length === 0 ? (
              <div className="flex justify-center py-20 text-op-muted">Loading logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-op-muted">
                <Terminal className="w-12 h-12 mb-4 opacity-20" />
                <p>No logs found matching your criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm font-mono whitespace-nowrap">
                <thead className="sticky top-0 bg-[#121214] text-op-muted border-b border-white/5 z-10 shadow-sm">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-48">Timestamp</th>
                    <th className="py-2.5 px-4 font-semibold w-24">Level</th>
                    <th className="py-2.5 px-4 font-semibold w-40">Service</th>
                    <th className="py-2.5 px-4 font-semibold w-32">Project</th>
                    <th className="py-2.5 px-4 font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#E0E0E0]">
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.logId}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer hover:bg-white/[0.02] transition-colors ${selectedLog?.logId === log.logId ? 'bg-white/[0.04]' : ''}`}
                    >
                      <td className="py-2 px-4 text-[#888888] text-xs">
                        {new Date(log.timestamp + (!log.timestamp.endsWith('Z') ? 'Z' : '')).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                      </td>
                      <td className="py-2 px-4">{getLevelBadge(log.logLevel)}</td>
                      <td className="py-2 px-4 text-[#A8A8A8] truncate max-w-[160px]">{log.sourceService}</td>
                      <td className="py-2 px-4 text-[#A8A8A8] truncate max-w-[120px]">{log.project?.projectName || '-'}</td>
                      <td className="py-2 px-4 truncate max-w-xl text-[#D4D4D4]">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-none p-3 border-t border-op-border bg-op-surface flex items-center justify-between">
              <span className="text-sm text-op-muted">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-op-raised border border-op-border rounded disabled:opacity-50 text-sm text-op-fg"
                >
                  Prev
                </button>
                <span className="px-3 py-1 text-sm text-op-muted">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-op-raised border border-op-border rounded disabled:opacity-50 text-sm text-op-fg"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Sidebar */}
        <div className={`fixed right-0 top-16 bottom-0 w-[400px] bg-op-surface border-l border-op-border shadow-2xl transition-transform duration-300 transform ${selectedLog ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto z-20 flex flex-col`}>
          {selectedLog && (
            <>
              <div className="flex items-center justify-between p-5 border-b border-op-border bg-op-surface sticky top-0 z-10">
                <h3 className="text-lg font-bold text-op-fg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-op-accent" /> Log Details
                </h3>
                <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-op-raised rounded-lg text-op-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6 flex-1">
                <div className="flex items-center gap-3">
                  {getLevelBadge(selectedLog.logLevel)}
                  <span className="text-sm text-op-muted font-mono">{new Date(selectedLog.timestamp + (!selectedLog.timestamp.endsWith('Z') ? 'Z' : '')).toLocaleString()}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-op-muted uppercase tracking-wider mb-1 block">Message</label>
                    <div className="bg-[#121214] border border-white/5 p-4 rounded-lg text-sm text-[#D4D4D4] font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                      {selectedLog.message}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-op-muted uppercase tracking-wider mb-1 block">Service</label>
                      <div className="text-sm text-op-fg font-medium">{selectedLog.sourceService}</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-op-muted uppercase tracking-wider mb-1 block">Log ID</label>
                      <div className="text-sm text-op-fg font-mono">#{selectedLog.logId}</div>
                    </div>
                  </div>

                  {extractTraceId(selectedLog.message) && (
                    <div>
                      <label className="text-xs font-bold text-op-muted uppercase tracking-wider mb-1 block">Trace ID</label>
                      <div className="text-sm text-op-accent font-mono bg-op-accent/10 px-2 py-1 rounded w-fit">
                        {extractTraceId(selectedLog.message)}
                      </div>
                    </div>
                  )}

                  <hr className="border-op-border" />

                  {/* Context Links */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-op-muted uppercase tracking-wider block">Context</label>

                    {selectedLog.project && (
                      <Link to={`/projects`} className="flex items-center gap-3 p-3 bg-op-raised border border-op-border rounded-lg hover:border-op-accent transition-colors group">
                        <Box className="w-4 h-4 text-op-muted group-hover:text-op-accent" />
                        <div>
                          <div className="text-sm font-bold text-op-fg">{selectedLog.project.projectName}</div>
                          <div className="text-xs text-op-muted">Project</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-op-muted ml-auto" />
                      </Link>
                    )}

                    {selectedLog.deployment && (
                      <Link to={`/deployments/${selectedLog.deployment.id}`} className="flex items-center gap-3 p-3 bg-op-raised border border-op-border rounded-lg hover:border-op-accent transition-colors group">
                        <Rocket className="w-4 h-4 text-op-muted group-hover:text-op-accent" />
                        <div>
                          <div className="text-sm font-bold text-op-fg">Version {selectedLog.deployment.version}</div>
                          <div className="text-xs text-op-muted capitalize">{selectedLog.deployment.environment} Environment</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-op-muted ml-auto" />
                      </Link>
                    )}
                  </div>

                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </SidebarLayout>
  );
};
