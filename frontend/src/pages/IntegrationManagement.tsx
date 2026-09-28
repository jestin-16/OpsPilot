import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAlert } from '../components/AlertProvider';
import { api } from '../services/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Server,
  Cloud,
  Cpu,
  Code,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Loader2
} from 'lucide-react';

// Types
export const ProviderType = {
  DOCKER: 'DOCKER',
  KUBERNETES: 'KUBERNETES',
  GITHUB: 'GITHUB',
  AWS: 'AWS',
  VERCEL: 'VERCEL',
  ORACLE_CLOUD: 'ORACLE_CLOUD'
} as const;
export type ProviderType = typeof ProviderType[keyof typeof ProviderType];

export const IntegrationCategory = {
  SOURCE_CONTROL: 'SOURCE_CONTROL',
  CONTAINERS: 'CONTAINERS',
  KUBERNETES: 'KUBERNETES',
  CLOUD: 'CLOUD',
  DEPLOYMENT: 'DEPLOYMENT',
  DATABASE: 'DATABASE',
  MONITORING: 'MONITORING'
} as const;
export type IntegrationCategory = typeof IntegrationCategory[keyof typeof IntegrationCategory];

export const IntegrationStatus = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  ERROR: 'ERROR',
  CONNECTING: 'CONNECTING'
} as const;
export type IntegrationStatus = typeof IntegrationStatus[keyof typeof IntegrationStatus];

export interface Integration {
  id: number;
  projectId: number;
  provider: ProviderType;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  configuration: string;
  lastHealthCheckAt?: string;
  metadata?: string;
}

// Available Providers Map (mocking capabilities/metadata returned by backend as it's not fully provided by API)
const AVAILABLE_PROVIDERS = [
  { provider: ProviderType.GITHUB, name: 'GitHub', category: IntegrationCategory.SOURCE_CONTROL, icon: Code, capabilities: ['RESOURCE_DISCOVERY', 'EVENTS'], description: 'Connect repositories and CI/CD events.' },
  { provider: ProviderType.DOCKER, name: 'Docker', category: IntegrationCategory.CONTAINERS, icon: Server, capabilities: ['RESOURCE_DISCOVERY', 'LIVE_LOGS', 'EVENTS', 'START', 'STOP', 'RESTART'], description: 'Monitor and manage Docker containers.' },
  { provider: ProviderType.KUBERNETES, name: 'Kubernetes', category: IntegrationCategory.KUBERNETES, icon: Cpu, capabilities: ['RESOURCE_DISCOVERY', 'LOGS', 'METRICS', 'EVENTS'], description: 'Connect Kubernetes clusters for comprehensive observability.' },
  { provider: ProviderType.AWS, name: 'AWS', category: IntegrationCategory.CLOUD, icon: Cloud, capabilities: ['RESOURCE_DISCOVERY', 'LOGS', 'METRICS', 'EVENTS'], description: 'Connect AWS EC2, ECS, EKS and CloudWatch.' },
  { provider: ProviderType.VERCEL, name: 'Vercel', category: IntegrationCategory.DEPLOYMENT, icon: Cloud, capabilities: ['RESOURCE_DISCOVERY', 'LOGS', 'EVENTS'], description: 'Monitor Vercel deployments and builds.' },
  { provider: ProviderType.ORACLE_CLOUD, name: 'Oracle Cloud', category: IntegrationCategory.CLOUD, icon: Cloud, capabilities: ['RESOURCE_DISCOVERY', 'LOGS', 'METRICS', 'EVENTS'], description: 'Connect OCI Compute, Logging, and Monitoring.' }
];

export const IntegrationManagement: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { showAlert } = useAlert();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [configJson, setConfigJson] = useState('{}');
  const [secretsJson, setSecretsJson] = useState('{}');
  const [integrationName, setIntegrationName] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, [projectId]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${projectId}/integrations`);
      setIntegrations(res.data);
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Failed to fetch integrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openWizard = (provider: any) => {
    setSelectedProvider(provider);
    setIntegrationName(`${provider.name} Integration`);
    setConfigJson('{}');
    setSecretsJson('{}');
    setStep(1);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setSelectedProvider(null);
    setStep(1);
  };

  const submitWizard = async () => {
    try {
      setIsTesting(true);
      // Construct request
      const request = {
        provider: selectedProvider.provider,
        name: integrationName,
        category: selectedProvider.category,
        configuration: configJson,
        credentials: secretsJson,
        metadata: JSON.stringify({ capabilities: selectedProvider.capabilities })
      };

      await api.post(`/projects/${projectId}/integrations`, request);
      showAlert('Integration connected successfully!', 'success');
      closeWizard();
      fetchIntegrations();
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Failed to connect integration', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!integrationToDelete) return;
    try {
      await api.delete(`/integrations/${integrationToDelete}`);
      showAlert('Integration deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setIntegrationToDelete(null);
      fetchIntegrations();
    } catch (error: any) {
      showAlert(error.response?.data?.error || 'Failed to delete integration', 'error');
    }
  };

  const renderStatus = (status: IntegrationStatus) => {
    switch (status) {
      case IntegrationStatus.CONNECTED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-4 h-4 mr-1"/> Connected</span>;
      case IntegrationStatus.ERROR:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-4 h-4 mr-1"/> Error</span>;
      case IntegrationStatus.DISCONNECTED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"><AlertCircle className="w-4 h-4 mr-1"/> Disconnected</span>;
      case IntegrationStatus.CONNECTING:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Loader2 className="w-4 h-4 mr-1 animate-spin"/> Connecting</span>;
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
              Integration Management
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage providers and connections for this project.
            </p>
          </div>
        </div>

        {/* Connected Integrations Section */}
        <div className="mb-12">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Connected Integrations</h3>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <Server className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No integrations</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by selecting an available provider below.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => {
                const providerDef = AVAILABLE_PROVIDERS.find(p => p.provider === integration.provider);
                const Icon = providerDef?.icon || Server;
                return (
                  <div key={integration.id} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors duration-200">
                    <div className="p-5 flex-1">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              {integration.name}
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900 dark:text-white">
                                {integration.provider}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                          {renderStatus(integration.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Category</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{integration.category}</span>
                        </div>
                        {integration.lastHealthCheckAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Last Checked</span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white">{new Date(integration.lastHealthCheckAt).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Capabilities: {providerDef?.capabilities.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-3 flex justify-between border-t border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-4">
                        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium">Configure</button>
                        <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium">Test</button>
                      </div>
                      <button 
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
                        onClick={() => { setIntegrationToDelete(integration.id); setDeleteConfirmOpen(true); }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Providers Section */}
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Available Integrations</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_PROVIDERS.map((provider) => (
              <div key={provider.provider} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col group cursor-pointer hover:shadow-md transition-shadow" onClick={() => openWizard(provider)}>
                <div className="p-5 flex-1">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <provider.icon className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors" aria-hidden="true" />
                    </div>
                    <div className="ml-5">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{provider.name}</h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{provider.category}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{provider.description}</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex justify-center items-center">
                    <Plus className="w-4 h-4 mr-1" /> Connect {provider.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Generic Wizard Modal */}
      {wizardOpen && selectedProvider && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-90"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-200 dark:border-gray-700">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                  <selectedProvider.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Connect {selectedProvider.name}
                  </h3>
                  <div className="mt-2">
                    {step === 1 && (
                      <div className="space-y-4 text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Step 1: Configuration</p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Integration Name</label>
                          <input type="text" value={integrationName} onChange={(e) => setIntegrationName(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Configuration (JSON)</label>
                          <textarea rows={4} value={configJson} onChange={(e) => setConfigJson(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono" placeholder='{"region": "us-east-1"}' />
                          <p className="mt-1 text-xs text-gray-500">Provide any required configuration like region, clusterName, etc.</p>
                        </div>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="space-y-4 text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Step 2: Credentials</p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Secrets (JSON)</label>
                          <textarea rows={6} value={secretsJson} onChange={(e) => setSecretsJson(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono" placeholder='{"token": "..."}' />
                          <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">Warning: Secrets will be encrypted and will not be readable after submission.</p>
                        </div>
                      </div>
                    )}
                    {step === 3 && (
                      <div className="space-y-4 text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Step 3: Test Connection</p>
                        <p className="text-sm text-gray-900 dark:text-white">Click next to test your credentials securely.</p>
                        {isTesting && (
                          <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-4">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Testing connection...
                          </div>
                        )}
                      </div>
                    )}
                    {step === 4 && (
                      <div className="space-y-4 text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Step 4: Discover & Select Resources</p>
                        <p className="text-sm text-gray-900 dark:text-white">Discovering resources available in this integration...</p>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                          <label className="flex items-center space-x-3">
                            <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Import All Discovered Resources</span>
                          </label>
                        </div>
                      </div>
                    )}
                    {step === 5 && (
                      <div className="space-y-4 text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Step 5: Enable Monitoring</p>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                          <label className="flex items-center space-x-3">
                            <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Enable Log Collection</span>
                          </label>
                          <label className="flex items-center space-x-3 mt-3">
                            <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Enable Metrics Collection</span>
                          </label>
                        </div>
                      </div>
                    )}
                    {step === 6 && (
                      <div className="space-y-4 text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Step 6: Finish</p>
                        <p className="text-sm text-gray-900 dark:text-white">The integration is ready to be saved.</p>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                          <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            <li>Name: {integrationName}</li>
                            <li>Provider: {selectedProvider.name}</li>
                            <li>Monitoring: Enabled</li>
                          </ul>
                        </div>
                        {isTesting && (
                          <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-4">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Finalizing setup...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                {step < 6 ? (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                    onClick={() => {
                      if (step === 3) {
                        setIsTesting(true);
                        setTimeout(() => { setIsTesting(false); setStep(step + 1); }, 1500);
                      } else {
                        setStep(step + 1);
                      }
                    }}
                    disabled={isTesting}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                    onClick={submitWizard}
                    disabled={isTesting}
                  >
                    Connect & Finish
                  </button>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  onClick={step === 1 ? closeWizard : () => setStep(step - 1)}
                  disabled={isTesting}
                >
                  {step === 1 ? 'Cancel' : 'Back'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Disconnect Integration"
        message="Are you sure you want to disconnect this integration? Observability data bound to this integration may stop working."
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
        confirmText="Disconnect"
        isDestructive={true}
      />
    </SidebarLayout>
  );
};
