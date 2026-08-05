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
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Boxes className="w-6 h-6 text-[#4F46E5]" />
              <h1 className="text-2xl font-bold text-[#0F172A]">Kubernetes management</h1>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Minikube cluster pod allocations, node placement, and container resource limits
            </p>
          </div>
          <button
            onClick={fetchPods}
            className="px-3.5 py-2 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Refresh pods</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pods Table Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0F172A]">Cluster pods ({pods.length})</h2>
            <span className="text-xs font-mono text-[#4F46E5]">Cluster: Minikube (Local Target)</span>
          </div>

          {loading && pods.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-sm">Querying Kubernetes API Server...</div>
          ) : pods.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-sm border border-dashed border-[#E2E8F0] rounded-lg">
              No Kubernetes pods provisioned yet. Trigger a deployment from the Projects page.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#0F172A]">
                <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4">Pod Name</th>
                    <th className="py-3 px-4">Node Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">CPU Usage</th>
                    <th className="py-3 px-4">Memory Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {pods.map((p) => (
                    <tr key={p.podId} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 font-mono text-[#4F46E5]">pod-{p.podId}-{p.nodeName}</td>
                      <td className="py-3.5 px-4 font-mono text-[#0F172A]">{p.nodeName}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            p.podStatus === 'Running'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.podStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#0F172A] flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>{p.cpuUsage}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#0F172A]">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-[#7C3AED]" />
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
