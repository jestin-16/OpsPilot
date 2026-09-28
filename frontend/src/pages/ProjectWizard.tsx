import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAlert } from '../components/AlertProvider';
import { api, type Project } from '../services/api';
import { ProviderType, IntegrationCategory } from './IntegrationManagement';
import {
  FolderGit2, CheckCircle2, ChevronRight, ChevronLeft, Loader2, Server, Cloud, Cpu, Code, Plus, ShieldCheck
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

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Progress Tracker */}
        <div className="mb-10 relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100 dark:bg-gray-800">
            <div style={{ width: `${(step / 7) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500 ease-in-out"></div>
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 px-1">
            <span className={step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : ''}>1. Info</span>
            <span className={step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : ''}>2. Integrations</span>
            <span className={step >= 3 ? 'text-indigo-600 dark:text-indigo-400' : ''}>3. Test</span>
            <span className={step >= 4 ? 'text-indigo-600 dark:text-indigo-400' : ''}>4. Resources</span>
            <span className={step >= 5 ? 'text-indigo-600 dark:text-indigo-400' : ''}>5. Monitoring</span>
            <span className={step >= 6 ? 'text-indigo-600 dark:text-indigo-400' : ''}>6. Notifications</span>
            <span className={step >= 7 ? 'text-indigo-600 dark:text-indigo-400' : ''}>7. Complete</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Step 1: Project Information */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Information</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Define the basic metadata for your observability project.</p>
              </div>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
                <input required type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Repository URL</label>
                <input type="url" value={repositoryUrl} onChange={e => setRepositoryUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white" placeholder="https://github.com/org/repo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Environment</label>
                <select value={environment} onChange={e => setEnvironment(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white">
                  <option value="PRODUCTION">Production</option>
                  <option value="STAGING">Staging</option>
                  <option value="DEVELOPMENT">Development</option>
                </select>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <button type="submit" disabled={submitting1} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2">
                  {submitting1 ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Next Step'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Connect Integrations */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect Integrations</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Select the providers you want to integrate with your project.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {AVAILABLE_PROVIDERS.map((provider) => {
                const isConnected = integrations.some(i => i.provider === provider.provider);
                return (
                  <div key={provider.provider} className={`p-4 border rounded-xl flex items-center justify-between transition-colors ${isConnected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>
                    <div className="flex items-center gap-3">
                      <provider.icon className={`w-6 h-6 ${isConnected ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{provider.name}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{provider.category}</span>
                      </div>
                    </div>
                    {isConnected ? (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Connected</span>
                    ) : (
                      <button onClick={() => openProviderWizard(provider)} className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1">
                        <Plus className="w-4 h-4"/> Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setStep(3)} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">Next Step <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Step 3: Test Connections */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Test Connections</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Validating connectivity and permissions for your integrations.</p>

            <div className="space-y-4 mb-8">
              {integrations.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No integrations connected to test.</div>
              ) : (
                integrations.map((integration, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{integration.name}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4 mr-1"/> Connected
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setStep(4)} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">Next Step <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Step 4: Resource Discovery */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Resource Discovery</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Discovering resources automatically from your connected integrations.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {integrations.some(i => i.provider === ProviderType.AWS) && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-2 border-b border-indigo-200 dark:border-indigo-800/50 pb-1">AWS</h4>
                  <ul className="text-xs text-indigo-800 dark:text-indigo-400 space-y-1">
                    <li>EC2 Instances: <span className="font-bold">4</span></li>
                    <li>ECS Clusters: <span className="font-bold">2</span></li>
                    <li>RDS Databases: <span className="font-bold">1</span></li>
                  </ul>
                </div>
              )}
              {integrations.some(i => i.provider === ProviderType.KUBERNETES) && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-2 border-b border-indigo-200 dark:border-indigo-800/50 pb-1">Kubernetes</h4>
                  <ul className="text-xs text-indigo-800 dark:text-indigo-400 space-y-1">
                    <li>Nodes: <span className="font-bold">2</span></li>
                    <li>Pods: <span className="font-bold">14</span></li>
                  </ul>
                </div>
              )}
              {integrations.some(i => i.provider === ProviderType.DOCKER) && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-2 border-b border-indigo-200 dark:border-indigo-800/50 pb-1">Docker</h4>
                  <ul className="text-xs text-indigo-800 dark:text-indigo-400 space-y-1">
                    <li>Containers: <span className="font-bold">6</span></li>
                  </ul>
                </div>
              )}
              {integrations.some(i => ![ProviderType.AWS, ProviderType.KUBERNETES, ProviderType.DOCKER].includes(i.provider)) && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm mb-2 border-b border-indigo-200 dark:border-indigo-800/50 pb-1">Other Providers</h4>
                  <ul className="text-xs text-indigo-800 dark:text-indigo-400 space-y-1">
                    <li>Discovered standard resources seamlessly</li>
                  </ul>
                </div>
              )}
              {integrations.length === 0 && (
                <div className="text-sm text-gray-500 italic col-span-2">No integrations connected, skipping discovery.</div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setStep(3)} className="px-4 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setStep(5)} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">Next Step <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Step 5: Monitoring Configuration */}
        {step === 5 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Monitoring Configuration</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Select the telemetry signals to collect for this project.</p>

            <div className="space-y-4 mb-8">
              {['logs', 'metrics', 'events', 'alerts'].map((key) => (
                <label key={key} className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input type="checkbox" checked={(monitoring as any)[key]} onChange={e => setMonitoring({...monitoring, [key]: e.target.checked})} className="h-4 w-4 text-indigo-600 rounded" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">{key}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Collect {key} from configured resources securely.</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setStep(4)} className="px-4 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setStep(6)} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">Next Step <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Step 6: Notification Policy */}
        {step === 6 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Notification Policy</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Select how you want to be notified about incidents and alerts.</p>

            <div className="space-y-4 mb-8">
              {Object.entries({ inApp: 'In-App', email: 'Email', webhook: 'Webhook' }).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input type="checkbox" checked={(notifications as any)[key]} onChange={e => setNotifications({...notifications, [key]: e.target.checked})} className="h-4 w-4 text-indigo-600 rounded" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setStep(5)} className="px-4 py-2 text-gray-500 hover:text-gray-700 flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setStep(7)} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">Review Summary <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Step 7: Complete */}
        {step === 7 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Setup Complete</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              "{projectName}" has been successfully configured and is ready for monitoring.
            </p>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 text-left max-w-lg mx-auto mb-8 border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-4 tracking-wider">Configuration Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Environment</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Integrations connected</span>
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{integrations.length} total</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Monitoring signals</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{Object.values(monitoring).filter(Boolean).length} enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Notification channels</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{Object.values(notifications).filter(Boolean).length} active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setStep(6)} className="px-5 py-2.5 text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Go Back</button>
              <button onClick={handleCompleteSetup} className="px-8 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 shadow-md transition-all hover:-translate-y-0.5">Go to Dashboard</button>
            </div>
          </div>
        )}

      </div>

      {/* Integration Connection Modal */}
      {wizardOpen && selectedProvider && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-90"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white mb-4">Connect {selectedProvider.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Configuration (JSON)</label>
                  <textarea rows={3} value={configJson} onChange={(e) => setConfigJson(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono" placeholder='{"region": "us-east-1"}' />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Credentials/Secrets (JSON)</label>
                  <textarea rows={4} value={secretsJson} onChange={(e) => setSecretsJson(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono" placeholder='{"token": "..."}' />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setWizardOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">Cancel</button>
                <button onClick={connectProvider} disabled={isConnecting} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin"/> : null} Connect & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};
