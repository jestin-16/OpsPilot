import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api } from '../services/api';
import { 
  Server, Box, Activity, Network, HardDrive, RefreshCw, AlertCircle, X, Terminal
} from 'lucide-react';
import { Card } from '../components/Card';

export const KubernetesDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'pods' | 'services' | 'namespaces'>('overview');
  
  const [overview, setOverview] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [pods, setPods] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [namespaces, setNamespaces] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedPod, setSelectedPod] = useState<any>(null);
  const [podDetails, setPodDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchOverview = async () => {
    try {
      const data = await api.getKubernetesOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load overview');
    }
  };

  const fetchNodes = async () => {
    try {
      setNodes(await api.getKubernetesNodes());
    } catch (err: any) {
      setError(err.message || 'Failed to load nodes');
    }
  };

  const fetchPods = async () => {
    try {
      setPods(await api.getEnhancedPods());
    } catch (err: any) {
      setError(err.message || 'Failed to load pods');
    }
  };

  const fetchServices = async () => {
    try {
      setServices(await api.getKubernetesServices());
    } catch (err: any) {
      setError(err.message || 'Failed to load services');
    }
  };

  const fetchNamespaces = async () => {
    try {
      setNamespaces(await api.getKubernetesNamespaces());
    } catch (err: any) {
      setError(err.message || 'Failed to load namespaces');
    }
  };

  const loadData = async (tab: string) => {
    setLoading(true);
    setError('');
    
    if (tab === 'overview') await fetchOverview();
    else if (tab === 'nodes') await fetchNodes();
    else if (tab === 'pods') await fetchPods();
    else if (tab === 'services') await fetchServices();
    else if (tab === 'namespaces') await fetchNamespaces();
    
    setLoading(false);
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handlePodSelect = async (pod: any) => {
    setSelectedPod(pod);
    setLoadingDetails(true);
    try {
      const details = await api.getKubernetesPodDetails(pod.namespace, pod.name);
      setPodDetails(details);
    } catch (err: any) {
      console.error('Failed to load pod details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'running' || s === 'ready' || s === 'active') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (s === 'failed' || s === 'notready' || s === 'error') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (s === 'pending') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  };

  return (
    <SidebarLayout>
      <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-op-surface">
        
        {/* Main Area */}
        <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${selectedPod ? 'pr-[500px]' : ''}`}>
          <div className="p-8 border-b border-op-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-op-fg flex items-center gap-3">
                  <Server className="w-6 h-6 text-op-accent" /> Kubernetes Management
                </h1>
                <p className="text-sm font-medium text-op-muted mt-1">
                  Cluster monitoring, workloads, and operational insights.
                </p>
              </div>
              <button
                onClick={() => loadData(activeTab)}
                className="px-4 py-2 bg-op-raised hover:bg-op-border text-op-fg text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-op-border">
              {[
                { id: 'overview', icon: Activity, label: 'Overview' },
                { id: 'nodes', icon: HardDrive, label: 'Nodes' },
                { id: 'pods', icon: Box, label: 'Pods' },
                { id: 'services', icon: Network, label: 'Services' },
                { id: 'namespaces', icon: Server, label: 'Namespaces' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm transition-colors ${
                    activeTab === tab.id 
                      ? 'border-op-accent text-op-accent' 
                      : 'border-transparent text-op-muted hover:text-op-fg hover:border-op-border'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-rose-500 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20 text-op-muted">Loading data...</div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && overview && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                      <div className="text-sm font-bold text-op-muted uppercase tracking-wider mb-2">Cluster Status</div>
                      <div className="text-3xl font-bold text-op-fg flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${overview.status === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        {overview.status}
                      </div>
                    </Card>
                    <Card className="p-6">
                      <div className="text-sm font-bold text-op-muted uppercase tracking-wider mb-2">Nodes</div>
                      <div className="text-3xl font-bold text-op-fg">{overview.nodeCount}</div>
                    </Card>
                    <Card className="p-6">
                      <div className="text-sm font-bold text-op-muted uppercase tracking-wider mb-2">Total Pods</div>
                      <div className="text-3xl font-bold text-op-fg">{overview.podCount}</div>
                    </Card>
                    <Card className="p-6">
                      <div className="text-sm font-bold text-op-muted uppercase tracking-wider mb-2">Pod Health</div>
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-emerald-500">{overview.runningPods}</span>
                          <span className="text-xs text-op-muted uppercase font-bold">Running</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-rose-500">{overview.failedPods}</span>
                          <span className="text-xs text-op-muted uppercase font-bold">Failed/Unknown</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Nodes Tab */}
                {activeTab === 'nodes' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-op-fg">
                      <thead className="bg-op-raised text-op-muted uppercase text-xs font-bold tracking-wider border-b border-op-border">
                        <tr>
                          <th className="py-4 px-5">Name</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5">Role</th>
                          <th className="py-4 px-5">Version</th>
                          <th className="py-4 px-5">Age</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-op-border">
                        {nodes.map((node, i) => (
                          <tr key={i} className="hover:bg-op-raised/50">
                            <td className="py-3 px-5 font-bold">{node.name}</td>
                            <td className="py-3 px-5">
                              <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(node.status)}`}>{node.status}</span>
                            </td>
                            <td className="py-3 px-5">{node.role}</td>
                            <td className="py-3 px-5">{node.version}</td>
                            <td className="py-3 px-5 text-op-muted">{new Date(node.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pods Tab */}
                {activeTab === 'pods' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-op-fg">
                      <thead className="bg-op-raised text-op-muted uppercase text-xs font-bold tracking-wider border-b border-op-border">
                        <tr>
                          <th className="py-4 px-5">Name</th>
                          <th className="py-4 px-5">Namespace</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5">Restarts</th>
                          <th className="py-4 px-5">Node</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-op-border">
                        {pods.map((pod, i) => (
                          <tr key={i} onClick={() => handlePodSelect(pod)} className={`cursor-pointer hover:bg-op-raised/50 ${selectedPod?.name === pod.name ? 'bg-op-raised' : ''}`}>
                            <td className="py-3 px-5 font-bold">{pod.name}</td>
                            <td className="py-3 px-5 text-op-muted">{pod.namespace}</td>
                            <td className="py-3 px-5">
                              <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(pod.status)}`}>{pod.status}</span>
                            </td>
                            <td className="py-3 px-5">{pod.restartCount}</td>
                            <td className="py-3 px-5 text-op-muted">{pod.node}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-op-fg">
                      <thead className="bg-op-raised text-op-muted uppercase text-xs font-bold tracking-wider border-b border-op-border">
                        <tr>
                          <th className="py-4 px-5">Name</th>
                          <th className="py-4 px-5">Namespace</th>
                          <th className="py-4 px-5">Type</th>
                          <th className="py-4 px-5">Cluster IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-op-border">
                        {services.map((svc, i) => (
                          <tr key={i} className="hover:bg-op-raised/50">
                            <td className="py-3 px-5 font-bold">{svc.name}</td>
                            <td className="py-3 px-5 text-op-muted">{svc.namespace}</td>
                            <td className="py-3 px-5">{svc.type}</td>
                            <td className="py-3 px-5 font-mono">{svc.clusterIP}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Namespaces Tab */}
                {activeTab === 'namespaces' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-op-fg">
                      <thead className="bg-op-raised text-op-muted uppercase text-xs font-bold tracking-wider border-b border-op-border">
                        <tr>
                          <th className="py-4 px-5">Name</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-op-border">
                        {namespaces.map((ns, i) => (
                          <tr key={i} className="hover:bg-op-raised/50">
                            <td className="py-3 px-5 font-bold">{ns.name}</td>
                            <td className="py-3 px-5">
                              <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(ns.status)}`}>{ns.status}</span>
                            </td>
                            <td className="py-3 px-5 text-op-muted">{new Date(ns.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Pod Details Sidebar */}
        <div className={`fixed right-0 top-16 bottom-0 w-[500px] bg-[#121214] border-l border-op-border shadow-2xl transition-transform duration-300 transform ${selectedPod ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto z-20 flex flex-col text-op-fg`}>
          {selectedPod && (
            <>
              <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#121214] z-10">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Box className="w-5 h-5 text-op-accent" /> {selectedPod.name}
                  </h3>
                  <div className="text-xs text-op-muted mt-1 font-mono">{selectedPod.namespace}</div>
                </div>
                <button onClick={() => setSelectedPod(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-op-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 flex-1">
                {loadingDetails ? (
                  <div className="text-op-muted text-sm flex items-center justify-center py-10">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading details...
                  </div>
                ) : podDetails ? (
                  <div className="space-y-8">
                    {/* Status & Restart */}
                    <div className="flex gap-4 items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedPod.status)}`}>{selectedPod.status}</span>
                      <div className="text-sm">
                        <span className="text-op-muted mr-2">Restarts:</span>
                        <span className="font-bold">{podDetails.restartCount}</span>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-op-muted mb-3">Metadata</h4>
                      <div className="bg-black/30 p-4 rounded-xl text-sm border border-white/5 space-y-3">
                        <div className="grid grid-cols-3">
                          <span className="text-op-muted">Pod IP</span>
                          <span className="col-span-2 font-mono text-emerald-400">{podDetails.status?.podIP || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-op-muted">Node</span>
                          <span className="col-span-2">{podDetails.spec?.nodeName || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-op-muted">Start Time</span>
                          <span className="col-span-2">{podDetails.status?.startTime ? new Date(podDetails.status.startTime).toLocaleString() : '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Containers */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-op-muted mb-3">Containers</h4>
                      {podDetails.spec?.containers?.map((c: any, i: number) => (
                        <div key={i} className="bg-black/30 p-4 rounded-xl text-sm border border-white/5 mb-3">
                          <div className="font-bold mb-1">{c.name}</div>
                          <div className="text-xs text-op-muted font-mono break-all">{c.image}</div>
                        </div>
                      ))}
                    </div>

                    {/* Logs */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-op-muted mb-3 flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Latest Logs
                      </h4>
                      <div className="bg-black border border-white/10 p-4 rounded-xl text-xs font-mono text-slate-300 max-h-64 overflow-y-auto whitespace-pre-wrap">
                        {podDetails.logs || 'No logs available.'}
                      </div>
                    </div>

                    {/* Events */}
                    {podDetails.events && podDetails.events.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-op-muted mb-3">Recent Events</h4>
                        <div className="space-y-2">
                          {podDetails.events.map((e: any, i: number) => (
                            <div key={i} className="bg-black/30 p-3 rounded-xl border border-white/5 text-xs">
                              <div className="flex justify-between mb-1">
                                <span className={`font-bold ${e.type === 'Warning' ? 'text-rose-400' : 'text-emerald-400'}`}>{e.reason}</span>
                                <span className="text-op-muted">{new Date(e.lastTimestamp).toLocaleString()}</span>
                              </div>
                              <div className="text-slate-400">{e.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-op-muted text-sm">Failed to load details.</div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </SidebarLayout>
  );
};
