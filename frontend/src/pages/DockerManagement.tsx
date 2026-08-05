import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Container } from '../services/api';
import { Container as ContainerIcon, Play, Square, RotateCw, RefreshCw, AlertCircle } from 'lucide-react';

export const DockerManagement: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchContainers = async () => {
    try {
      const data = await api.getDockerContainers();
      setContainers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch docker containers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: number, action: 'start' | 'stop' | 'restart') => {
    try {
      if (action === 'start') await api.startContainer(id);
      if (action === 'stop') await api.stopContainer(id);
      if (action === 'restart') await api.restartContainer(id);
      await fetchContainers();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} container`);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <ContainerIcon className="w-6 h-6 text-[#4F46E5]" />
              <h1 className="text-2xl font-bold text-[#0F172A]">Docker management</h1>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Inspect active engine containers, manage lifecycle states, and review container tags
            </p>
          </div>
          <button
            onClick={fetchContainers}
            className="px-3.5 py-2 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Refresh containers</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Containers Table Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0F172A]">Active containers ({containers.length})</h2>
            <span className="text-xs font-mono text-[#4F46E5]">Target: Local Docker Host</span>
          </div>

          {loading && containers.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-sm">Querying Docker Daemon...</div>
          ) : containers.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-sm border border-dashed border-[#E2E8F0] rounded-lg">
              No active containers provisioned yet. Trigger a deployment from the Projects page.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#0F172A]">
                <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4">Container ID</th>
                    <th className="py-3 px-4">Image Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {containers.map((c) => (
                    <tr key={c.containerId} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 font-mono text-[#4F46E5]">#ctr-{c.containerId}</td>
                      <td className="py-3.5 px-4 font-mono text-[#0F172A]">{c.imageName}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            c.containerStatus === 'RUNNING'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {c.containerStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {new Date(c.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(c.containerId, 'start')}
                            disabled={c.containerStatus === 'RUNNING'}
                            title="Start container"
                            className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#EEF2FF] text-emerald-600 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => handleAction(c.containerId, 'stop')}
                            disabled={c.containerStatus === 'STOPPED'}
                            title="Stop container"
                            className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-red-50 text-red-600 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => handleAction(c.containerId, 'restart')}
                            title="Restart container"
                            className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-sky-50 text-sky-600 rounded cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
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
