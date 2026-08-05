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
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" />
            <span>ERROR</span>
          </span>
        );
      case 'WARN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            <span>WARN</span>
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1 w-fit">
            <Info className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#4F46E5]" />
              <h1 className="text-2xl font-bold text-[#0F172A]">Log management</h1>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Searchable, structured JSON log aggregation across platform services
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Refresh logs</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                Source service
              </label>
              <select
                value={sourceService}
                onChange={(e) => setSourceService(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#4F46E5] cursor-pointer"
              >
                <option value="ALL">All services</option>
                <option value="deployment-service">deployment-service</option>
                <option value="kubernetes-service">kubernetes-service</option>
                <option value="project-service">project-service</option>
                <option value="auth-service">auth-service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                Log level
              </label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#4F46E5] cursor-pointer"
              >
                <option value="ALL">All levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                Search message
              </label>
              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter log messages..."
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#4F46E5] placeholder-[#94A3B8]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Logs Table Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0F172A]">Log records ({logs.length})</h2>
            <span className="text-xs font-mono text-[#4F46E5]">Storage: PostgreSQL JSON log table</span>
          </div>

          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-sm">Searching log database...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-sm border border-dashed border-[#E2E8F0] rounded-lg">
              No matching log records found. Trigger a deployment or change search filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#0F172A]">
                <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Source service</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {logs.map((l) => (
                    <tr key={l.logId} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 font-mono text-[#4F46E5]">#{l.logId}</td>
                      <td className="py-3.5 px-4 font-mono text-[#0F172A]">{l.sourceService}</td>
                      <td className="py-3.5 px-4">{getLevelBadge(l.logLevel)}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#0F172A] max-w-md truncate">{l.message}</td>
                      <td className="py-3.5 px-4 text-[#64748B]">
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
