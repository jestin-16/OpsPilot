import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api } from '../services/api';
import type { MetricsData } from '../services/api';
import { Activity, Server } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const WhiteboxMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [providerName, setProviderName] = useState('local');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.getMetrics(providerName);
        setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };
    
    fetchMetrics();
    const t = setInterval(fetchMetrics, 5000);
    return () => clearInterval(t);
  }, [providerName]);

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1200px] mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-6 h-6 text-indigo-500" />
              Whitebox Monitoring (Internal)
            </h1>
            <p className="text-sm text-slate-500 mt-1">Application internal metrics and JVM telemetry</p>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mr-2">Provider</label>
            <select
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="local">Simulated (Local)</option>
              <option value="prometheus">Prometheus</option>
              <option value="aws">AWS CloudWatch</option>
            </select>
          </div>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase mb-2">CPU Usage</div>
              <div className="text-3xl font-black text-indigo-600">{metrics.cpuUsagePercent}%</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase mb-2">Memory Used</div>
              <div className="text-3xl font-black text-emerald-600">{metrics.memoryUsedMb} MB</div>
            </div>
            <div className="glass-panel p-6 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase mb-2">Active Requests</div>
              <div className="text-3xl font-black text-amber-500">{metrics.activeRequests}</div>
            </div>
          </div>
        )}

        <div className="glass-panel p-6 rounded-2xl shadow-sm h-96">
           <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
             <Activity className="w-4 h-4 text-slate-400" /> CPU History
           </h2>
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={metrics?.history || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <RTooltip />
                <Area type="monotone" dataKey="cpu" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </div>
    </SidebarLayout>
  );
};
