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
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:p-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Internal telemetry</div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-800">
              <Server className="h-6 w-6 text-indigo-500" />
              Whitebox Monitoring (Internal)
            </h1>
            <p className="mt-1 text-sm text-slate-500">Application health, runtime metrics, and JVM telemetry.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Provider</label>
            <select
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="local">Simulated (Local)</option>
              <option value="prometheus">Prometheus</option>
              <option value="aws">AWS CloudWatch</option>
            </select>
          </div>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">CPU Usage</div>
              <div className="text-3xl font-black text-indigo-600">{metrics.cpuUsagePercent}%</div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(metrics.cpuUsagePercent, 100)}%` }} /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Memory Used</div>
              <div className="text-3xl font-black text-cyan-600">{metrics.memoryUsedMb} MB</div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/5 rounded-full bg-cyan-500" /></div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Requests</div>
              <div className="text-3xl font-black text-amber-500">{metrics.activeRequests}</div>
              <div className="mt-4 text-[11px] font-semibold text-slate-400">Current request pressure</div>
            </div>
          </div>
        )}

        <div className="h-96 rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur md:p-6">
           <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
             <Activity className="h-4 w-4 text-indigo-500" /> CPU History
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
