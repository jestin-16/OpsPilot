import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type LogEntry } from '../services/api';
import { FileText, Search, RefreshCw, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const LogManagement: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sourceService, setSourceService] = useState('ALL');
  const [logLevel, setLogLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs({
        sourceService: sourceService !== 'ALL' ? sourceService : undefined,
        logLevel: logLevel !== 'ALL' ? logLevel : undefined,
        query: searchQuery.trim() !== '' ? searchQuery.trim() : undefined,
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
  }, [sourceService, logLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-950/60 text-red-400 border border-red-800/60 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" />
            <span>ERROR</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            <span>WARN</span>
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-950/60 text-sky-400 border border-sky-800/60 flex items-center gap-1 w-fit">
            <Info className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#38BDF8]" />
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Log management</h1>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Searchable, structured JSON log aggregation across platform services
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 bg-[#0F1B2E] border border-[#1E2D45] hover:bg-[#1E2D45] text-[#F8FAFC] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Refresh logs</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls Card */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                Source service
              </label>
              <div className="relative">
                <select
                  value={sourceService}
                  onChange={(e) => setSourceService(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer"
                >
                  <option value="ALL">All services</option>
                  <option value="deployment-service">deployment-service</option>
                  <option value="kubernetes-service">kubernetes-service</option>
                  <option value="project-service">project-service</option>
                  <option value="auth-service">auth-service</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                Log level
              </label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer"
              >
                <option value="ALL">All levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                Search message
              </label>
              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter log messages..."
                  className="w-full px-3.5 py-2 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-xs focus:outline-none focus:border-[#38BDF8] placeholder-[#94A3B8]/50"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#060B18] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Logs Table Card */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#F8FAFC]">Log records ({logs.length})</h2>
            <span className="text-xs font-mono text-[#38BDF8]">Storage: PostgreSQL JSON log table</span>
          </div>

          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">Searching log database...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm border border-dashed border-[#1E2D45] rounded-lg">
              No matching log records found. Trigger a deployment or change search filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F8FAFC]">
                <thead className="bg-[#060B18] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#1E2D45]">
                  <tr>
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Source service</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {logs.map((l) => (
                    <tr key={l.logId} className="hover:bg-[#060B18]/50">
                      <td className="py-3.5 px-4 font-mono text-[#38BDF8]">#{l.logId}</td>
                      <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">{l.sourceService}</td>
                      <td className="py-3.5 px-4">{getLevelBadge(l.logLevel)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#F8FAFC] max-w-md truncate">{l.message}</td>
                      <td className="py-3.5 px-4 text-[#94A3B8]">
                        {new Date(l.timestamp).toLocaleString()}
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
