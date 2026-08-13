import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api } from '../services/api';
import {
  Activity, Globe, Shield, Terminal,
  XCircle, RefreshCw, ChevronDown,
  Info, MapPin, Server, Lock, Layers,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeoInfo {
  ip: string; country: string; countryCode: string;
  region: string; city: string; isp: string; org: string;
  as: string; lat: number; lon: number; timezone: string;
}

interface SecurityHeaders {
  hsts: string | null; csp: string | null; xFrameOptions: string | null;
  xContentTypeOpts: string | null; xXSSProtection: string | null;
  referrerPolicy: string | null; permissionsPolicy: string | null;
}

interface HeaderInfo {
  server: string | null; poweredBy: string | null; contentType: string | null;
  cacheControl: string | null; via: string | null;
  xCache: string | null; cdn: string | null;
  security: SecurityHeaders;
  securityScore: number; securityMaxScore: number;
  error?: string;
}

interface ProbeResult {
  success: number; probeSuccess: number;
  httpStatus: number; statusLabel: string;
  duration: number; dnsSeconds: number;
  connectSeconds: number; tlsSeconds: number;
  processSeconds: number; transferSeconds: number;
  sslExpiry: number; httpVersion: string;
  redirects: number; contentLength: number;
  isSSL: boolean; ipProtocol: string;
  tlsCipher: string | null; tlsVersion: string | null;
  certIssuer: string | null; certSubject: string | null;
  certSANs: string | null; certSHA256: string | null;
  resolvedIps: string[]; ipv6Supported: boolean;
  geo?: GeoInfo; headers?: HeaderInfo;
  browser?: {
    consoleErrors: string[];
    waterfallCount: number;
    lcp: number;
    firstPaint: number;
    browserError?: string;
  };
  openPorts?: number[];
  sqliVulnerable?: boolean;
  dnsChain?: string[];
  error?: string;
}

interface TimePoint {
  time: string; latency: number; dns: number;
  tls: number; connect: number; processing: number; transfer: number;
  success: number;
}

interface LogEntry { time: string; text: string; type: 'info' | 'success' | 'error' | 'warn'; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REFRESH_OPTIONS = [
  { label: '3s', ms: 3000 }, { label: '5s', ms: 5000 },
  { label: '10s', ms: 10000 }, { label: '30s', ms: 30000 },
];
const PIE_COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#06B6D4'];
const fmt = (n: number, d = 0) => n.toFixed(d);

function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
}

function fmtBytes(bytes: number): string {
  if (bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const RealBadge = () => (
  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold tracking-wider">LIVE</span>
);
const CalcBadge = () => (
  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-bold tracking-wider">CALC</span>
);

const Panel: React.FC<{
  title: string; subtitle?: string; children: React.ReactNode;
  className?: string; badge?: React.ReactNode; icon?: React.ReactNode;
}> = ({ title, subtitle, children, className = '', badge, icon }) => (
  <div className={`glass-panel rounded-2xl overflow-hidden flex flex-col shadow-sm ${className}`}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="text-indigo-400 flex-shrink-0 bg-indigo-50 p-1.5 rounded-lg">{icon}</span>}
        <span className="text-xs font-bold text-slate-800 uppercase tracking-widest truncate">{title}</span>
        {subtitle && <span className="text-[11px] font-medium text-slate-500 truncate hidden sm:inline">— {subtitle}</span>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">{badge ?? <RealBadge />}</div>
    </div>
    <div className="flex-1 p-5">{children}</div>
  </div>
);

const KV: React.FC<{ k: string; v: React.ReactNode; badge?: React.ReactNode }> = ({ k, v, badge }) => (
  <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">{k}</span>
    <div className="flex items-center gap-1.5 flex-wrap justify-end">
      <span className="text-[11px] text-slate-800 font-mono text-right break-all">{v || '—'}</span>
      {badge}
    </div>
  </div>
);

const SecurityBar: React.FC<{ score: number; max: number }> = ({ score, max }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-mono text-slate-600">{score}/{max}</span>
    </div>
  );
};

const StatusPill: React.FC<{ status: number; label: string; probing: boolean }> = ({ status, label, probing }) => {
  if (!probing) return <span className="text-xs text-slate-500 border border-slate-200 rounded px-2 py-0.5 font-mono bg-white">NO DATA</span>;
  const cls = status === 0 ? 'bg-red-50 text-red-600 border-red-200'
    : status < 300 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status < 400 ? 'bg-blue-50 text-blue-600 border-blue-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';
  return <span className={`text-xs font-bold border rounded px-2 py-0.5 font-mono ${cls}`}>{status > 0 ? `HTTP ${status}` : 'DOWN'} · {label}</span>;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const MonitoringDashboard: React.FC = () => {
  const [url, setUrl]                     = useState('https://amazon.in');
  const [probing, setProbing]             = useState(false);
  const [refreshMs, setRefreshMs]         = useState(5000);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);
  const [history, setHistory]             = useState<TimePoint[]>([]);
  const [current, setCurrent]             = useState<ProbeResult | null>(null);
  const [logs, setLogs]                   = useState<LogEntry[]>([]);
  const [totalChecks, setTotalChecks]     = useState(0);
  const [successChecks, setSuccessChecks] = useState(0);
  const [startTime]                       = useState(() => Date.now());
  const [elapsedSec, setElapsedSec]       = useState(0);
  const [serviceStatus, setServiceStatus] = useState<'ready' | 'starting' | 'error'>('ready');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-199), { time, text, type }]);
  }, []);

  const resetSession = useCallback(() => {
    setHistory([]); setTotalChecks(0); setSuccessChecks(0); setCurrent(null); setLogs([]);
  }, []);

  useEffect(() => {
    if (!probing) return;
    const run = async () => {
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
      try {
        const data: ProbeResult = await api.probeUrl(url);
        if (serviceStatus !== 'ready') setServiceStatus('ready');
        setCurrent(data);
        const latMs = data.duration * 1000;
        const isUp  = data.success === 1.0;
        setTotalChecks(n => n + 1);
        if (isUp) setSuccessChecks(n => n + 1);
        setHistory(prev => [...prev, {
          time:       ts,
          latency:    +latMs.toFixed(1),
          dns:        +(data.dnsSeconds * 1000).toFixed(1),
          tls:        +(data.tlsSeconds * 1000).toFixed(1),
          connect:    +(data.connectSeconds * 1000).toFixed(1),
          processing: +(data.processSeconds * 1000).toFixed(1),
          transfer:   +(data.transferSeconds * 1000).toFixed(1),
          success:    isUp ? 1 : 0,
        }].slice(-60));

        if (isUp) {
          const geo = data.geo ? ` · 📍 ${data.geo.city}, ${data.geo.countryCode} (${data.geo.isp})` : '';
          const cdn = data.headers?.cdn && data.headers.cdn !== 'None detected' ? ` · CDN: ${data.headers.cdn}` : '';
          const ports = data.openPorts ? ` · Ports: [${data.openPorts.join(',')}]` : '';
          addLog(
            `✅ HTTP ${data.httpStatus} · ${fmt(latMs,0)}ms · ${data.httpVersion} · ${data.tlsVersion ?? 'TLS?'}${geo}${cdn}${ports}`,
            'success'
          );
        } else {
          addLog(`❌ UNREACHABLE — ${data.resolvedIps?.length ? `resolved ${data.resolvedIps.length} IPs` : 'DNS failed'}`, 'error');
        }
      } catch (err: any) {
        if (err?.response?.status === 503 || err?.message?.includes('503') || err?.message?.includes('Network Error')) {
          setServiceStatus('starting');
          addLog(`⏳ Backend starting up or downloading dependencies... (503)`, 'warn');
        } else {
          setServiceStatus('error');
          addLog(`❌ Backend probe API unreachable`, 'error');
        }
      }
    };
    run();
    const id = setInterval(run, refreshMs);
    return () => clearInterval(id);
  }, [probing, url, refreshMs, addLog]);

  // Fix: Scroll behavior block: nearest prevents the whole page from jumping
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs]);

  // Computed metrics
  const lats    = history.map(p => p.latency);
  const avgLat  = lats.length ? Math.round(lats.reduce((s, v) => s + v, 0) / lats.length) : 0;
  const minLat  = lats.length ? Math.round(Math.min(...lats)) : 0;
  const maxLat  = lats.length ? Math.round(Math.max(...lats)) : 0;
  const p50     = Math.round(percentile(lats, 50));
  const p95     = Math.round(percentile(lats, 95));
  const p99     = Math.round(percentile(lats, 99));
  const uptimePct  = totalChecks > 0 ? ((successChecks / totalChecks) * 100).toFixed(2) : '—';
  const errorRate  = totalChecks > 0 ? (((totalChecks - successChecks) / totalChecks) * 100).toFixed(1) : '0.0';
  const sslDays    = current?.sslExpiry ? Math.max(0, Math.floor((current.sslExpiry - Date.now() / 1000) / 86400)) : null;
  const last       = history[history.length - 1];
  const prev       = history[history.length - 2];
  const latTrend   = last && prev ? (last.latency > prev.latency ? 'up' : 'down') : null;
  const elapsed    = `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`;

  const phaseData = current ? [
    { name: 'DNS',        value: +(current.dnsSeconds * 1000).toFixed(1) },
    { name: 'TCP',        value: +(current.connectSeconds * 1000).toFixed(1) },
    { name: 'TLS',        value: +(current.tlsSeconds * 1000).toFixed(1) },
    { name: 'Processing', value: +(current.processSeconds * 1000).toFixed(1) },
    { name: 'Transfer',   value: +(current.transferSeconds * 1000).toFixed(1) },
  ] : [];

  return (
    <SidebarLayout>
      <div className="min-h-screen p-8 max-w-[1500px] mx-auto space-y-6 font-sans flex flex-col animate-fade-in-up">
        
        {/* Status Banner */}
        {serviceStatus === 'starting' && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
            <div>
              <h3 className="text-amber-800 font-bold text-sm">Backend Starting Up...</h3>
              <p className="text-amber-700 text-xs mt-0.5">The observability service is booting up or downloading browser binaries (Playwright). Please wait...</p>
            </div>
          </div>
        )}

        {serviceStatus === 'error' && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded shadow-sm flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-rose-800 font-bold text-sm">API Unreachable</h3>
              <p className="text-rose-700 text-xs mt-0.5">The backend microservices are currently down or unreachable.</p>
            </div>
          </div>
        )}

        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5 glass-panel rounded-2xl shadow-sm">
          <div className="flex-1 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 min-w-[320px] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner">
              <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type="text" value={url} onChange={e => setUrl(e.target.value)} disabled={probing}
                placeholder="https://target.com"
                className="bg-transparent text-sm text-slate-800 font-medium w-full focus:outline-none placeholder-slate-400 disabled:opacity-50" />
            </div>
            {!probing ? (
              <button onClick={() => { resetSession(); setProbing(true); addLog(`▶ Session started → ${url}`, 'info'); }}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                <Activity className="w-4 h-4" /> Start Probing
              </button>
            ) : (
              <button onClick={() => { setProbing(false); addLog('⏹ Session stopped.', 'warn'); }}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                <XCircle className="w-4 h-4" /> Stop Probing
              </button>
            )}
            <div className="relative">
              <button onClick={() => setShowRefreshMenu(m => !m)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCw className="w-4 h-4 text-slate-400" />
                {REFRESH_OPTIONS.find(o => o.ms === refreshMs)?.label}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {showRefreshMenu && (
                <div className="absolute top-full mt-1.5 left-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-28 overflow-hidden">
                  {REFRESH_OPTIONS.map(o => (
                    <button key={o.ms} onClick={() => { setRefreshMs(o.ms); setShowRefreshMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 transition-colors ${refreshMs === o.ms ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <StatusPill status={current?.httpStatus ?? 0} label={current?.statusLabel ?? 'IDLE'} probing={probing} />
            {probing && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono shrink-0">
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
              <Info className="w-3 h-3" /> Measured from server
            </span>
            <span>{history.length} probes</span>
            <span>{elapsed}</span>
          </div>
        </div>

        {/* ── Main Content ────────────────────────────────────────────── */}
        <div className="flex-1 space-y-6">

          {/* Row 1 — Core Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
            {[
              { label: 'Last Latency', val: last ? `${last.latency}ms` : '—', sub: latTrend ? (latTrend === 'up' ? 'Slowing down' : 'Getting faster') : 'Waiting...', color: 'text-indigo-600', badge: <RealBadge /> },
              { label: 'SSL Expiry', val: sslDays !== null ? `${sslDays} days` : '—', sub: sslDays !== null && sslDays < 30 ? '⚠️ Renew soon' : '✅ Valid', color: sslDays !== null && sslDays < 14 ? 'text-rose-600' : sslDays !== null && sslDays < 30 ? 'text-amber-600' : 'text-emerald-600', badge: <RealBadge /> },
              { label: 'Protocol', val: current?.httpVersion ?? '—', sub: current?.ipProtocol ?? '', color: 'text-violet-600', badge: <RealBadge /> },
            ].map(c => (
              <div key={c.label} className="glass-panel rounded-2xl p-5 flex flex-col gap-2 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{c.label}</span>
                  {c.badge}
                </div>
                <div className={`font-mono font-black text-3xl ${c.color} tracking-tight`}>{c.val}</div>
                <div className="text-[11px] text-slate-500 font-medium">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Row 2 — Main Chart & Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart */}
            <Panel title="Response Time" subtitle="real-time latency" className="lg:col-span-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ left: -15, right: 8, top: 4 }}>
                    <defs>
                      <linearGradient id="gLat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} unit="ms" />
                    <RTooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(v: number) => [`${v}ms`, 'Latency']} />
                    <Area type="monotone" dataKey="latency" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gLat)" dot={false} activeDot={{ r: 5, fill: '#4F46E5' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Terminal */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-lg h-[315px]">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-950 border-b border-slate-800">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <div className="flex-1 flex items-center justify-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] text-slate-400 font-mono font-medium">opspilot-probe</span>
                </div>
              </div>
              <div className="flex-1 p-4 font-mono text-[11.5px] leading-relaxed overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                {logs.length === 0 ? (
                  <div className="text-slate-500">
                    <span className="text-emerald-500">$</span> Awaiting probe start...
                  </div>
                ) : logs.map((log, i) => (
                  <div key={i} className="flex gap-2.5 hover:bg-slate-800/50 px-1 rounded transition-colors">
                    <span className="text-slate-500 flex-shrink-0 select-none">{log.time}</span>
                    <span className={
                      log.type === 'error' ? 'text-rose-400' :
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                    }>{log.text}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          {/* Row 3 — Phase Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Panel title="Network Phases" subtitle="stacked timeline" icon={<Layers className="w-4 h-4" />}>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history.slice(-15)} margin={{ left: -15, right: 8 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} unit="ms" />
                    <RTooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number, n: string) => [`${v}ms`, n]} />
                    <Bar dataKey="dns"        stackId="a" fill="#F59E0B" name="DNS" />
                    <Bar dataKey="connect"    stackId="a" fill="#3B82F6" name="TCP" />
                    <Bar dataKey="tls"        stackId="a" fill="#8B5CF6" name="TLS" />
                    <Bar dataKey="processing" stackId="a" fill="#10B981" name="Processing" />
                    <Bar dataKey="transfer"   stackId="a" fill="#06B6D4" name="Transfer" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Geo & Infrastructure" subtitle="location and server data" icon={<MapPin className="w-4 h-4" />}>
              {current?.geo ? (
                <div className="space-y-0.5">
                  <KV k="Location" v={`${current.geo.city}, ${current.geo.countryCode}`} badge={<RealBadge />} />
                  <KV k="ISP / Cloud" v={current.geo.isp} badge={<RealBadge />} />
                  <KV k="ASN" v={current.geo.as} badge={<RealBadge />} />
                  <KV k="Primary IP" v={current.geo.ip} badge={<RealBadge />} />
                  <KV k="IPv6 Active" v={current.ipv6Supported ? '✅ Yes' : '❌ No'} badge={<RealBadge />} />
                  <KV k="Edge CDN" v={current.headers?.cdn ?? 'None'} badge={<RealBadge />} />
                </div>
              ) : <div className="text-slate-400 text-sm py-4 text-center">Data populated on probe</div>}
            </Panel>

            <Panel title="Security Profile" subtitle="encryption & headers" icon={<Shield className="w-4 h-4" />}>
              {current ? (
                <div className="space-y-0.5">
                  <div className="mb-3 px-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>Header Security Score</span>
                      <span>{current.headers?.securityScore ?? 0}/7</span>
                    </div>
                    <SecurityBar score={current.headers?.securityScore ?? 0} max={7} />
                  </div>
                  <KV k="TLS Cipher" v={current.tlsCipher} badge={<RealBadge />} />
                  <KV k="Certificate" v={current.certIssuer?.split(',')[0]} badge={<RealBadge />} />
                  <KV k="HSTS Enforced" v={current.headers?.security.hsts ? '✅ Yes' : '❌ No'} badge={<RealBadge />} />
                  <KV k="Content Security" v={current.headers?.security.csp ? '✅ Yes' : '❌ No'} badge={<RealBadge />} />
                  <div className="border-t border-slate-100 my-2 pt-2"></div>
                  <KV k="SQLi Vuln Test" v={current.sqliVulnerable ? '⚠️ VULNERABLE' : '✅ SECURE'} badge={<RealBadge />} />
                  <KV k="Open Ports" v={current.openPorts?.join(', ') || 'None'} badge={<RealBadge />} />
                </div>
              ) : <div className="text-slate-400 text-sm py-4 text-center">Data populated on probe</div>}
            </Panel>

            <Panel title="Browser Rendering" subtitle="LCP, FID & Waterfall" icon={<Globe className="w-4 h-4" />}>
              {current?.browser && !current.browser.browserError ? (
                <div className="space-y-0.5">
                  <KV k="LCP (Largest Contentful Paint)" v={`${fmt(current.browser.lcp, 1)}ms`} badge={<RealBadge />} />
                  <KV k="First Paint" v={`${fmt(current.browser.firstPaint, 1)}ms`} badge={<RealBadge />} />
                  <KV k="Waterfall Requests" v={`${current.browser.waterfallCount} assets loaded`} badge={<RealBadge />} />
                  <KV k="Console Errors" v={current.browser.consoleErrors.length > 0 ? `⚠️ ${current.browser.consoleErrors.length} Errors` : '✅ Clean'} badge={<RealBadge />} />
                  {current.browser.consoleErrors.length > 0 && (
                    <div className="mt-2 p-2 bg-slate-900 text-rose-400 font-mono text-[9px] rounded h-16 overflow-y-auto">
                      {current.browser.consoleErrors.map((err, i) => (
                        <div key={i}>&gt; {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : <div className="text-slate-400 text-sm py-4 text-center">{current?.browser?.browserError || 'Loading browser metrics...'}</div>}
            </Panel>

            <Panel title="DNS Routing Chain" subtitle="dnsjava trace" icon={<Layers className="w-4 h-4" />}>
              {current?.dnsChain ? (
                <div className="p-2 bg-slate-900 text-slate-300 font-mono text-[9px] rounded h-40 overflow-y-auto space-y-1">
                  {current.dnsChain.map((record, i) => (
                    <div key={i}>{record}</div>
                  ))}
                </div>
              ) : <div className="text-slate-400 text-sm py-4 text-center">Resolving DNS chain...</div>}
            </Panel>
          </div>

        </div>
      </div>
    </SidebarLayout>
  );
};
