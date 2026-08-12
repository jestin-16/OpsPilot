import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Pod } from '../services/api';
import { Boxes, RefreshCw, AlertCircle, Cpu, HardDrive } from 'lucide-react';

export const KubernetesManagement: React.FC = () => {
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPods = async () => {
    try {
      const data = await api.getKubernetesPods();
      setPods(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch kubernetes pods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();
    const interval = setInterval(fetchPods, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1500px] mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Boxes className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Kubernetes Management</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Minikube cluster pod allocations, node placement, and container resource limits
            </p>
          </div>
          <button
            onClick={fetchPods}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
            <span>Refresh Pods</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-bold shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pods Table Card */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Cluster Pods <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-xs">{pods.length}</span>
            </h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg shadow-inner">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Cluster: Minikube</span>
            </div>
          </div>

          {loading && pods.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-400" />
              <div className="text-sm font-bold">Querying Kubernetes API Server...</div>
            </div>
          ) : pods.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-800">No Kubernetes pods provisioned</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Trigger a deployment from the Projects page to spawn pods.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner">
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Pod Name</th>
                    <th className="py-4 px-6">Node Name</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">CPU Usage</th>
                    <th className="py-4 px-6">Memory Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pods.map((p) => (
                    <tr key={p.podId} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-mono text-indigo-600 font-bold text-xs bg-indigo-50/50 px-3 py-1.5 rounded-lg inline-block border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                          pod-{p.podId}-{p.nodeName.substring(0, 4)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-slate-700 text-xs font-medium">
                          {p.nodeName}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            p.podStatus === 'Running'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}
                        >
                          {p.podStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-4 h-4 text-sky-500" />
                          <div className="flex-1 max-w-[120px]">
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span>{p.cpuUsage}</span>
                              <span>1000m</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, Math.random() * 40 + 10)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <HardDrive className="w-4 h-4 text-purple-500" />
                          <div className="flex-1 max-w-[120px]">
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                              <span>{p.memoryUsage}</span>
                              <span>2Gi</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, Math.random() * 60 + 20)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
