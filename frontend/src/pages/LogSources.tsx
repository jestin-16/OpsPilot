import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type LogSource } from '../services/api';
import { FileText, Plus, Trash2, Edit3, CheckCircle, XCircle, ArrowLeft, Activity, Play, Database, Triangle, Box, Webhook, FastForward } from 'lucide-react';

export const LogSources: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [sources, setSources] = useState<LogSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [selectedIntegration, setSelectedIntegration] = useState<'VERCEL' | 'SUPABASE' | 'DOCKER' | 'CUSTOM_WEBHOOK' | 'CUSTOM_POLL' | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Form State
  const [sourceName, setSourceName] = useState('');
  const [ingestionMode, setIngestionMode] = useState('WEBHOOK');
  const [fieldMapping, setFieldMapping] = useState('{\n  "message": "$.msg",\n  "logLevel": "$.level",\n  "sourceService": "$.service",\n  "timestamp": "$.time"\n}');
  const [authMethod, setAuthMethod] = useState('NONE');
  const [authConfig, setAuthConfig] = useState('');
  const [pollEndpointUrl, setPollEndpointUrl] = useState('');
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState(60);
  
  // Specific states
  const [supabaseRef, setSupabaseRef] = useState('');
  const [supabaseToken, setSupabaseToken] = useState('');
  const [dockerEndpoint, setDockerEndpoint] = useState('http://localhost:2375/containers/json');

  const fetchSources = async () => {
    try {
      if (projectId) {
        const data = await api.getLogSources(Number(projectId));
        setSources(data);
      }
    } catch (err) {
      console.error('Failed to fetch log sources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [projectId]);

  const handleIntegrationSelect = (type: 'VERCEL' | 'SUPABASE' | 'DOCKER' | 'CUSTOM_WEBHOOK' | 'CUSTOM_POLL') => {
    setSelectedIntegration(type);
    
    if (type === 'VERCEL') {
      setSourceName('Vercel Log Drain');
      setIngestionMode('WEBHOOK');
      setAuthMethod('HEADER_SECRET');
      setAuthConfig(JSON.stringify({ headerName: 'x-vercel-signature', secretValue: 'your_vercel_secret_here' }, null, 2));
      setFieldMapping(JSON.stringify({ message: "$.message", logLevel: "$.level", sourceService: "$.source", timestamp: "$.timestamp" }, null, 2));
    } else if (type === 'SUPABASE') {
      setSourceName('Supabase Logs');
      setIngestionMode('POLL');
      setAuthMethod('BEARER_TOKEN');
      setPollIntervalSeconds(60);
      setFieldMapping(JSON.stringify({ message: "$.event_message", logLevel: "$.metadata.level", sourceService: "$.metadata.project", timestamp: "$.timestamp" }, null, 2));
    } else if (type === 'DOCKER') {
      setSourceName('Docker Engine API');
      setIngestionMode('POLL');
      setAuthMethod('NONE');
      setPollIntervalSeconds(15);
      setFieldMapping(JSON.stringify({ message: "$.Log", logLevel: "$.Stream", sourceService: "$.Container", timestamp: "$.Time" }, null, 2));
    } else if (type === 'CUSTOM_WEBHOOK') {
      setSourceName('');
      setIngestionMode('WEBHOOK');
      setAuthMethod('NONE');
      setFieldMapping('{\n  "message": "$.msg",\n  "logLevel": "$.level",\n  "sourceService": "$.service",\n  "timestamp": "$.time"\n}');
    } else if (type === 'CUSTOM_POLL') {
      setSourceName('');
      setIngestionMode('POLL');
      setAuthMethod('NONE');
      setPollEndpointUrl('');
      setPollIntervalSeconds(60);
      setFieldMapping('{\n  "message": "$.msg",\n  "logLevel": "$.level",\n  "sourceService": "$.service",\n  "timestamp": "$.time"\n}');
    }
    
    setModalStep(2);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalEndpoint = pollEndpointUrl;
      let finalAuthConfig = authConfig;
      
      if (selectedIntegration === 'SUPABASE') {
        finalEndpoint = `https://api.supabase.com/v1/projects/${supabaseRef}/analytics/endpoints/logs.all?project_tier=free`;
        finalAuthConfig = JSON.stringify({ token: supabaseToken });
      } else if (selectedIntegration === 'DOCKER') {
        finalEndpoint = dockerEndpoint;
      }

      await api.createLogSource(Number(projectId), {
        sourceName,
        ingestionMode,
        fieldMapping,
        authMethod,
        authConfig: finalAuthConfig || undefined,
        pollEndpointUrl: finalEndpoint || undefined,
        pollIntervalSeconds,
        isActive: true,
      });
      setIsModalOpen(false);
      fetchSources();
    } catch (err) {
      alert('Failed to save log source');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this log source?')) return;
    try {
      await api.deleteLogSource(id);
      fetchSources();
    } catch (err) {
      alert('Failed to delete log source');
    }
  };

  const handleTestExisting = async (sourceId: number) => {
    const payload = prompt('Enter a JSON payload to test:');
    if (!payload) return;
    try {
      const result = await api.testLogSourceMapping(sourceId, payload);
      setTestResult(result);
    } catch (err: any) {
      alert('Test failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <Link to="/projects" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Integrations Hub</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2 ml-12">
              Connect external tools to stream telemetry directly into Project #{projectId}
            </p>
          </div>
          <button
            onClick={() => { setModalStep(1); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Tool</span>
          </button>
        </div>

        {testResult && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl relative">
            <button onClick={() => setTestResult(null)} className="absolute top-2 right-2 text-emerald-500 hover:text-emerald-700">
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-emerald-800 mb-2">Test Mapping Successful</h3>
            <pre className="text-xs bg-emerald-900/10 text-emerald-900 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading integrations...</div>
        ) : sources.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No integrations configured</h3>
            <p className="text-xs text-slate-500 mt-1">Connect Vercel, Supabase, Docker or custom sources.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sources.map(source => (
              <div key={source.sourceId} className="glass-panel border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleTestExisting(source.sourceId)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                     <Play className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(source.sourceId)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                    source.sourceName.toLowerCase().includes('vercel') ? 'bg-black' :
                    source.sourceName.toLowerCase().includes('supabase') ? 'bg-emerald-500' :
                    source.sourceName.toLowerCase().includes('docker') ? 'bg-blue-600' :
                    source.ingestionMode === 'WEBHOOK' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    {source.sourceName.toLowerCase().includes('vercel') ? <Triangle className="w-4 h-4" /> :
                     source.sourceName.toLowerCase().includes('supabase') ? <Database className="w-4 h-4" /> :
                     source.sourceName.toLowerCase().includes('docker') ? <Box className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{source.sourceName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{source.ingestionMode}</span>
                      <span className={`w-2 h-2 rounded-full ${source.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Auth Method</span>
                    <span>{source.authMethod}</span>
                  </div>
                  {source.ingestionMode === 'WEBHOOK' ? (
                    <div className="flex flex-col gap-1 pt-2 border-t border-slate-200">
                      <span className="text-slate-400">Webhook URL</span>
                      <code className="text-[10px] bg-slate-200 px-2 py-1 rounded text-slate-700 break-all select-all">
                        http://localhost:8080/api/v1/ingest/webhook/{source.sourceId}
                      </code>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Endpoint</span>
                        <span className="truncate max-w-[150px]">{source.pollEndpointUrl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Interval</span>
                        <span>{source.pollIntervalSeconds}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last Polled</span>
                        <span>{source.lastPolledAt ? new Date(source.lastPolledAt).toLocaleString() : 'Never'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-panel rounded-3xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {modalStep === 1 ? 'Choose Integration' : `Configure ${selectedIntegration}`}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {modalStep === 1 ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Vercel */}
                  <div onClick={() => handleIntegrationSelect('VERCEL')} className="border-2 border-slate-100 rounded-xl p-5 hover:border-black cursor-pointer transition-all group">
                    <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center mb-3">
                      <Triangle className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800">Vercel Log Drain</h3>
                    <p className="text-xs text-slate-500 mt-1">Receive NDJSON logs directly from Vercel deployments via Webhook.</p>
                  </div>
                  
                  {/* Supabase */}
                  <div onClick={() => handleIntegrationSelect('SUPABASE')} className="border-2 border-slate-100 rounded-xl p-5 hover:border-emerald-500 cursor-pointer transition-all group">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center mb-3">
                      <Database className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800">Supabase DB</h3>
                    <p className="text-xs text-slate-500 mt-1">Poll the Supabase Management API for Postgres database logs.</p>
                  </div>

                  {/* Docker */}
                  <div onClick={() => handleIntegrationSelect('DOCKER')} className="border-2 border-slate-100 rounded-xl p-5 hover:border-blue-600 cursor-pointer transition-all group">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-3">
                      <Box className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800">Docker Engine</h3>
                    <p className="text-xs text-slate-500 mt-1">Poll the Docker Engine API for container stdout/stderr streams.</p>
                  </div>

                  {/* Custom Webhook */}
                  <div onClick={() => handleIntegrationSelect('CUSTOM_WEBHOOK')} className="border-2 border-slate-100 rounded-xl p-5 hover:border-purple-500 cursor-pointer transition-all group">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800">Custom Webhook</h3>
                    <p className="text-xs text-slate-500 mt-1">Configure a custom HTTP POST listener with custom JSON mapping.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                      <input type="text" required value={sourceName} onChange={e => setSourceName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mode</label>
                      <select disabled value={ingestionMode} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 outline-none">
                        <option value="WEBHOOK">Webhook (Push)</option>
                        <option value="POLL">Polling (Pull)</option>
                      </select>
                    </div>
                  </div>

                  {selectedIntegration === 'SUPABASE' && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Supabase Project Ref</label>
                        <input type="text" required value={supabaseRef} onChange={e => setSupabaseRef(e.target.value)} placeholder="e.g. mxyzptlk..." className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:border-emerald-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Management API Token</label>
                        <input type="password" required value={supabaseToken} onChange={e => setSupabaseToken(e.target.value)} placeholder="sbp_..." className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:border-emerald-500 outline-none" />
                      </div>
                    </div>
                  )}

                  {selectedIntegration === 'DOCKER' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                       <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Docker Daemon Endpoint</label>
                       <input type="text" required value={dockerEndpoint} onChange={e => setDockerEndpoint(e.target.value)} placeholder="http://localhost:2375/containers/json" className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm focus:border-blue-500 outline-none" />
                    </div>
                  )}

                  {(selectedIntegration === 'CUSTOM_POLL') && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Endpoint URL</label>
                        <input type="url" required value={pollEndpointUrl} onChange={e => setPollEndpointUrl(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none" placeholder="https://api.provider.com/logs" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interval (sec)</label>
                        <input type="number" required min={5} value={pollIntervalSeconds} onChange={e => setPollIntervalSeconds(Number(e.target.value))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none" />
                      </div>
                    </div>
                  )}

                  {(selectedIntegration === 'CUSTOM_WEBHOOK' || selectedIntegration === 'VERCEL' || selectedIntegration === 'CUSTOM_POLL') && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Auth Method</label>
                          <select value={authMethod} onChange={e => setAuthMethod(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none">
                            <option value="NONE">None</option>
                            <option value="HEADER_SECRET">Header Secret</option>
                            <option value="BEARER_TOKEN">Bearer Token</option>
                            <option value="BASIC_AUTH">Basic Auth</option>
                          </select>
                        </div>
                        {authMethod !== 'NONE' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Auth Config (JSON)</label>
                            <textarea value={authConfig} onChange={e => setAuthConfig(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:border-indigo-500 outline-none" placeholder={'{"token": "..."}'} required />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Field Mapping (JSONPath)</label>
                        <p className="text-[10px] text-slate-400 mb-2">Map internal OpsPilot fields to JSONPath expressions targeting the incoming payload.</p>
                        <textarea value={fieldMapping} onChange={e => setFieldMapping(e.target.value)} rows={6} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:border-indigo-500 outline-none" required />
                      </div>
                    </>
                  )}

                  {selectedIntegration === 'VERCEL' && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                      <strong>Note:</strong> Once saved, you will receive a Webhook URL on the dashboard. Paste that URL into the <strong>Log Drains</strong> section of your Vercel Project settings.
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setModalStep(1)} className="text-xs font-bold text-slate-500 hover:text-slate-800">
                      &larr; Back
                    </button>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" className="px-5 py-2.5 bg-indigo-500 text-white font-bold text-sm rounded-xl hover:bg-indigo-600 transition-colors">
                        Connect Integration
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
