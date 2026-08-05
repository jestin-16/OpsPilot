import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type MetricsData } from '../services/api';
import { Activity, Cpu, HardDrive, Radio, RefreshCw, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch monitoring metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-[#38BDF8]" />
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Monitoring dashboard</h1>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Prometheus Actuator metrics and real-time system performance analytics
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            className="px-3.5 py-2 bg-[#0F1B2E] border border-[#1E2D45] hover:bg-[#1E2D45] text-[#F8FAFC] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Refresh metrics</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">CPU utilization</div>
              <div className="text-2xl font-bold text-[#38BDF8] mt-1">
                {metrics ? `${metrics.cpuUsagePercent}%` : '---'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1E2D45] flex items-center justify-center text-[#38BDF8]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Memory allocated</div>
              <div className="text-2xl font-bold text-[#A78BFA] mt-1">
                {metrics ? `${metrics.memoryUsedMb} MB` : '---'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1E2D45] flex items-center justify-center text-[#A78BFA]">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">API throughput</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {metrics ? `${metrics.activeRequests} req/s` : '---'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1E2D45] flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Total deployments</div>
              <div className="text-2xl font-bold text-[#F8FAFC] mt-1">
                {metrics ? metrics.totalDeployments : '---'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1E2D45] flex items-center justify-center text-[#38BDF8]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recharts Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: CPU Load Trend */}
          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">CPU load trend (%)</h2>
                <p className="text-xs text-[#94A3B8]">Real-time CPU percentage scraped via Actuator</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
            </div>

            {loading || !metrics ? (
              <div className="h-64 flex items-center justify-center text-[#94A3B8] text-sm">Loading CPU metrics...</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#060B18', borderColor: '#1E2D45', color: '#F8FAFC', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="cpu" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Memory & API Requests */}
          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Memory & throughput</h2>
                <p className="text-xs text-[#94A3B8]">Active heap usage (MB) and incoming HTTP requests</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA] animate-pulse"></span>
            </div>

            {loading || !metrics ? (
              <div className="h-64 flex items-center justify-center text-[#94A3B8] text-sm">Loading throughput metrics...</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                    <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#060B18', borderColor: '#1E2D45', color: '#F8FAFC', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="memory" stroke="#A78BFA" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="requests" stroke="#34D399" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
