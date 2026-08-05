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
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-[#4F46E5]" />
              <h1 className="text-2xl font-bold text-[#0F172A]">Monitoring dashboard</h1>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Prometheus Actuator metrics and real-time system performance analytics
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            className="px-3.5 py-2 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Refresh metrics</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">CPU utilization</div>
              <div className="text-2xl font-bold text-[#0284C7] mt-1">
                {metrics ? `${metrics.cpuUsagePercent}%` : '---'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-[#0284C7]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Memory allocated</div>
              <div className="text-2xl font-bold text-[#7C3AED] mt-1">
                {metrics ? `${metrics.memoryUsedMb} MB` : '---'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-[#7C3AED]">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">API throughput</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {metrics ? `${metrics.activeRequests} req/s` : '---'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Radio className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total deployments</div>
              <div className="text-2xl font-bold text-[#0F172A] mt-1">
                {metrics ? metrics.totalDeployments : '---'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recharts Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: CPU Load Trend */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">CPU load trend (%)</h2>
                <p className="text-xs text-[#64748B]">Real-time CPU percentage scraped via Actuator</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] animate-pulse"></span>
            </div>

            {loading || !metrics ? (
              <div className="h-64 flex items-center justify-center text-[#64748B] text-sm">Loading CPU metrics...</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="cpu" stroke="#0284C7" fill="#0284C7" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Memory & API Requests */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Memory & throughput</h2>
                <p className="text-xs text-[#64748B]">Active heap usage (MB) and incoming HTTP requests</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] animate-pulse"></span>
            </div>

            {loading || !metrics ? (
              <div className="h-64 flex items-center justify-center text-[#64748B] text-sm">Loading throughput metrics...</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="memory" stroke="#7C3AED" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="requests" stroke="#059669" strokeWidth={2} dot={false} />
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
