import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Pod } from '../services/api';
import { Boxes, Cpu, HardDrive, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const KubernetesManagement: React.FC = () => {
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPods = async () => {
    setLoading(true);
    try {
      const data = await api.getKubernetesPods();
      setPods(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Kubernetes pods');
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
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Boxes className="w-6 h-6 text-[#38BDF8]" />
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Kubernetes management</h1>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Inspect cluster pods, node scheduling, and runtime resource utilization
            </p>
          </div>
          <button
            onClick={fetchPods}
            className="px-3.5 py-2 bg-[#0F1B2E] border border-[#1E2D45] hover:bg-[#1E2D45] text-[#F8FAFC] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Refresh pods</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pod Table Card */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#F8FAFC]">Active kubernetes pods ({pods.length})</h2>
            <span className="text-xs font-mono text-[#38BDF8]">Cluster: minikube/local</span>
          </div>

          {loading && pods.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">Querying Kubernetes cluster...</div>
          ) : pods.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm border border-dashed border-[#1E2D45] rounded-lg">
              No Kubernetes pods deployed yet. Trigger a project deployment in Projects page to deploy pod instances.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F8FAFC]">
                <thead className="bg-[#060B18] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#1E2D45]">
                  <tr>
                    <th className="py-3 px-4">Pod ID</th>
                    <th className="py-3 px-4">Node name</th>
                    <th className="py-3 px-4">Pod status</th>
                    <th className="py-3 px-4">CPU allocation</th>
                    <th className="py-3 px-4">Memory allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {pods.map((p) => (
                    <tr key={p.podId} className="hover:bg-[#060B18]/50">
                      <td className="py-3.5 px-4 font-mono text-[#38BDF8]">#pod-{p.podId}</td>
                      <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">{p.nodeName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{p.podStatus}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>{p.cpuUsage}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-[#A78BFA]" />
                          <span>{p.memoryUsage}</span>
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
