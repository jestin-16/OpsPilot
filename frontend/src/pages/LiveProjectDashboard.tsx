import React, { useEffect, useState, useMemo } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api } from '../services/api';
import type { LogEntry, MetricsData, Project } from '../services/api';
import { Terminal, CheckCircle, FolderGit2, Activity, Server, Database, Globe, Edit3, Save, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, LineChart, Line } from 'recharts';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export const LiveProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>('ALL');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<'UNIFIED' | 'AWS' | 'OCI' | 'LOKI' | 'CICD'>('UNIFIED');
  
  const [isEditMode, setIsEditMode] = useState(false);

  const initialLayout = [
    { i: 'kpi-health', x: 0, y: 0, w: 4, h: 3 },
    { i: 'kpi-requests', x: 4, y: 0, w: 4, h: 3 },
    { i: 'kpi-errors', x: 8, y: 0, w: 4, h: 3 },
    { i: 'chart-cpu', x: 0, y: 3, w: 4, h: 5 },
    { i: 'chart-memory', x: 4, y: 3, w: 4, h: 5 },
    { i: 'chart-network', x: 8, y: 3, w: 4, h: 5 },
    { i: 'chart-volume', x: 0, y: 8, w: 12, h: 5 },
    { i: 'log-terminal', x: 0, y: 13, w: 12, h: 10 },
  ];

  const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem('opspilot_dashboard_layout_v2');
    return saved ? JSON.parse(saved) : { lg: initialLayout };
  });

  const onLayoutChange = (_layout: any, allLayouts: any) => {
    setLayouts(allLayouts);
    localStorage.setItem('opspilot_dashboard_layout_v2', JSON.stringify(allLayouts));
  };

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
    if (s === 'aws') return <span className="px-1.5 py-[1px] rounded bg-[#2a2a2a] text-orange-500 font-bold text-[8px] uppercase tracking-wider">AWS</span>;
    if (s === 'oci') return <span className="px-1.5 py-[1px] rounded bg-[#2a2a2a] text-red-500 font-bold text-[8px] uppercase tracking-wider">OCI</span>;
    if (s === 'loki') return <span className="px-1.5 py-[1px] rounded bg-[#2a2a2a] text-blue-500 font-bold text-[8px] uppercase tracking-wider">Loki</span>;
    if (s === 'elasticsearch') return <span className="px-1.5 py-[1px] rounded bg-[#2a2a2a] text-emerald-500 font-bold text-[8px] uppercase tracking-wider">ELK</span>;
    return <span className="px-1.5 py-[1px] rounded bg-[#2a2a2a] text-slate-400 font-bold text-[8px] uppercase tracking-wider">Local</span>;
  };

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (errorsOnly) {
      result = result.filter(l => l.logLevel === 'ERROR' || l.logLevel === 'WARN');
    }
    if (activeLogTab === 'AWS') {
      result = result.filter(l => l.providerSource?.toLowerCase() === 'aws');
    } else if (activeLogTab === 'OCI') {
      result = result.filter(l => l.providerSource?.toLowerCase() === 'oci');
    } else if (activeLogTab === 'LOKI') {
      result = result.filter(l => l.providerSource?.toLowerCase() === 'loki');
    } else if (activeLogTab === 'CICD') {
      result = result.filter(l => l.providerSource?.toLowerCase() === 'github');
    }
    return result;
  }, [logs, errorsOnly, activeLogTab]);

  const histogramData = useMemo(() => {
    const buckets: Record<string, { time: string, error: number, warn: number, info: number }> = {};
    [...logs].reverse().forEach(log => {
        const date = new Date(log.timestamp);
        const mins = date.getMinutes();
        const bucketMin = mins - (mins % 5);
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
      <div className="min-h-screen bg-[#141414] -m-2 p-6 font-sans text-slate-300 overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto space-y-4">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1c1c1c] p-3 rounded-xl border border-[#2a2a2a] shadow-md relative z-10">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  isEditMode ? 'bg-[#2a2a2a] text-white border-slate-600' : 'bg-transparent text-slate-400 border-transparent hover:bg-[#2a2a2a]'
                }`}
              >
                {isEditMode ? <><Save className="w-3.5 h-3.5"/> Lock Grid</> : <><Edit3 className="w-3.5 h-3.5"/> Edit Grid</>}
              </button>

              <div className="flex items-center gap-2 bg-[#141414] px-3 py-1.5 rounded-lg border border-[#2a2a2a]">
                <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Draggable Grid Area */}
          <div className="w-full relative">
             {isEditMode && (
               <div className="absolute inset-0 border border-dashed border-slate-700/30 rounded-xl pointer-events-none z-0"></div>
             )}
             
             <ResponsiveGridLayout
               className={`layout ${isEditMode ? 'is-editable' : ''}`}
               layouts={layouts}
               onLayoutChange={onLayoutChange}
               breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
               cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
               rowHeight={30}
               isDraggable={isEditMode}
               isResizable={isEditMode}
               margin={[16, 16]}
             >
                {/* KPI: Global Health */}
                <div key="kpi-health" className={`bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] flex items-center justify-between p-4 relative ${isEditMode ? 'cursor-move ring-1 ring-emerald-500/50' : ''}`}>
                  <div className="flex flex-col">
                     <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 font-medium">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Global Health
                     </div>
                     <div className="text-2xl font-bold text-white">99.9<span className="text-sm text-slate-500">%</span></div>
                     <div className="text-[9px] text-slate-500 mt-0.5">Uptime</div>
                  </div>
                  <div className="w-12 h-12 relative flex items-center justify-center">
                     <svg className="w-12 h-12 transform -rotate-90">
                       <circle cx="24" cy="24" r="20" stroke="#2a2a2a" strokeWidth="4" fill="none" />
                       <circle cx="24" cy="24" r="20" stroke="#10b981" strokeWidth="4" fill="none" strokeDasharray="125.6" strokeDashoffset="0" className="opacity-80" />
                     </svg>
                  </div>
                  {!isEditMode && <Lock className="absolute top-2 right-2 w-3 h-3 text-[#2a2a2a]" />}
                </div>

                {/* KPI: Active Requests */}
                <div key="kpi-requests" className={`bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] flex items-center justify-between p-4 relative ${isEditMode ? 'cursor-move ring-1 ring-emerald-500/50' : ''}`}>
                  <div className="flex flex-col">
                     <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 font-medium">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Active Requests
                     </div>
                     <div className="text-2xl font-bold text-white">{metrics?.activeRequests || 0}</div>
                     <div className="text-[9px] text-slate-500 mt-0.5">Live connections</div>
                  </div>
                  <div className="w-12 h-12 relative flex items-center justify-center">
                     <svg className="w-12 h-12 transform -rotate-90">
                       <circle cx="24" cy="24" r="20" stroke="#2a2a2a" strokeWidth="4" fill="none" />
                       <circle cx="24" cy="24" r="20" stroke="#3b82f6" strokeWidth="4" fill="none" strokeDasharray="125.6" strokeDashoffset="40" className="opacity-80" />
                     </svg>
                  </div>
                  {!isEditMode && <Lock className="absolute top-2 right-2 w-3 h-3 text-[#2a2a2a]" />}
                </div>

                {/* KPI: Recent Errors */}
                <div key="kpi-errors" className={`bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] flex items-center justify-between p-4 relative ${isEditMode ? 'cursor-move ring-1 ring-emerald-500/50' : ''}`}>
                  <div className="flex flex-col flex-1">
                     <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 font-medium">
                        <Server className="w-4 h-4 text-rose-500" />
                        Recent Errors
                     </div>
                     <div className="text-2xl font-bold text-white">{logs.filter(l => l.logLevel === 'ERROR').length}</div>
                     <div className="mt-2 w-full max-w-[120px] bg-[#2a2a2a] rounded-full h-1 flex overflow-hidden">
                       <div className="bg-rose-500 h-1 rounded-full opacity-80" style={{ width: `${Math.min(100, logs.filter(l => l.logLevel === 'ERROR').length * 5)}%` }}></div>
                     </div>
                  </div>
                  {!isEditMode && <Lock className="absolute top-2 right-2 w-3 h-3 text-[#2a2a2a]" />}
                </div>

                {/* Chart: CPU Utilization */}
                <div key="chart-cpu" className={`bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] flex flex-col p-4 relative ${isEditMode ? 'cursor-move ring-1 ring-emerald-500/50' : ''}`}>
                  <h2 className="text-[10px] font-medium text-slate-400 mb-3 flex items-center gap-2">
                    CPU Utilization
                  </h2>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics?.history || []} margin={{ left: -25, right: 0, top: 5, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                        <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <RTooltip contentStyle={{ backgroundColor: '#141414', borderColor: '#2a2a2a', borderRadius: 6, fontSize: 11, color: '#e2e8f0' }} itemStyle={{ color: '#3b82f6' }} />
                        <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCpu)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart: Memory Utilization */}
                <div key="chart-memory" className={`bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] flex flex-col p-4 relative ${isEditMode ? 'cursor-move ring-1 ring-emerald-500/50' : ''}`}>
                  <h2 className="text-[10px] font-medium text-slate-400 mb-3 flex items-center gap-2">
                    Memory Utilization
                  </h2>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics?.history || []} margin={{ left: -25, right: 0, top: 5, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                        <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <RTooltip contentStyle={{ backgroundColor: '#141414', borderColor: '#2a2a2a', borderRadius: 6, fontSize: 11, color: '#e2e8f0' }} itemStyle={{ color: '#10b981' }} />
                        <Area type="monotone" dataKey="memory" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMem)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart: Network Traffic */}
                <div key="chart-network" className={`bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] flex flex-col p-4 relative ${isEditMode ? 'cursor-move ring-1 ring-emerald-500/50' : ''}`}>
                  <h2 className="text-[10px] font-medium text-slate-400 mb-3 flex items-center gap-2">
                    Network Traffic (Req/s)
                  </h2>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics?.history || []} margin={{ left: -25, right: 0, top: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                        <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <RTooltip contentStyle={{ backgroundColor: '#141414', borderColor: '#2a2a2a', borderRadius: 6, fontSize: 11, color: '#e2e8f0' }} itemStyle={{ color: '#f59e0b' }} />
                        <Line type="monotone" dataKey="requests" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart: Log Volume Histogram */}
                <div key="chart-volume" className={`bg-[#1c1c1c] rounded-xl border border-[#2a2a2a] flex flex-col p-4 relative ${isEditMode ? 'cursor-move ring-1 ring-emerald-500/50' : ''}`}>
                  <h2 className="text-[10px] font-medium text-slate-400 mb-3 flex items-center gap-2">
                    Log Volume (5m buckets)
                  </h2>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={histogramData} margin={{ left: -25, right: 0, top: 5, bottom: 0 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                        <XAxis dataKey="time" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <RTooltip cursor={{fill: '#2a2a2a'}} contentStyle={{ backgroundColor: '#141414', borderColor: '#2a2a2a', borderRadius: 6, fontSize: 11, color: '#e2e8f0' }} />
                        <Bar dataKey="info" stackId="a" fill="#3b82f6" name="Info" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="warn" stackId="a" fill="#f59e0b" name="Warn" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="error" stackId="a" fill="#ef4444" name="Error" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Log Terminal */}
                <div key="log-terminal" className={`bg-[#141414] rounded-xl border border-[#2a2a2a] shadow-lg flex flex-col h-full relative ${isEditMode ? 'cursor-move ring-1 ring-emerald-500/50' : ''}`}>
                  <div className="flex flex-col border-b border-[#2a2a2a] bg-[#1c1c1c] rounded-t-xl">
                    <div className="px-4 py-2.5 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        <h2 className="text-[10px] font-medium text-slate-300">Live Log Stream</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" className="hidden" checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} />
                          <div className={`w-7 h-3.5 rounded-full transition-colors flex items-center px-0.5 ${errorsOnly ? 'bg-rose-500' : 'bg-[#2a2a2a]'}`}>
                            <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${errorsOnly ? 'translate-x-3.5' : 'translate-x-0'}`} />
                          </div>
                          <span className="text-[9px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors">Errors & Warns</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex px-2 gap-1 border-t border-[#2a2a2a] pt-1.5 overflow-x-auto scrollbar-hide bg-[#141414]">
                      <button 
                        onClick={() => setActiveLogTab('UNIFIED')}
                        className={`px-3 py-1.5 text-[9px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeLogTab === 'UNIFIED' ? 'bg-[#1c1c1c] text-white border-t border-x border-[#2a2a2a]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1c1c1c]'}`}
                      >
                        Unified Stream
                      </button>
                      <button 
                        onClick={() => setActiveLogTab('AWS')}
                        className={`px-3 py-1.5 text-[9px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeLogTab === 'AWS' ? 'bg-[#1c1c1c] text-orange-400 border-t border-x border-[#2a2a2a]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1c1c1c]'}`}
                      >
                        AWS
                      </button>
                      <button 
                        onClick={() => setActiveLogTab('OCI')}
                        className={`px-3 py-1.5 text-[9px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeLogTab === 'OCI' ? 'bg-[#1c1c1c] text-red-400 border-t border-x border-[#2a2a2a]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1c1c1c]'}`}
                      >
                        OCI
                      </button>
                      <button 
                        onClick={() => setActiveLogTab('LOKI')}
                        className={`px-3 py-1.5 text-[9px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeLogTab === 'LOKI' ? 'bg-[#1c1c1c] text-blue-400 border-t border-x border-[#2a2a2a]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1c1c1c]'}`}
                      >
                        Metrics (Loki)
                      </button>
                      <button 
                        onClick={() => setActiveLogTab('CICD')}
                        className={`px-3 py-1.5 text-[9px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeLogTab === 'CICD' ? 'bg-[#1c1c1c] text-slate-300 border-t border-x border-[#2a2a2a]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#1c1c1c]'}`}
                      >
                        CI/CD
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 bg-[#141414] rounded-b-xl font-mono text-[10px] leading-relaxed scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-transparent">
                    {filteredLogs.length === 0 ? (
                        <div className="text-slate-600">Waiting for incoming logs...</div>
                    ) : (
                        filteredLogs.map((log) => (
                          <div key={log.logId} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-0.5 hover:bg-[#1c1c1c] px-2 rounded transition-colors group">
                            <span className="text-slate-600 w-16 shrink-0 select-none">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                            </span>
                            
                            <div className="shrink-0 w-10 flex justify-start">
                              {getProviderBadge(log.providerSource)}
                            </div>

                            <span className={`w-10 shrink-0 font-bold ${
                              log.logLevel === 'ERROR' ? 'text-rose-500' :
                              log.logLevel === 'WARN' ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                              {log.logLevel}
                            </span>
                            
                            <span className="text-blue-400 w-28 shrink-0 truncate opacity-80" title={log.sourceService}>
                              {log.sourceService}
                            </span>
                            
                            <span className={`flex-1 break-all ${log.logLevel === 'ERROR' ? 'text-rose-400' : 'text-slate-300'}`}>
                              {log.message}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

             </ResponsiveGridLayout>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
