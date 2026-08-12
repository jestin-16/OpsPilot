import React, { useEffect, useState, useRef } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api } from '../services/api';
import { Activity, Globe, Shield, Clock, Terminal, CheckCircle, XCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const MonitoringDashboard: React.FC = () => {
  const [url, setUrl] = useState('https://flipkart.com');
  const [probing, setProbing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const startProbing = () => {
    setProbing(true);
    setHistory([]);
    setLogs([`[${new Date().toLocaleTimeString()}] Initializing Blackbox Exporter probe for ${url}...`]);
  };

  const stopProbing = () => {
    setProbing(false);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Probing stopped.`]);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (probing) {
      interval = setInterval(async () => {
        try {
          const timestamp = new Date().toLocaleTimeString();
          setLogs((prev) => [...prev, `[${timestamp}] Resolving DNS and establishing TCP connection...`]);

          const data = await api.probeUrl(url);

          if (data.success === 1.0) {
            setLogs((prev) => [...prev, `[${timestamp}] SUCCESS: HTTP ${data.httpStatus} received in ${(data.duration * 1000).toFixed(2)}ms.`]);
          } else {
            setLogs((prev) => [...prev, `[${timestamp}] ERROR: Probe failed or timed out.`]);
          }

          setCurrentMetrics(data);
          setHistory((prev) => {
            const newHistory = [...prev, { time: timestamp, latency: data.duration ? data.duration * 1000 : 0 }];
            if (newHistory.length > 20) newHistory.shift();
            return newHistory;
          });
        } catch (err) {
          setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] FAILED to connect to backend probe API.`]);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [probing, url]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#111217] p-8 font-sans text-gray-300">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-[#1F2937] p-6 rounded-xl border border-gray-800 shadow-2xl">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                <Globe className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Live Blackbox Monitoring</h1>
                <p className="text-sm text-gray-400">Dynamic target probing powered by Prometheus</p>
              </div>
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={probing}
                className="w-full md:w-80 bg-[#111217] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                placeholder="https://example.com"
              />
              {!probing ? (
                <button
                  onClick={startProbing}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" /> Start
                </button>
              ) : (
                <button
                  onClick={stopProbing}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8"></div>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Status Code</h3>
              </div>
              <div className="text-4xl font-bold text-white">
                {currentMetrics ? currentMetrics.httpStatus || 'N/A' : '---'}
              </div>
            </div>

            <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8"></div>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Ping Latency</h3>
              </div>
              <div className="text-4xl font-bold text-white">
                {currentMetrics && currentMetrics.duration ? `${(currentMetrics.duration * 1000).toFixed(0)} ms` : '---'}
              </div>
            </div>

            <div className="bg-[#1F2937] p-6 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8"></div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">SSL Validity</h3>
              </div>
              <div className="text-4xl font-bold text-white">
                {currentMetrics && currentMetrics.sslExpiry ? (
                  `${Math.max(0, Math.floor((currentMetrics.sslExpiry - Date.now() / 1000) / 86400))} days`
                ) : '---'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Latency Graph */}
            <div className="lg:col-span-2 bg-[#1F2937] p-6 rounded-xl border border-gray-800 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Latency Graph</h2>
                  <p className="text-xs text-gray-400">Response time (ms) over time</p>
                </div>
                {probing && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>}
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111217', borderColor: '#374151', color: '#FFF' }}
                      itemStyle={{ color: '#10B981' }}
                    />
                    <Area type="monotone" dataKey="latency" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Log Terminal */}
            <div className="bg-[#0D1117] p-1 rounded-xl border border-gray-800 shadow-xl flex flex-col h-[380px]">
              <div className="bg-[#1F2937] px-4 py-3 rounded-t-lg border-b border-gray-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-300">Live Probe Logs</h2>
              </div>
              <div className="p-4 font-mono text-xs overflow-y-auto flex-1 text-emerald-400/90 leading-relaxed space-y-2">
                {logs.length === 0 && <span className="text-gray-600">Waiting for probe to start...</span>}
                {logs.map((log, i) => (
                  <div key={i} className={log.includes('ERROR') || log.includes('FAILED') ? 'text-red-400' : ''}>
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </SidebarLayout>
  );
};
