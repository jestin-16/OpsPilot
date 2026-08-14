import React, { useEffect, useState, useMemo } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api } from '../services/api';
import type { LogEntry, MetricsData, Project } from '../services/api';
import { Terminal, CheckCircle, FolderGit2, Filter, Activity, Server, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

export const LiveProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>('ALL');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<'UNIFIED' | 'AWS' | 'LOKI' | 'CICD'>('UNIFIED');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const p = await api.getProjects();
        setProjects(p);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectId = selectedProjectId !== 'ALL' ? selectedProjectId : undefined;

        const logData = await api.getLogs({ providerName: 'ALL', projectId });
        setLogs(logData);
        
        const metricData = await api.getMetrics('local');
        setMetrics(metricData);
      } catch (err) {
        console.error("Failed to fetch live data", err);
      }
    };
    
    fetchData();
    const t = setInterval(fetchData, 3000);
    return () => clearInterval(t);
  }, [selectedProjectId, projects]);

  const getProviderBadge = (source?: string) => {
    const s = source?.toLowerCase() || 'local';
    if (s === 'aws') return <span className="px-1.5 py-[1px] rounded bg-orange-500/20 text-orange-400 font-bold text-[9px] border border-orange-500/30 uppercase tracking-wider">AWS</span>;
    if (s === 'loki') return <span className="px-1.5 py-[1px] rounded bg-blue-500/20 text-blue-400 font-bold text-[9px] border border-blue-500/30 uppercase tracking-wider">Loki</span>;
    if (s === 'elasticsearch') return <span className="px-1.5 py-[1px] rounded bg-emerald-500/20 text-emerald-400 font-bold text-[9px] border border-emerald-500/30 uppercase tracking-wider">ELK</span>;
    return <span className="px-1.5 py-[1px] rounded bg-slate-500/20 text-slate-300 font-bold text-[9px] border border-slate-500/30 uppercase tracking-wider">Local DB</span>;
  };

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (errorsOnly) {
      result = result.filter(l => l.logLevel === 'ERROR' || l.logLevel === 'WARN');
    }
    if (activeLogTab === 'AWS') {
      result = result.filter(l => l.providerSource?.toLowerCase() === 'aws');
    } else if (activeLogTab === 'LOKI') {
      result = result.filter(l => l.providerSource?.toLowerCase() === 'loki');
    } else if (activeLogTab === 'CICD') {
      result = result.filter(l => l.providerSource?.toLowerCase() === 'github');
    }
    return result;
  }, [logs, errorsOnly, activeLogTab]);

  // Compute log histogram (buckets of 5 mins)
  const histogramData = useMemo(() => {
    const buckets: Record<string, { time: string, error: number, warn: number, info: number }> = {};
    [...logs].reverse().forEach(log => {
        const date = new Date(log.timestamp);
        const mins = date.getMinutes();
        const bucketMin = mins - (mins % 5); // 5 min buckets
        const timeKey = `${date.getHours().toString().padStart(2, '0')}:${bucketMin.toString().padStart(2, '0')}`;
        
        if (!buckets[timeKey]) buckets[timeKey] = { time: timeKey, error: 0, warn: 0, info: 0 };
        
        if (log.logLevel === 'ERROR') buckets[timeKey].error++;
        else if (log.logLevel === 'WARN') buckets[timeKey].warn++;
        else buckets[timeKey].info++;
    });
    return Object.values(buckets);
  }, [logs]);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#0b0c10] -m-2 p-6 font-sans text-slate-300">
        <div className="max-w-[1600px] mx-auto space-y-4">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111217] p-4 rounded-xl border border-[#1f2129] shadow-lg">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Live Project Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0b0c10] px-3 py-1.5 rounded-lg border border-[#1f2129]">
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded font-bold uppercase tracking-widest border border-emerald-400/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-12 gap-4">
            
            {/* KPI Column */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
              <div className="bg-[#111217] p-4 rounded-xl border border-[#1f2129] flex-1 flex flex-col justify-center">
                 <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Global Health</div>
                 <div className="text-3xl font-black text-emerald-400 flex items-center gap-2"><CheckCircle className="w-6 h-6"/> OK</div>
              </div>
              <div className="bg-[#111217] p-4 rounded-xl border border-[#1f2129] flex-1 flex flex-col justify-center">
                 <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Active Requests</div>
                 <div className="text-3xl font-black text-amber-400">{metrics?.activeRequests || 0}</div>
              </div>
              <div className="bg-[#111217] p-4 rounded-xl border border-[#1f2129] flex-1 flex flex-col justify-center">
                 <div className="text-[10px] uppercase font-bold text-rose-500 mb-1">Recent Errors</div>
                 <div className="text-3xl font-black text-rose-500">{logs.filter(l => l.logLevel === 'ERROR').length}</div>
              </div>
            </div>

            {/* Charts Column */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
               {/* Log Volume Histogram */}
               <div className="bg-[#111217] p-4 rounded-xl border border-[#1f2129] h-48 flex flex-col">
                 <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Activity className="w-3.5 h-3.5" /> Log Volume (5m buckets)
                 </h2>
                 <div className="flex-1 min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={histogramData} margin={{ left: -25, right: 0, top: 5, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#1f2129" />
                       <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                       <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                       <RTooltip cursor={{fill: '#1f2129'}} contentStyle={{ backgroundColor: '#0b0c10', borderColor: '#1f2129', borderRadius: 4, fontSize: 11 }} />
                       <Bar dataKey="info" stackId="a" fill="#3b82f6" name="Info" />
                       <Bar dataKey="warn" stackId="a" fill="#f59e0b" name="Warn" />
                       <Bar dataKey="error" stackId="a" fill="#ef4444" name="Error" />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               {/* Resource Area Chart */}
               <div className="bg-[#111217] p-4 rounded-xl border border-[#1f2129] h-48 flex flex-col">
                 <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Server className="w-3.5 h-3.5" /> CPU Utilization
                 </h2>
                 <div className="flex-1 min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={metrics?.history || []} margin={{ left: -25, right: 0, top: 5, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#1f2129" />
                       <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                       <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                       <RTooltip contentStyle={{ backgroundColor: '#0b0c10', borderColor: '#1f2129', borderRadius: 4, fontSize: 11 }} />
                       <Area type="monotone" dataKey="cpu" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </div>
            </div>
            
            {/* Log Stream Terminal */}
            <div className="col-span-12 bg-[#0b0c10] rounded-xl border border-[#1f2129] shadow-2xl flex flex-col h-[600px]">
              
              {/* Terminal Header & Tabs */}
              <div className="flex flex-col border-b border-[#1f2129] bg-[#111217] rounded-t-xl">
                <div className="px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <h2 className="text-xs font-bold text-slate-200 tracking-wider">LIVE LOG STREAM</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="hidden" checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} />
                      <div className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${errorsOnly ? 'bg-rose-500' : 'bg-slate-700'}`}>
                         <div className={`w-3 h-3 rounded-full bg-white transition-transform ${errorsOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-200 transition-colors">Errors & Warns</span>
                    </label>
                  </div>
                </div>

                <div className="flex px-2 gap-1 border-t border-[#1f2129] pt-2">
                  <button 
                    onClick={() => setActiveLogTab('UNIFIED')}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeLogTab === 'UNIFIED' ? 'bg-[#1f2129] text-indigo-400 border-t border-x border-[#2d303b]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#15171d]'}`}
                  >
                    Unified Stream
                  </button>
                  <button 
                    onClick={() => setActiveLogTab('AWS')}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeLogTab === 'AWS' ? 'bg-[#1f2129] text-orange-400 border-t border-x border-[#2d303b]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#15171d]'}`}
                  >
                    Production (AWS)
                  </button>
                  <button 
                    onClick={() => setActiveLogTab('LOKI')}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeLogTab === 'LOKI' ? 'bg-[#1f2129] text-blue-400 border-t border-x border-[#2d303b]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#15171d]'}`}
                  >
                    Metrics (Loki)
                  </button>
                  <button 
                    onClick={() => setActiveLogTab('CICD')}
                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeLogTab === 'CICD' ? 'bg-[#1f2129] text-slate-300 border-t border-x border-[#2d303b]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#15171d]'}`}
                  >
                    CI/CD (GitHub)
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-[#1f2129] scrollbar-track-transparent">
                 {filteredLogs.length === 0 ? (
                    <div className="text-slate-600">Waiting for incoming logs...</div>
                 ) : (
                    filteredLogs.map((log) => (
                      <div key={log.logId} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-1 hover:bg-[#111217] px-2 rounded-md transition-colors group">
                        <span className="text-slate-600 w-20 shrink-0 select-none">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>
                        
                        <div className="shrink-0 w-12 flex justify-start">
                          {getProviderBadge(log.providerSource)}
                        </div>

                        <span className={`w-12 shrink-0 font-bold ${
                          log.logLevel === 'ERROR' ? 'text-rose-500' :
                          log.logLevel === 'WARN' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {log.logLevel}
                        </span>
                        
                        <span className="text-indigo-400 w-32 shrink-0 truncate" title={log.sourceService}>
                          {log.sourceService}
                        </span>
                        
                        <span className={`flex-1 break-all ${log.logLevel === 'ERROR' ? 'text-rose-300 font-medium' : 'text-slate-300'}`}>
                          {log.message}
                        </span>
                      </div>
                    ))
                 )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
