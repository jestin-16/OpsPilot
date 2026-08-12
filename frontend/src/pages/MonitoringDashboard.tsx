import React, { useEffect, useState, useRef } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api } from '../services/api';
import {
  Activity, Globe, Shield, Clock, Terminal, CheckCircle,
  XCircle, Wifi, WifiOff, AlertTriangle, Server, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Legend
} from 'recharts';

interface ProbeResult {
  success: number;
  duration: number;
  dnsSeconds: number;
  connectSeconds: number;
  tlsSeconds: number;
  httpStatus: number;
  sslExpiry: number;
  probeSuccess: number;
  statusLabel: string;
  error?: string;
}

interface HistoryPoint {
  time: string;
  latency: number;
  dns: number;
  tls: number;
}

const StatusBadge: React.FC<{ label: string; status: number }> = ({ label, status }) => {
  let color = 'text-gray-400 bg-gray-800 border-gray-700';
  let Icon = AlertTriangle;
  if (status >= 200 && status < 300) { color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'; Icon = CheckCircle; }
  else if (status >= 300 && status < 400) { color = 'text-blue-400 bg-blue-500/10 border-blue-500/30'; Icon = Activity; }
  else if (status === 403) { color = 'text-amber-400 bg-amber-500/10 border-amber-500/30'; Icon = AlertTriangle; }
  else if (status >= 400) { color = 'text-red-400 bg-red-500/10 border-red-500/30'; Icon = XCircle; }
  else if (status === 0) { color = 'text-red-400 bg-red-500/10 border-red-500/30'; Icon = WifiOff; }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  glow: string;
}> = ({ icon, label, value, sub, color, glow }) => (
  <div className={`bg-[#1a1d27] p-5 rounded-xl border border-gray-800/60 shadow-xl relative overflow-hidden group hover:border-${color}-500/40 transition-all duration-300`}>
    <div className={`absolute top-0 right-0 w-28 h-28 bg-${glow}-500/5 rounded-bl-full -mr-6 -mt-6 group-hover:bg-${glow}-500/10 transition-all`} />
    <div className="flex items-center gap-2 mb-3">
      <div className={`text-${color}-400`}>{icon}</div>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-3xl font-bold text-white font-mono">{value}</div>
    {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
  </div>
);

export const MonitoringDashboard: React.FC = () => {
  const [url, setUrl] = useState('https://amazon.in');
  const [probing, setProbing] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [current, setCurrent] = useState<ProbeResult | null>(null);
  const [logs, setLogs] = useState<{ time: string; text: string; type: 'info' | 'success' | 'error' | 'warn' }[]>([]);
  const [sslDaysLeft, setSslDaysLeft] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-99), { time, text, type }]);
  };

  const startProbing = () => {
    setProbing(true);
    setHistory([]);
    setCurrent(null);
    setLogs([]);
    addLog(`Initializing Blackbox Exporter probe for ${url}...`, 'info');
  };

  const stopProbing = () => {
    setProbing(false);
    addLog('Probing stopped.', 'warn');
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (probing) {
      interval = setInterval(async () => {
        const ts = new Date().toLocaleTimeString();
        addLog(`[${ts}] Resolving DNS → establishing TCP → TLS handshake...`, 'info');
        try {
          const data: ProbeResult = await api.probeUrl(url);
          setCurrent(data);

          // SSL days remaining
          if (data.sslExpiry && data.sslExpiry > 0) {
            const days = Math.max(0, Math.floor((data.sslExpiry - Date.now() / 1000) / 86400));
            setSslDaysLeft(days);
          }

          const latencyMs = (data.duration * 1000).toFixed(0);
          const status = data.httpStatus ?? 0;

          if (data.success === 1.0) {
            if (status >= 200 && status < 300) {
              addLog(`[${ts}] ✅ HTTP ${status} — ${latencyMs}ms total  |  DNS: ${(data.dnsSeconds * 1000).toFixed(0)}ms  TLS: ${(data.tlsSeconds * 1000).toFixed(0)}ms`, 'success');
            } else {
              addLog(`[${ts}] ⚠️  HTTP ${status} (${data.statusLabel}) — server reachable in ${latencyMs}ms`, 'warn');
            }
          } else {
            addLog(`[${ts}] ❌ UNREACHABLE — probe timed out or connection refused`, 'error');
          }

          setHistory(prev => {
            const next = [...prev, {
              time: ts,
              latency: parseFloat(latencyMs),
              dns: parseFloat((data.dnsSeconds * 1000).toFixed(1)),
              tls: parseFloat((data.tlsSeconds * 1000).toFixed(1)),
            }];
            return next.slice(-25);
          });
        } catch {
          addLog(`[${ts}] ❌ FAILED — cannot reach backend probe API`, 'error');
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [probing, url]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const latencyMs = current ? (current.duration * 1000).toFixed(0) : '---';
  const status = current?.httpStatus ?? 0;
  const isUp = current && current.success === 1.0;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#0d0f18] p-6 font-sans text-gray-300">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1a1d27] p-5 rounded-xl border border-gray-800/60 shadow-2xl gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                <Globe className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Live Blackbox Monitoring</h1>
                <p className="text-xs text-gray-500 mt-0.5">Real-time HTTP probing via Prometheus Blackbox Exporter</p>
              </div>
              {/* Live indicator */}
              {probing && (
                <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-400 font-semibold">LIVE</span>
                </div>
              )}
            </div>

            <div className="flex w-full md:w-auto gap-3 items-center">
              <div className="flex-1 md:w-80 relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={probing}
                  className="w-full bg-[#0d0f18] border border-gray-700/60 text-white pl-9 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50 transition-all"
                  placeholder="https://example.com"
                />
              </div>
              {!probing ? (
                <button
                  onClick={startProbing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Activity className="w-4 h-4" /> Start Probe
                </button>
              ) : (
                <button
                  onClick={stopProbing}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <XCircle className="w-4 h-4" /> Stop
                </button>
              )}
            </div>
          </div>

          {/* ── Status + Metrics Row ────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Status pill */}
            <div className="col-span-2 md:col-span-1 bg-[#1a1d27] p-5 rounded-xl border border-gray-800/60 flex flex-col items-center justify-center gap-2">
              {isUp === null ? (
                <WifiOff className="w-8 h-8 text-gray-600" />
              ) : isUp ? (
                <Wifi className="w-8 h-8 text-emerald-400" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-400" />
              )}
              <StatusBadge label={current?.statusLabel ?? 'IDLE'} status={status} />
              {status > 0 && <span className="text-2xl font-bold font-mono text-white">{status}</span>}
            </div>

            <MetricCard icon={<Clock className="w-4 h-4" />} label="Total Latency" value={current ? `${latencyMs}ms` : '---'} sub="End-to-end probe time" color="emerald" glow="emerald" />
            <MetricCard icon={<Zap className="w-4 h-4" />} label="DNS Lookup" value={current ? `${(current.dnsSeconds * 1000).toFixed(0)}ms` : '---'} sub="Name resolution time" color="blue" glow="blue" />
            <MetricCard icon={<Server className="w-4 h-4" />} label="TCP + TLS" value={current ? `${((current.connectSeconds + current.tlsSeconds) * 1000).toFixed(0)}ms` : '---'} sub="Connection handshake" color="purple" glow="purple" />
            <MetricCard
              icon={<Shield className="w-4 h-4" />}
              label="SSL Validity"
              value={sslDaysLeft !== null ? `${sslDaysLeft}d` : '---'}
              sub={sslDaysLeft !== null ? (sslDaysLeft < 30 ? '⚠️ Expiring soon' : '✅ Certificate valid') : 'Not checked'}
              color={sslDaysLeft !== null && sslDaysLeft < 30 ? 'amber' : 'green'}
              glow="green"
            />
          </div>

          {/* ── Charts + Terminal ───────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Latency area chart */}
            <div className="lg:col-span-2 bg-[#1a1d27] p-5 rounded-xl border border-gray-800/60 shadow-xl">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-sm font-bold text-white">Response Latency</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Total probe time over last 25 checks (ms)</p>
                </div>
                {probing && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ left: -20, right: 5 }}>
                    <defs>
                      <linearGradient id="gradLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2333" vertical={false} />
                    <XAxis dataKey="time" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1d27', borderColor: '#374151', color: '#fff', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: '#10B981' }}
                      formatter={(v: number) => [`${v}ms`, 'Latency']}
                    />
                    <Area type="monotone" dataKey="latency" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#gradLatency)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Phase breakdown bar chart */}
            <div className="bg-[#1a1d27] p-5 rounded-xl border border-gray-800/60 shadow-xl">
              <div className="mb-5">
                <h2 className="text-sm font-bold text-white">Phase Breakdown</h2>
                <p className="text-xs text-gray-500 mt-0.5">DNS vs TLS per probe (ms)</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history.slice(-10)} margin={{ left: -20, right: 5 }} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2333" vertical={false} />
                    <XAxis dataKey="time" stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1d27', borderColor: '#374151', color: '#fff', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number, n: string) => [`${v}ms`, n === 'dns' ? 'DNS' : 'TLS']}
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                    <Bar dataKey="dns" fill="#3B82F6" radius={[3, 3, 0, 0]} name="DNS" />
                    <Bar dataKey="tls" fill="#8B5CF6" radius={[3, 3, 0, 0]} name="TLS" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Live Log Terminal ───────────────────────────────────── */}
          <div className="bg-[#080a10] rounded-xl border border-gray-800/60 shadow-xl overflow-hidden">
            <div className="bg-[#1a1d27] px-5 py-3 border-b border-gray-800/60 flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <Terminal className="w-3.5 h-3.5 text-gray-500" />
              <h2 className="text-xs font-semibold text-gray-400">blackbox-probe — live output</h2>
              <span className="ml-auto text-xs text-gray-600">{logs.length} events</span>
            </div>
            <div className="p-4 font-mono text-xs h-44 overflow-y-auto leading-relaxed space-y-1">
              {logs.length === 0 && (
                <span className="text-gray-700">$ Enter a URL above and click <span className="text-emerald-600">Start Probe</span> to begin...</span>
              )}
              {logs.map((log, i) => {
                const cls =
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'warn' ? 'text-amber-400' :
                  'text-gray-400';
                return (
                  <div key={i} className={cls}>
                    <span className="text-gray-600 select-none">[{log.time}] </span>
                    {log.text}
                  </div>
                );
              })}
              <div ref={logEndRef} />
            </div>
          </div>

        </div>
      </div>
    </SidebarLayout>
  );
};
