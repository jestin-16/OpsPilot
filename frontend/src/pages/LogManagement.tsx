import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type LogEntry } from '../services/api';
import { FileText, Search, RefreshCw, AlertTriangle, AlertCircle, Info, Terminal } from 'lucide-react';

export const LogManagement: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sourceService, setSourceService] = useState('ALL');
  const [logLevel, setLogLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [providerName, setProviderName] = useState('local');
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs({
        sourceService: sourceService !== 'ALL' ? sourceService : undefined,
        logLevel: logLevel !== 'ALL' ? logLevel : undefined,
        query: searchQuery.trim() !== '' ? searchQuery.trim() : undefined,
        providerName: providerName,
      });
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [sourceService, logLevel, providerName]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleSimulateLogs = async () => {
    setIsSimulating(true);
    try {
      const mockLogs = [
        { sourceService: 'auth-service', logLevel: 'INFO', message: 'User jestin successfully authenticated via JWT' },
        { sourceService: 'core-service', logLevel: 'WARN', message: 'Kubernetes API responded slowly (latency > 500ms)' },
        { sourceService: 'observability-service', logLevel: 'ERROR', message: 'Failed to scrape prometheus metrics from backend-pod-89df' },
        { sourceService: 'api-gateway', logLevel: 'INFO', message: 'Routed request to /api/v1/cicd/webhooks/github successfully' },
        { sourceService: 'deployment-service', logLevel: 'INFO', message: 'Deployment rollout strategy initialized for project opspilot' }
      ];
      
      for (const log of mockLogs) {
        await api.createLog(log);
        // tiny delay to ensure chronological sorting
        await new Promise(r => setTimeout(r, 200));
      }
      await fetchLogs();
    } catch (err: any) {
      alert('Failed to simulate logs');
    } finally {
      setIsSimulating(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1.5 w-fit shadow-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ERROR</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1.5 w-fit shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>WARN</span>
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-200 flex items-center gap-1.5 w-fit shadow-sm">
            <Info className="w-3.5 h-3.5" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Log Management</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Searchable, structured JSON log aggregation across all platform services
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateLogs}
              disabled={isSimulating}
              className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
            >
              <Terminal className="w-4 h-4 fill-current" />
              <span>{isSimulating ? 'Generating...' : 'Simulate Live Logs'}</span>
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-indigo-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls Card */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform duration-300">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Data Source
              </label>
              <select
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 font-bold text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-inner"
              >
                <option value="local">OpsPilot Local (PostgreSQL)</option>
                <option value="loki">Grafana Loki</option>
                <option value="aws">AWS CloudWatch</option>
                <option value="elasticsearch">Elasticsearch (ELK)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Source Service
              </label>
              <select
                value={sourceService}
                onChange={(e) => setSourceService(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-inner"
              >
                <option value="ALL">All services</option>
                <option value="api-gateway">api-gateway</option>
                <option value="auth-service">auth-service</option>
                <option value="core-service">core-service</option>
                <option value="deployment-service">deployment-service</option>
                <option value="observability-service">observability-service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Log Level
              </label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-inner"
              >
                <option value="ALL">All levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Search Message
              </label>
              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by keyword..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400 shadow-inner"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md hover:shadow-indigo-500/30"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Logs Table Card */}
        <div className="glass-panel rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Log Stream <span className="text-slate-400 font-normal">({logs.length})</span></h2>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">Live Loki Tailer</span>
          </div>

          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-sm animate-pulse">Searching log database...</div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <FileText className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              No matching log records found.<br/>Click <strong>"Simulate Live Logs"</strong> above to generate test data.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-5 w-24">Log ID</th>
                    <th className="py-4 px-5">Source Service</th>
                    <th className="py-4 px-5">Level</th>
                    <th className="py-4 px-5">Message</th>
                    <th className="py-4 px-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono text-[13px]">
                  {logs.map((l) => (
                    <tr key={l.logId} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-5 text-indigo-400 font-semibold group-hover:text-indigo-600">#{l.logId}</td>
                      <td className="py-4 px-5 text-slate-600 font-semibold">{l.sourceService}</td>
                      <td className="py-4 px-5">{getLevelBadge(l.logLevel)}</td>
                      <td className="py-4 px-5 text-slate-700">{l.message}</td>
                      <td className="py-4 px-5 text-slate-400 text-right">
                        {new Date(l.timestamp).toLocaleString(undefined, {
                          hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
