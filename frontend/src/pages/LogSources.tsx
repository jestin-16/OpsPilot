import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type DockerSource, type Project } from '../services/api';
import { 
  Plus, Trash2, ArrowLeft, Copy, Eye, X, Check, Server, 
  Terminal, Key, AlertCircle, ChevronDown, Activity
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useConfirm } from '../context/ConfirmContext';
import { errorMessage } from '../services/projectApi';

const ENV_PRESETS = [
  { value: 'production', label: 'Production', activeClass: 'bg-emerald-500 text-white shadow-emerald-500/20' },
  { value: 'staging', label: 'Staging', activeClass: 'bg-amber-500 text-white shadow-amber-500/20' },
  { value: 'development', label: 'Development', activeClass: 'bg-blue-500 text-white shadow-blue-500/20' },
];

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ project?: string; name?: string }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Keyboard navigation & body scroll locking for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isConfigModalOpen) setIsConfigModalOpen(false);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };

    if (isModalOpen || isConfigModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, isConfigModalOpen]);

  const fetchSources = useCallback(async () => {
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
  }, [projectId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(prev => (prev === key ? null : prev));
    }, 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProjectId = projectId || selectedProjectId;
    const errors: { project?: string; name?: string } = {};

    if (!finalProjectId) {
      errors.project = 'Please select a project to connect this host.';
    }
    if (!sourceName.trim()) {
      errors.name = 'Please enter a name for this host (e.g. prod-db-server).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const newSource = await api.createDockerSource({
        projectId: Number(finalProjectId),
        name: sourceName.trim(),
        environment
      });
      setIsModalOpen(false);
      setSourceName('');
      setEnvironment('production');
      setSelectedProjectId('');
      await fetchSources();
      
      // Open agent config modal with real token
      setSelectedConfigSource(newSource);
      setIsConfigModalOpen(true);
    } catch (err) {
      alert(errorMessage(err, 'Failed to create log source'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!await confirm(`Delete "${name}"? Existing telemetry streams from this host will disconnect.`, { 
      isDestructive: true, 
      confirmText: 'Delete Host' 
    })) return;

    try {
      await api.deleteDockerSource(id);
      fetchSources();
    } catch (err) {
      alert(errorMessage(err, 'Failed to delete log source'));
    }
  };

  const handleViewConfig = async (id: string) => {
    try {
      const data = await api.getDockerSourceAgentConfig(id);
      setSelectedConfigSource(data);
      setIsConfigModalOpen(true);
    } catch (err) {
      alert(errorMessage(err, 'Failed to load agent config'));
    }
  };

  const activeCount = sources.filter(s => s.status === 'ACTIVE').length;

  return (
    <SidebarLayout>
      <div className="p-6 sm:p-8 max-w-[1240px] mx-auto space-y-8 animate-fade-in-up">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {projectId && (
                <Link 
                  to="/projects" 
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors shadow-xs"
                  title="Back to projects"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              )}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    Host Log Sources
                  </h1>
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-2xl">
              {projectId 
                ? `Manage Docker host telemetry sources streaming into Project #${projectId}`
                : "Manage Docker daemon agents streaming real-time container logs & metrics across your infrastructure"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeCount} Active</span>
              <span className="text-slate-300">•</span>
              <span>{sources.length} Total Hosts</span>
            </div>

            <button
              onClick={() => {
                setFormErrors({});
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Host</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse">
              <Activity className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
            </div>
            <p className="text-sm font-bold text-slate-500 mt-3">Discovering host sources...</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-20 px-6 border-2 border-dashed border-slate-200/90 rounded-3xl bg-slate-50/50 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Server className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Docker hosts connected</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Connect Linux or macOS Docker daemons using a lightweight Alloy container to start streaming logs and real-time observability data.
            </p>
            <button
              onClick={() => {
                setFormErrors({});
                setIsModalOpen(true);
              }}
              className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Register Your First Docker Host</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map(source => (
              <div 
                key={source.id} 
                className="group relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon, Name, Actions */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center transition-colors shadow-xs">
                        <Server className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate" title={source.name}>
                          {source.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            {source.environment}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleViewConfig(source.id)} 
                        title="View agent setup configuration"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(source.id, source.name)} 
                        title="Delete host"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    {source.status === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Stream
                      </span>
                    )}
                    {source.status === 'WAITING' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Waiting for Agent
                      </span>
                    )}
                    {source.status === 'STALE' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Offline / Stale
                      </span>
                    )}
                  </div>

                  {/* Metadata List */}
                  <div className="space-y-2 text-xs font-semibold text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Token Prefix</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 text-[11px]">
                        {source.tokenPrefix}...
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Created</span>
                      <span className="text-slate-700 text-[11px]">
                        {new Date(source.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Last Ping</span>
                      <span className="text-slate-700 text-[11px]">
                        {source.lastSeenAt ? new Date(source.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <button
                  onClick={() => handleViewConfig(source.id)}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Agent Configuration</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PREMIUM MODAL: Register Docker Host                           */}
        {/* ------------------------------------------------------------- */}
        {isModalOpen && createPortal(
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="register-docker-host-title"
          >
            {/* Cinematic Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300" 
              onClick={() => setIsModalOpen(false)} 
              aria-hidden="true" 
            />

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-[0_24px_70px_rgba(15,23,42,0.3)] border border-slate-100 overflow-hidden animate-fade-in-up">
              {/* Header */}
              <div className="bg-gradient-to-b from-slate-50/80 to-white px-7 pt-7 pb-5 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 id="register-docker-host-title" className="text-xl font-black text-slate-900 tracking-tight">
                      Register Docker Host
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Stream logs and telemetry from a Docker instance into OpsPilot
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close dialog"
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form with non-native custom validation */}
              <form onSubmit={handleSave} noValidate className="p-7 space-y-6">
                {/* Project Selector (if not scoped) */}
                {!projectId && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Target Project</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Select workspace</span>
                    </div>

                    <div className="relative">
                      <select
                        value={selectedProjectId}
                        onChange={e => {
                          setSelectedProjectId(e.target.value);
                          if (formErrors.project) {
                            setFormErrors(prev => ({ ...prev, project: undefined }));
                          }
                        }}
                        className={`w-full appearance-none px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none cursor-pointer pr-10 ${
                          formErrors.project 
                            ? 'border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-100' 
                            : 'border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10'
                        }`}
                      >
                        <option value="">Select a project...</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.projectName} {p.environment ? `(${p.environment.toUpperCase()})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {formErrors.project && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1 animate-fade-in-up">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.project}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Host Name Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Host Identifier</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Unique host identifier</span>
                  </div>

                  <input
                    type="text"
                    value={sourceName}
                    onChange={e => {
                      setSourceName(e.target.value);
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: undefined }));
                      }
                    }}
                    placeholder="e.g. prod-db-server or worker-node-01"
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 transition-all outline-none ${
                      formErrors.name 
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-4 focus:ring-rose-100' 
                        : 'border-slate-200 focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10'
                    }`}
                  />

                  {formErrors.name && (
                    <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mt-1 animate-fade-in-up">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* Environment Selector with preset chips */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Deployment Environment
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {ENV_PRESETS.map(preset => {
                      const isActive = environment.toLowerCase() === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setEnvironment(preset.value)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                            isActive 
                              ? `${preset.activeClass} border-transparent shadow-md` 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    value={environment}
                    onChange={e => setEnvironment(e.target.value)}
                    placeholder="or type custom environment..."
                    className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:border-slate-900 outline-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Register Host</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ------------------------------------------------------------- */}
        {/* PREMIUM MODAL: Agent Configuration (Docker Compose & Alloy)   */}
        {/* ------------------------------------------------------------- */}
        {isConfigModalOpen && selectedConfigSource && createPortal(
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="agent-config-title"
          >
            {/* Cinematic Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300" 
              onClick={() => setIsConfigModalOpen(false)} 
              aria-hidden="true" 
            />

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-3xl bg-white rounded-3xl shadow-[0_24px_70px_rgba(15,23,42,0.3)] border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-fade-in-up">
              {/* Header */}
              <div className="bg-gradient-to-b from-slate-50/80 to-white px-7 pt-7 pb-5 border-b border-slate-100 flex items-start justify-between shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 id="agent-config-title" className="text-xl font-black text-slate-900 tracking-tight">
                      Agent Configuration
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Follow these steps on your host machine to start forwarding logs & metrics
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  aria-label="Close configuration"
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-7 overflow-y-auto space-y-6">
                {/* Token Alert Banner (if newly created) */}
                {selectedConfigSource.token && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-900 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs uppercase tracking-wider font-extrabold text-amber-800">
                            One-Time Ingest Token
                          </strong>
                          <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.2 rounded-full font-bold">
                            Save securely
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 mt-1">
                          This token authenticates your Alloy agent with OpsPilot. It will not be shown again.
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <code className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl font-mono text-xs text-amber-900 font-bold select-all flex-1 truncate">
                            {selectedConfigSource.token}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedConfigSource.token!, 'token')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            {copiedKey === 'token' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Token</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Config file */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">1</span>
                      <h3 className="text-sm font-bold text-slate-800">Create <code>config.alloy</code></h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedConfigSource.agentConfig || '', 'alloy')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'alloy' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Config</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative group rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/70 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
                      <span>config.alloy</span>
                      <span className="text-[10px] uppercase font-bold text-indigo-400">Alloy Syntax</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-48 scrollbar-thin">
                      {selectedConfigSource.agentConfig}
                    </pre>
                  </div>
                </div>

                {/* Step 2: Docker Compose */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">2</span>
                      <h3 className="text-sm font-bold text-slate-800">Start with <code>docker-compose.yml</code></h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedConfigSource.dockerComposeSnippet || '', 'compose')}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'compose' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Compose</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative group rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/70 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
                      <span>docker-compose.yml</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400">YAML</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-48 scrollbar-thin">
                      {selectedConfigSource.dockerComposeSnippet}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Done & Return to Hosts
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </SidebarLayout>
  );
};
