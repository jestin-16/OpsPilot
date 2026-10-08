import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type DockerSource, type Project } from '../services/api';
import { Box, Plus, Trash2, ArrowLeft, Copy, Eye } from 'lucide-react';
import { useConfirm } from '../components/ConfirmProvider';

export const LogSources: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [sources, setSources] = useState<DockerSource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedConfigSource, setSelectedConfigSource] = useState<DockerSource | null>(null);
  const { confirm } = useConfirm();

  // Form State
  const [sourceName, setSourceName] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const fetchSources = async () => {
    try {
      const data = await api.getDockerSources();
      if (projectId) {
        setSources(data.filter(s => s.projectId === Number(projectId)));
      } else {
        setSources(data);
        const projData = await api.getProjects();
        setProjects(projData);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProjectId = projectId || selectedProjectId;
    if (!finalProjectId) {
      alert("Please select a project.");
      return;
    }
    try {
      const newSource = await api.createDockerSource({
        projectId: Number(finalProjectId),
        name: sourceName,
        environment
      });
      setIsModalOpen(false);
      setSourceName('');
      setEnvironment('production');
      setSelectedProjectId('');
      fetchSources();
      
      // Show config modal immediately for the new source with the real token
      setSelectedConfigSource(newSource);
      setIsConfigModalOpen(true);
    } catch (err) {
      alert('Failed to create log source');
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Delete this host log source?', { isDestructive: true, confirmText: 'Delete' })) return;
    try {
      await api.deleteDockerSource(id);
      fetchSources();
    } catch (err) {
      alert('Failed to delete log source');
    }
  };

  const handleViewConfig = async (id: string) => {
    try {
      const data = await api.getDockerSourceAgentConfig(id);
      setSelectedConfigSource(data);
      setIsConfigModalOpen(true);
    } catch (err) {
      alert('Failed to load agent config');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              {projectId && (
                <Link to="/projects" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Host Log Sources</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2 ml-12">
              {projectId 
                ? `Manage Docker host sources streaming telemetry into Project #${projectId}`
                : "Manage Docker host sources streaming telemetry across all projects"}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-op-accent hover:bg-op-accent-hover text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Host</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading sources...</div>
        ) : sources.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No host sources configured</h3>
            <p className="text-xs text-slate-500 mt-1">Connect your Docker hosts to start streaming logs and metrics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sources.map(source => (
              <div key={source.id} className="glass-panel border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleViewConfig(source.id)} className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(source.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-blue-600">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{source.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{source.environment}</span>
                      {source.status === 'ACTIVE' && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Active</span>}
                      {source.status === 'WAITING' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">Waiting</span>}
                      {source.status === 'STALE' && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">Stale</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Token Prefix</span>
                    <span className="font-mono">{source.tokenPrefix}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created</span>
                    <span>{new Date(source.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Seen</span>
                    <span>{source.lastSeenAt ? new Date(source.lastSeenAt).toLocaleString() : 'Never'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-panel rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Register Docker Host</h2>
              <form onSubmit={handleSave} className="space-y-5">
                {!projectId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project</label>
                    <select
                      required
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-op-accent outline-none"
                    >
                      <option value="" disabled>Select a project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.projectName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Host Name</label>
                  <input type="text" required value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="e.g. prod-db-server" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-op-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Environment</label>
                  <input type="text" required value={environment} onChange={e => setEnvironment(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-op-accent outline-none" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 bg-op-accent text-white font-bold text-sm rounded-xl hover:bg-op-accent-hover transition-colors">
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Config Modal */}
        {isConfigModalOpen && selectedConfigSource && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-panel rounded-3xl w-full max-w-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Agent Configuration</h2>
              {selectedConfigSource.token && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  <strong className="block mb-1">Important!</strong>
                  Your token is <code>{selectedConfigSource.token}</code>. This token is only shown once. Save it securely!
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-700">1. Create config.alloy</h3>
                    <button onClick={() => copyToClipboard(selectedConfigSource.agentConfig || '')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <pre className="text-xs bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto">
                    {selectedConfigSource.agentConfig}
                  </pre>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-700">2. Run with docker-compose.yml</h3>
                    <button onClick={() => copyToClipboard(selectedConfigSource.dockerComposeSnippet || '')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <pre className="text-xs bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto">
                    {selectedConfigSource.dockerComposeSnippet}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button onClick={() => setIsConfigModalOpen(false)} className="px-5 py-2.5 bg-slate-800 text-white font-bold text-sm rounded-xl hover:bg-slate-900 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
