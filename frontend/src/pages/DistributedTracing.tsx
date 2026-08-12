import React, { useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { Network, Search, Filter, AlertCircle, Clock, ChevronDown, ChevronRight, Activity, Globe, Database } from 'lucide-react';

// Mock OpenTelemetry/Jaeger Trace Data
const MOCK_TRACES = [
  {
    traceId: '3a8f9c21b5e7d4',
    timestamp: new Date().getTime() - 1000 * 60 * 5,
    duration: 845,
    rootService: 'api-gateway',
    endpoint: 'POST /api/v1/cicd/webhooks/github',
    status: 'SUCCESS',
    spans: [
      { id: 's1', parentId: null, service: 'api-gateway', name: 'POST /api/v1/cicd/webhooks/github', duration: 845, startOffset: 0, error: false },
      { id: 's2', parentId: 's1', service: 'auth-service', name: 'validate_jwt_token', duration: 42, startOffset: 15, error: false },
      { id: 's3', parentId: 's1', service: 'core-service', name: 'process_github_webhook', duration: 750, startOffset: 80, error: false },
      { id: 's4', parentId: 's3', service: 'database', name: 'SELECT projects', duration: 125, startOffset: 95, error: false },
      { id: 's5', parentId: 's3', service: 'database', name: 'INSERT pipeline_runs', duration: 210, startOffset: 240, error: false },
      { id: 's6', parentId: 's3', service: 'ci-runner', name: 'trigger_async_build', duration: 300, startOffset: 480, error: false },
    ]
  },
  {
    traceId: '7f2e1a90c4b6d8',
    timestamp: new Date().getTime() - 1000 * 60 * 15,
    duration: 1250,
    rootService: 'api-gateway',
    endpoint: 'GET /api/v1/monitoring/metrics',
    status: 'ERROR',
    spans: [
      { id: 't1', parentId: null, service: 'api-gateway', name: 'GET /api/v1/monitoring/metrics', duration: 1250, startOffset: 0, error: true },
      { id: 't2', parentId: 't1', service: 'auth-service', name: 'validate_jwt_token', duration: 35, startOffset: 10, error: false },
      { id: 't3', parentId: 't1', service: 'observability-service', name: 'fetch_prometheus_metrics', duration: 1180, startOffset: 60, error: true },
      { id: 't4', parentId: 't3', service: 'kubernetes-api', name: 'GET /api/v1/pods', duration: 1050, startOffset: 80, error: true },
    ]
  },
  {
    traceId: '1b5d9e7c3f8a20',
    timestamp: new Date().getTime() - 1000 * 60 * 45,
    duration: 210,
    rootService: 'api-gateway',
    endpoint: 'GET /api/v1/projects',
    status: 'SUCCESS',
    spans: [
      { id: 'p1', parentId: null, service: 'api-gateway', name: 'GET /api/v1/projects', duration: 210, startOffset: 0, error: false },
      { id: 'p2', parentId: 'p1', service: 'auth-service', name: 'validate_jwt_token', duration: 28, startOffset: 12, error: false },
      { id: 'p3', parentId: 'p1', service: 'project-service', name: 'get_all_projects', duration: 155, startOffset: 45, error: false },
      { id: 'p4', parentId: 'p3', service: 'database', name: 'SELECT projects JOIN users', duration: 85, startOffset: 60, error: false },
    ]
  }
];

const getServiceColor = (service: string) => {
  switch (service) {
    case 'api-gateway': return 'bg-cyan-500';
    case 'auth-service': return 'bg-fuchsia-500';
    case 'core-service': return 'bg-indigo-500';
    case 'observability-service': return 'bg-violet-500';
    case 'project-service': return 'bg-blue-500';
    case 'database': return 'bg-emerald-500';
    case 'kubernetes-api': return 'bg-rose-500';
    case 'ci-runner': return 'bg-amber-500';
    default: return 'bg-slate-500';
  }
};

const getServiceIcon = (service: string) => {
  switch (service) {
    case 'database': return <Database className="w-3.5 h-3.5" />;
    case 'api-gateway': return <Globe className="w-3.5 h-3.5" />;
    default: return <Activity className="w-3.5 h-3.5" />;
  }
};

export const DistributedTracing: React.FC = () => {
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(MOCK_TRACES[0].traceId);

  const selectedTrace = MOCK_TRACES.find(t => t.traceId === selectedTraceId);

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1500px] mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Network className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Distributed Tracing</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2">
              End-to-end OpenTelemetry request tracking and latency analysis (Jaeger)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search trace ID..." 
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm w-64"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Trace List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Traces</h2>
            
            {MOCK_TRACES.map((trace) => (
              <div 
                key={trace.traceId}
                onClick={() => setSelectedTraceId(trace.traceId)}
                className={`p-4 rounded-2xl cursor-pointer border transition-all duration-200 ${
                  selectedTraceId === trace.traceId 
                  ? 'bg-indigo-50/80 border-indigo-200 shadow-md transform scale-[1.02]' 
                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="font-mono text-xs font-bold text-slate-700 truncate max-w-[180px]">
                    {trace.endpoint}
                  </div>
                  {trace.status === 'ERROR' ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <AlertCircle className="w-3 h-3" /> ERR
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold shadow-sm">
                      200 OK
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {trace.duration}ms
                  </span>
                  <span>{Math.round((new Date().getTime() - trace.timestamp) / 60000)}m ago</span>
                </div>
                
                <div className="mt-4 flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                  {/* Miniature visualization of spans */}
                  {trace.spans.slice(0, 4).map((span, i) => (
                    <div 
                      key={i} 
                      className={getServiceColor(span.service)} 
                      style={{ width: `${(span.duration / trace.duration) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Trace Waterfall Detail */}
          <div className="lg:col-span-2">
            {selectedTrace ? (
              <div className="glass-panel rounded-2xl p-6 h-full border border-slate-200 shadow-sm animate-fade-in-up">
                
                <div className="flex justify-between items-end border-b border-slate-100 pb-5 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 font-mono mb-1">{selectedTrace.endpoint}</h2>
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                      <span>Trace ID: <span className="font-mono text-indigo-500">{selectedTrace.traceId}</span></span>
                      <span>•</span>
                      <span>{selectedTrace.spans.length} Spans</span>
                      <span>•</span>
                      <span>Total Time: <span className="font-bold text-slate-700">{selectedTrace.duration}ms</span></span>
                    </div>
                  </div>
                </div>

                {/* Waterfall Timeline Header */}
                <div className="relative mb-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-[220px] pb-2 border-b border-slate-100">
                    <span>0ms</span>
                    <span>{Math.round(selectedTrace.duration * 0.5)}ms</span>
                    <span>{selectedTrace.duration}ms</span>
                  </div>
                  
                  {/* Vertical Guidelines */}
                  <div className="absolute top-0 bottom-0 left-[220px] w-px bg-slate-100 -z-10" />
                  <div className="absolute top-0 bottom-0 left-[calc(220px+50%)] w-px bg-slate-100 -z-10" />
                  <div className="absolute top-0 bottom-0 right-0 w-px bg-slate-100 -z-10" />
                  
                  {/* Spans */}
                  <div className="mt-4 space-y-3">
                    {selectedTrace.spans.map((span) => {
                      const leftPercent = (span.startOffset / selectedTrace.duration) * 100;
                      const widthPercent = Math.max((span.duration / selectedTrace.duration) * 100, 1); // min 1% width
                      const indent = span.parentId ? (span.parentId === selectedTrace.spans[0].id ? 1 : 2) : 0;
                      
                      return (
                        <div key={span.id} className="relative flex items-center group">
                          {/* Service/Endpoint Label Area (Fixed width) */}
                          <div 
                            className="w-[220px] shrink-0 pr-4 py-1 flex items-center"
                            style={{ paddingLeft: `${indent * 1.5}rem` }}
                          >
                            {span.parentId && (
                              <div className="w-3 h-px bg-slate-300 mr-2 opacity-50" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {span.error && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                                <span className={`text-[11px] font-bold uppercase tracking-wide truncate ${span.error ? 'text-rose-600' : 'text-slate-600'}`}>
                                  {span.service}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                                {span.name}
                              </div>
                            </div>
                          </div>
                          
                          {/* Waterfall Bar Area (Fluid) */}
                          <div className="flex-1 relative h-6 rounded-md hover:bg-slate-50 transition-colors">
                            <div 
                              className={`absolute top-1/2 -translate-y-1/2 h-3.5 rounded-sm shadow-sm transition-all duration-300 ${
                                span.error ? 'bg-rose-500' : getServiceColor(span.service)
                              }`}
                              style={{ 
                                left: `${leftPercent}%`, 
                                width: `${widthPercent}%` 
                              }}
                            />
                            {/* Hover Tooltip */}
                            <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm pointer-events-none z-10 whitespace-nowrap">
                              {span.duration}ms
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-16 h-full flex flex-col items-center justify-center text-slate-400 border border-slate-200 border-dashed">
                <Network className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a trace to view the distributed waterfall</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </SidebarLayout>
  );
};
