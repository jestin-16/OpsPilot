import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, API_BASE_URL, type Project } from '../services/api';
import { FolderGit2, CheckCircle2, ChevronRight, ChevronLeft, Loader2, Code, Webhook, FastForward, X } from 'lucide-react';

export const ProjectWizard: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  
  const [step, setStep] = useState(1);
  const [project, setProject] = useState<Project | null>(null);
  const [createdInWizard, setCreatedInWizard] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Step 1 State
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [submitting1, setSubmitting1] = useState(false);
  const [error, setError] = useState('');

  // Step 2 State
  const [webhookInfo, setWebhookInfo] = useState<{ webhookUrl?: string; secret?: string; publicId?: string; sourceId?: number } | null>(null);
  const [polling, setPolling] = useState(false);
  const [hasReceivedFirstEvent, setHasReceivedFirstEvent] = useState(false);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'SDK' | 'WEBHOOK' | 'SKIP' | null>(null);
  const [timeoutMsg, setTimeoutMsg] = useState('');

  useEffect(() => {
    if (projectId) {
      api.getProjectById(Number(projectId)).then(p => {
        setProject(p);
        setProjectName(p.projectName);
        setDescription(p.description || '');
        setRepositoryUrl(p.repositoryUrl || '');
        
        // Determine step based on URL if we want, but let's just use local state for now
        // if we are here and have a projectId, we are at least on step 2 unless we want to edit.
        if (step === 1) setStep(2);
      }).catch(err => {
        setError("Failed to load project: " + err.message);
      });
    }
  }, [projectId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    if (polling && webhookInfo?.sourceId && !hasReceivedFirstEvent) {
      interval = setInterval(async () => {
        try {
          const status = await api.getLogSourceStatus(webhookInfo.sourceId!);
          if (status.hasReceivedFirstEvent) {
            setHasReceivedFirstEvent(true);
            setPolling(false);
          }
        } catch (e) {}
      }, 2000);

      timeout = setTimeout(() => {
        setPolling(false);
        setTimeoutMsg('Waiting for event timed out after 60s. You can proceed anyway.');
      }, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [polling, webhookInfo, hasReceivedFirstEvent]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting1(true);
    setError('');
    try {
      if (project) {
        // Update
        await api.updateProject(project.id, { projectName, description, repositoryUrl });
        setStep(2);
      } else {
        // Create
        const newProject = await api.createProject({ projectName, description, repositoryUrl });
        setProject(newProject);
        setCreatedInWizard(true);
        navigate(`/projects/new/${newProject.id}`, { replace: true });
        setStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save project basics');
    } finally {
      setSubmitting1(false);
    }
  };

  const handleSetupLogSource = async (mode: 'WEBHOOK' | 'SKIP', option: 'SDK' | 'WEBHOOK' | 'SKIP') => {
    setSelectedOption(option);
    setError('');
    
    if (mode === 'SKIP') {
      setStep(3);
      return;
    }

    setCreatingWebhook(true);
    try {
      const res = await api.createLogSource(project!.id, {
        sourceName: 'Default Integration',
        ingestionMode: mode,
        fieldMapping: '{}',
        isActive: true
      });
      // The backend returns an object with { webhookUrl, secret, sourceId } for WEBHOOK
      setWebhookInfo(res as any);
      if (option === 'SDK') {
        setPolling(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to setup log source');
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleCompleteSetup = async () => {
    try {
      await api.completeProjectSetup(project!.id);
      navigate('/projects');
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    }
  };

  const handleCancel = async () => {
    setPolling(false);
    setCreatingWebhook(false);

    if (!createdInWizard || !project) {
      navigate('/projects');
      return;
    }

    setCancelling(true);
    setError('');
    try {
      await api.deleteProject(project.id);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel project setup');
    } finally {
      setCancelling(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      return;
    }

    if (webhookInfo) {
      setWebhookInfo(null);
      setPolling(false);
      setHasReceivedFirstEvent(false);
      setTimeoutMsg('');
      return;
    }

    setStep(1);
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1000px] mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Add New Project</h1>
        </div>

        {/* Wizard Progress */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
          
          {[1, 2, 3].map(s => (
            <div key={s} className="flex flex-col items-center gap-2 bg-white px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                step > s ? 'bg-indigo-500 border-indigo-500 text-white' : 
                step === s ? 'bg-white border-indigo-500 text-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                step >= s ? 'text-indigo-600' : 'text-slate-400'
              }`}>
                {s === 1 ? 'Basics' : s === 2 ? 'Connect' : 'Confirm'}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="glass-panel rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Project Basics</h2>
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Authentication Service"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Repository URL <span className="text-slate-400 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/opspilot/auth-service"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Description <span className="text-slate-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of application component..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting1 || cancelling}
                  className="px-4 py-2.5 text-slate-500 hover:text-rose-600 text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting1 || cancelling}
                  className="px-6 py-3 bg-indigo-500 text-white font-bold text-sm rounded-xl hover:bg-indigo-600 shadow-md transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting1 ? 'Saving...' : 'Next Step'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Connect Observability */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Connect Observability</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Choose how you want to send telemetry data to OpsPilot for this project.
            </p>

            {!webhookInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Install SDK Card */}
                <div 
                  onClick={() => handleSetupLogSource('WEBHOOK', 'SDK')}
                  className="glass-panel rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold px-2 py-1 uppercase rounded-bl-lg">Recommended</div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Code className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Install SDK</h3>
                  <p className="text-xs text-slate-500 font-medium">Native integration for Node.js, Python, or Go with auto-instrumentation.</p>
                </div>

                {/* Custom Webhook Card */}
                <div 
                  onClick={() => handleSetupLogSource('WEBHOOK', 'WEBHOOK')}
                  className="glass-panel rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-purple-300 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Webhook className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Custom Webhook</h3>
                  <p className="text-xs text-slate-500 font-medium">Send JSON payloads directly to a secure HTTPS endpoint.</p>
                </div>

                {/* Skip for now Card */}
                <div 
                  onClick={() => handleSetupLogSource('SKIP', 'SKIP')}
                  className="glass-panel rounded-2xl p-6 cursor-pointer border-2 border-transparent hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FastForward className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">Skip for now</h3>
                  <p className="text-xs text-slate-500 font-medium">Proceed without configuring a log source. You can set this up later.</p>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedOption === 'SDK' ? 'SDK Installation' : 'Webhook Integration'}
                  </h3>
                  <button onClick={() => { setWebhookInfo(null); setPolling(false); }} className="text-xs text-indigo-500 font-bold hover:underline">
                    Back to options
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Webhook URL</p>
                  <code className="text-sm font-mono text-indigo-600 break-all bg-indigo-50 px-2 py-1 rounded">
                    {API_BASE_URL.replace(/\/api\/v1$/, '')}{webhookInfo.webhookUrl}
                  </code>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 flex justify-between">
                    <span>Secret Key</span>
                    <span className="text-rose-500 lowercase normal-case text-[10px]">Copy this now. It won't be shown again.</span>
                  </p>
                  <code className="text-sm font-mono text-slate-800 break-all bg-white border border-slate-200 px-2 py-1 rounded select-all">
                    {webhookInfo.secret}
                  </code>
                </div>

                {selectedOption === 'SDK' && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-600">Install the OpsPilot SDK in your project:</p>
                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-emerald-400">npm install @opspilot/node-sdk</pre>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto mt-2">
                      <pre className="text-xs font-mono text-slate-300">
<span className="text-purple-400">import</span> {'{ OpsPilot }'} <span className="text-purple-400">from</span> <span className="text-emerald-300">'@opspilot/node-sdk'</span>;<br/><br/>
<span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-amber-300">OpsPilot</span>({'{'}<br/>
{'  '}endpoint: <span className="text-emerald-300">'{API_BASE_URL.replace(/\/api\/v1$/, '')}{webhookInfo.webhookUrl}'</span>,<br/>
{'  '}secret: <span className="text-emerald-300">'{webhookInfo.secret}'</span><br/>
{'}'});<br/><br/>
client.<span className="text-blue-400">log</span>(<span className="text-emerald-300">'INFO'</span>, <span className="text-emerald-300">'Application started successfully'</span>);
                      </pre>
                    </div>

                    <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {polling ? (
                          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        ) : hasReceivedFirstEvent ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-amber-500 text-amber-500 flex items-center justify-center font-bold text-[10px]">!</div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {hasReceivedFirstEvent ? 'Connection Successful' : polling ? 'Waiting for first event...' : 'Polling timed out'}
                          </p>
                          {timeoutMsg && !hasReceivedFirstEvent && <p className="text-xs text-amber-600 font-medium">{timeoutMsg}</p>}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setStep(3)}
                        disabled={!hasReceivedFirstEvent && polling}
                        className="px-5 py-2 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {selectedOption === 'WEBHOOK' && (
                  <div className="space-y-4">
                     <p className="text-sm font-medium text-slate-600">Send an HTTP POST request to the Webhook URL with your secret in the header:</p>
                     <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-slate-300">
POST {webhookInfo.webhookUrl}<br/>
Content-Type: application/json<br/>
x-webhook-secret: {webhookInfo.secret}<br/><br/>
{'{'}<br/>
{'  "sourceService": "my-app",'}<br/>
{'  "logLevel": "INFO",'}<br/>
{'  "message": "Hello OpsPilot"'}<br/>
{'}'}
                      </pre>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                      <button 
                        onClick={() => setStep(3)}
                        className="px-6 py-3 bg-indigo-500 text-white font-bold text-sm rounded-xl hover:bg-indigo-600 shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        Next Step <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={creatingWebhook || polling}
                className="px-4 py-2.5 text-slate-500 hover:text-indigo-600 text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2.5 text-slate-500 hover:text-rose-600 text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="glass-panel rounded-3xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Project Setup Complete!</h2>
            <p className="text-slate-500 font-medium mb-8">
              "{project?.projectName}" has been successfully configured and is ready.
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 text-left max-w-md mx-auto mb-8 border border-slate-100">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-wider">Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Project ID</span>
                  <span className="font-mono text-sm text-slate-800">#{project?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Integration</span>
                  <span className="font-bold text-sm text-indigo-600">{selectedOption || 'Skipped'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Status</span>
                  <span className="text-sm px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold text-[10px] uppercase">Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3.5 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="px-5 py-3.5 text-slate-500 hover:text-rose-600 font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSetup}
                className="px-8 py-3.5 bg-indigo-500 text-white font-bold text-sm rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </SidebarLayout>
  );
};
