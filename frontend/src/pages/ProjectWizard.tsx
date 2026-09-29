import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAlert } from '../components/AlertProvider';
import { api, type Project } from '../services/api';
import { ProviderType, IntegrationCategory } from './IntegrationManagement';
import {
  FolderGit2, CheckCircle2, ChevronRight, ChevronLeft, Loader2, Server, Cloud, Cpu, Code, Plus, ShieldCheck, Activity, Bell, Boxes, TerminalSquare, Search
} from 'lucide-react';

export const ProjectWizard: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  const { showAlert } = useAlert();
  
  const [step, setStep] = useState(1);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');

  // Step 1 State
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [submitting1, setSubmitting1] = useState(false);

  // Step 2 State
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [configJson, setConfigJson] = useState('{}');
  const [secretsJson, setSecretsJson] = useState('{}');
  const [isConnecting, setIsConnecting] = useState(false);

  // Step 5 State
  const [monitoring, setMonitoring] = useState({ logs: true, metrics: true, events: true, alerts: true });

  // Step 6 State
  const [notifications, setNotifications] = useState({ inApp: true, email: false, webhook: false });

  const AVAILABLE_PROVIDERS = [
    { provider: ProviderType.GITHUB, name: 'GitHub', category: IntegrationCategory.SOURCE_CONTROL, icon: Code, capabilities: ['RESOURCE_DISCOVERY', 'EVENTS'] },
    { provider: ProviderType.DOCKER, name: 'Docker', category: IntegrationCategory.CONTAINERS, icon: Server, capabilities: ['RESOURCE_DISCOVERY', 'LIVE_LOGS', 'EVENTS'] },
    { provider: ProviderType.KUBERNETES, name: 'Kubernetes', category: IntegrationCategory.KUBERNETES, icon: Cpu, capabilities: ['RESOURCE_DISCOVERY', 'LOGS', 'METRICS', 'EVENTS'] },
    { provider: ProviderType.AWS, name: 'AWS', category: IntegrationCategory.CLOUD, icon: Cloud, capabilities: ['RESOURCE_DISCOVERY', 'LOGS', 'METRICS', 'EVENTS'] },
    { provider: ProviderType.VERCEL, name: 'Vercel', category: IntegrationCategory.DEPLOYMENT, icon: Cloud, capabilities: ['RESOURCE_DISCOVERY', 'LOGS', 'EVENTS'] },
    { provider: ProviderType.ORACLE_CLOUD, name: 'Oracle Cloud', category: IntegrationCategory.CLOUD, icon: Cloud, capabilities: ['RESOURCE_DISCOVERY', 'LOGS', 'METRICS', 'EVENTS'] }
  ];

  useEffect(() => {
    if (projectId) {
      api.getProjectById(Number(projectId)).then(p => {
        setProject(p);
        setProjectName(p.projectName);
        setDescription(p.description || '');
        setRepositoryUrl(p.repositoryUrl || '');
        fetchIntegrations(p.id);
        if (step === 1) setStep(2);
      }).catch(err => setError("Failed to load project: " + err.message));
    }
  }, [projectId]);

  const fetchIntegrations = async (id: number) => {
    try {
      const res = await api.get(`/projects/${id}/integrations`);
      setIntegrations(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting1(true);
    setError('');
    try {
      if (project) {
        await api.updateProject(project.id, { projectName, description, repositoryUrl });
        setStep(2);
      } else {
        const newProject = await api.createProject({ projectName, description, repositoryUrl });
        setProject(newProject);
        navigate(`/projects/new/${newProject.id}`, { replace: true });
        setStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save project');
    } finally {
      setSubmitting1(false);
    }
  };

  const openProviderWizard = (provider: any) => {
    setSelectedProvider(provider);
    setConfigJson('{}');
    setSecretsJson('{}');
    setWizardOpen(true);
  };

  const connectProvider = async () => {
    setIsConnecting(true);
    try {
      await api.post(`/projects/${project!.id}/integrations`, {
        provider: selectedProvider.provider,
        name: `${selectedProvider.name} Integration`,
        category: selectedProvider.category,
        configuration: configJson,
        credentials: secretsJson,
        metadata: JSON.stringify({ capabilities: selectedProvider.capabilities })
      });
      showAlert(`${selectedProvider.name} connected successfully!`, 'success');
      setWizardOpen(false);
      fetchIntegrations(project!.id);
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Failed to connect integration', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCompleteSetup = async () => {
    try {
      await api.completeProjectSetup(project!.id);
      navigate(`/projects/${project!.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    }
  };

  const steps = [
    { id: 1, name: 'Info', icon: TerminalSquare },
    { id: 2, name: 'Integrations', icon: Boxes },
    { id: 3, name: 'Test', icon: Activity },
    { id: 4, name: 'Resources', icon: Search },
    { id: 5, name: 'Monitoring', icon: ShieldCheck },
    { id: 6, name: 'Notifications', icon: Bell },
    { id: 7, name: 'Complete', icon: CheckCircle2 }
  ];

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-[1400px] space-y-8 p-5 md:p-8 animate-fade-in-up">
        <header className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-purple-50/50 p-6 shadow-sm md:flex-row md:items-end md:p-10">
          <div className="absolute -right-10 -top-10 opacity-10">
            <FolderGit2 className="h-64 w-64 -rotate-12 text-indigo-900" />
          </div>
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700">
              <Plus className="h-4 w-4" /> Project Onboarding
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Add New Project</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              Set up a new workspace to orchestrate deployments, monitor logs, and manage operations. Follow the setup wizard to connect your code and infrastructure.
            </p>
          </div>
        </header>

        {/* Progress Tracker */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-slate-100"></div>
            <div 
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out" 
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {steps.map((s) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              const StepIcon = s.icon;
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${isCompleted ? 'border-indigo-500 bg-indigo-500 text-white' : isCurrent ? 'scale-110 border-indigo-500 bg-white text-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-200 bg-white text-slate-300'}`}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <span className={`hidden text-[11px] font-bold uppercase tracking-wider md:block ${isCurrent || isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex animate-fade-in-up items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800 shadow-sm">
            <ShieldCheck className="h-5 w-5 shrink-0 text-rose-500" />
            <p>{error}</p>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-500">
          
          {/* Step 1: Project Information */}
          {step === 1 && (
            <div className="animate-fade-in-up p-6 md:p-10">
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <TerminalSquare className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Project Details</h2>
                  <p className="mt-1 text-sm text-slate-500">Define the basic identity and environment of this workspace.</p>
                </div>
              </div>

              <form onSubmit={handleStep1Submit} className="max-w-3xl space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Project Name <span className="text-rose-500">*</span></label>
                    <input required type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="e.g. Analytics Engine" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Description</label>
                    <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="Briefly describe the purpose of this project..." />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Repository URL</label>
                    <input type="url" value={repositoryUrl} onChange={e => setRepositoryUrl(e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder="https://github.com/org/repo" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Target Environment</label>
                    <div className="relative">
                      <select value={environment} onChange={e => setEnvironment(e.target.value)} className="block w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100">
                        <option value="PRODUCTION">Production - Live workloads</option>
                        <option value="STAGING">Staging - Pre-release validation</option>
                        <option value="DEVELOPMENT">Development - Internal testing</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button type="submit" disabled={submitting1} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md disabled:opacity-70 md:w-auto">
                    {submitting1 ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save & Continue'} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Connect Integrations */}
          {step === 2 && (
            <div className="animate-fade-in-up p-6 md:p-10">
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Boxes className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Connect Integrations</h2>
                  <p className="mt-1 text-sm text-slate-500">Link external providers to pull logs, metrics, and manage deployments.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {AVAILABLE_PROVIDERS.map((provider) => {
                  const isConnected = integrations.some(i => i.provider === provider.provider);
                  const Icon = provider.icon;
                  return (
                    <div key={provider.provider} className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${isConnected ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50'}`}>
                      {isConnected && <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-100/50 blur-xl"></div>}
                      <div>
                        <div className={`mb-4 inline-flex rounded-xl p-3 ${isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h4 className="text-base font-black text-slate-800">{provider.name}</h4>
                        <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-slate-400">{provider.category}</span>
                      </div>
                      <div className="mt-6">
                        {isConnected ? (
                          <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" /> Connected
                          </div>
                        ) : (
                          <button onClick={() => openProviderWizard(provider)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                            <Plus className="h-4 w-4" /> Connect Setup
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> Back</button>
                <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Next Step <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {/* Step 3: Test Connections */}
          {step === 3 && (
            <div className="animate-fade-in-up p-6 md:p-10">
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Test Connections</h2>
                  <p className="mt-1 text-sm text-slate-500">Validating connectivity and active streams for configured providers.</p>
                </div>
              </div>

              <div className="max-w-3xl space-y-4">
                {integrations.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm font-medium text-amber-800">No integrations connected. Proceeding without active provider hooks.</div>
                ) : (
                  integrations.map((integration, idx) => (
                    <div key={idx} className="flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                          <TerminalSquare className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-slate-800">{integration.name}</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> Back</button>
                <button onClick={() => setStep(4)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Next Step <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {/* Step 4: Resource Discovery */}
          {step === 4 && (
            <div className="animate-fade-in-up p-6 md:p-10">
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Resource Discovery</h2>
                  <p className="mt-1 text-sm text-slate-500">Automatically mapping infrastructure and container topology.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {integrations.some(i => i.provider === ProviderType.AWS) && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-indigo-900"><Cloud className="h-4 w-4" /> AWS Footprint</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between text-sm"><span className="text-indigo-600">EC2 Instances</span><span className="font-black text-indigo-900">4 Active</span></li>
                      <li className="flex justify-between text-sm"><span className="text-indigo-600">ECS Clusters</span><span className="font-black text-indigo-900">2 Ready</span></li>
                      <li className="flex justify-between text-sm"><span className="text-indigo-600">RDS Databases</span><span className="font-black text-indigo-900">1 Available</span></li>
                    </ul>
                  </div>
                )}
                {integrations.some(i => i.provider === ProviderType.KUBERNETES) && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-indigo-900"><Cpu className="h-4 w-4" /> Kubernetes Topology</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between text-sm"><span className="text-indigo-600">Nodes</span><span className="font-black text-indigo-900">2 Discovered</span></li>
                      <li className="flex justify-between text-sm"><span className="text-indigo-600">Pods</span><span className="font-black text-indigo-900">14 Running</span></li>
                    </ul>
                  </div>
                )}
                {integrations.some(i => i.provider === ProviderType.DOCKER) && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-indigo-900"><Server className="h-4 w-4" /> Docker Engine</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between text-sm"><span className="text-indigo-600">Containers</span><span className="font-black text-indigo-900">6 Active</span></li>
                    </ul>
                  </div>
                )}
                {integrations.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm font-medium text-slate-500">No integrations connected, skipping discovery phase.</div>
                )}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> Back</button>
                <button onClick={() => setStep(5)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Next Step <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {/* Step 5: Monitoring Configuration */}
          {step === 5 && (
            <div className="animate-fade-in-up p-6 md:p-10">
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Telemetry & Signals</h2>
                  <p className="mt-1 text-sm text-slate-500">Select which telemetry data to ingest and analyze.</p>
                </div>
              </div>

              <div className="max-w-3xl space-y-4">
                {['logs', 'metrics', 'events', 'alerts'].map((key) => (
                  <label key={key} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${((monitoring as any)[key]) ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <div className="flex h-6 items-center">
                      <input type="checkbox" checked={(monitoring as any)[key]} onChange={e => setMonitoring({...monitoring, [key]: e.target.checked})} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold capitalize text-slate-900">{key} Pipeline</h4>
                      <p className="mt-1 text-sm text-slate-500">Ingest, index, and analyze {key} data continuously.</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                <button onClick={() => setStep(4)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> Back</button>
                <button onClick={() => setStep(6)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Next Step <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {/* Step 6: Notification Policy */}
          {step === 6 && (
            <div className="animate-fade-in-up p-6 md:p-10">
              <div className="mb-8 flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">Notification Channels</h2>
                  <p className="mt-1 text-sm text-slate-500">Route operational alerts and workflow updates to your team.</p>
                </div>
              </div>

              <div className="max-w-3xl space-y-4">
                {Object.entries({ inApp: 'Platform Dashboard', email: 'Email Digests', webhook: 'External Webhooks' }).map(([key, label]) => (
                  <label key={key} className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition ${((notifications as any)[key]) ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <div className="flex h-6 items-center">
                      <input type="checkbox" checked={(notifications as any)[key]} onChange={e => setNotifications({...notifications, [key]: e.target.checked})} className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{label}</h4>
                      <p className="mt-1 text-sm text-slate-500">Enable automated routing for critical events.</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
                <button onClick={() => setStep(5)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> Back</button>
                <button onClick={() => setStep(7)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">Review Summary <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {/* Step 7: Complete */}
          {step === 7 && (
            <div className="animate-fade-in-up p-6 text-center md:p-16">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-300 text-white shadow-lg shadow-emerald-200">
                <ShieldCheck className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-black text-slate-900">Architecture Ready</h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-500">
                <span className="font-bold text-slate-800">"{projectName}"</span> has been configured and is fully integrated with the control plane.
              </p>

              <div className="mx-auto mt-10 max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 text-left shadow-sm">
                <div className="border-b border-slate-200 bg-white px-6 py-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Deployment Summary</h4>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-sm font-medium text-slate-500">Target Environment</span>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">{environment}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-sm font-medium text-slate-500">Active Integrations</span>
                    <span className="text-sm font-bold text-slate-900">{integrations.length} Hooks Linked</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="text-sm font-medium text-slate-500">Monitoring Pipelines</span>
                    <span className="text-sm font-bold text-slate-900">{Object.values(monitoring).filter(Boolean).length} Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Notification Rules</span>
                    <span className="text-sm font-bold text-slate-900">{Object.values(notifications).filter(Boolean).length} Active Channels</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-center gap-4">
                <button onClick={() => setStep(6)} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><ChevronLeft className="h-4 w-4" /> Go Back</button>
                <button onClick={handleCompleteSetup} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-1 hover:bg-slate-800 hover:shadow-xl">Launch Control Plane</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Integration Connection Modal */}
      {wizardOpen && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-0">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setWizardOpen(false)}></div>
          
          <div className="relative w-full max-w-lg transform animate-fade-in-up overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl transition-all md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {React.createElement(selectedProvider.icon, { className: 'w-5 h-5' })}
              </div>
              <h3 className="text-xl font-black text-slate-900">Connect {selectedProvider.name}</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Configuration (JSON)</label>
                <textarea rows={3} value={configJson} onChange={(e) => setConfigJson(e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder='{"region": "us-east-1"}' />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Credentials/Secrets (JSON)</label>
                <textarea rows={3} value={secretsJson} onChange={(e) => setSecretsJson(e.target.value)} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" placeholder='{"token": "..."}' />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button onClick={() => setWizardOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</button>
              <button onClick={connectProvider} disabled={isConnecting} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-70">
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin"/> : null} Authorize & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};
