import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Container } from '../services/api';
import { Container as ContainerIcon, Play, Square, RefreshCw, AlertCircle, CheckCircle2, PauseCircle } from 'lucide-react';

export const DockerManagement: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const data = await api.getDockerContainers();
      setContainers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Docker containers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (id: number) => {
    setActionLoading(id);
    try {
      await api.startContainer(id);
      await fetchContainers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (id: number) => {
    setActionLoading(id);
    try {
      await api.stopContainer(id);
      await fetchContainers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async (id: number) => {
    setActionLoading(id);
    try {
      await api.restartContainer(id);
      await fetchContainers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <ContainerIcon className="w-6 h-6 text-[#38BDF8]" />
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Docker management</h1>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Inspect and control container instances mapped to deployment pipelines
            </p>
          </div>
          <button
            onClick={fetchContainers}
            className="px-3.5 py-2 bg-[#0F1B2E] border border-[#1E2D45] hover:bg-[#1E2D45] text-[#F8FAFC] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Refresh containers</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Container Table Card */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#F8FAFC]">Active docker containers ({containers.length})</h2>
            <span className="text-xs font-mono text-[#38BDF8]">Engine: local docker daemon</span>
          </div>

          {loading && containers.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">Scanning Docker containers...</div>
          ) : containers.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm border border-dashed border-[#1E2D45] rounded-lg">
              No active containers mapped. Trigger a project deployment in Projects page to spawn Docker containers.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F8FAFC]">
                <thead className="bg-[#060B18] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#1E2D45]">
                  <tr>
                    <th className="py-3 px-4">Container ID</th>
                    <th className="py-3 px-4">Image name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created at</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {containers.map((c) => {
                    const isRunning = c.containerStatus === 'RUNNING';
                    return (
                      <tr key={c.containerId} className="hover:bg-[#060B18]/50">
                        <td className="py-3.5 px-4 font-mono text-[#38BDF8]">#{c.containerId}</td>
                        <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">{c.imageName}</td>
                        <td className="py-3.5 px-4">
                          {isRunning ? (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>RUNNING</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/60 inline-flex items-center gap-1.5">
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>STOPPED</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#94A3B8]">
                          {new Date(c.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isRunning ? (
                              <button
                                onClick={() => handleStop(c.containerId)}
                                disabled={actionLoading === c.containerId}
                                className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <Square className="w-3 h-3" />
                                <span>Stop</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStart(c.containerId)}
                                disabled={actionLoading === c.containerId}
                                className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                                <span>Start</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleRestart(c.containerId)}
                              disabled={actionLoading === c.containerId}
                              className="px-2.5 py-1 bg-[#1E2D45] hover:bg-[#1E2D45]/80 text-[#38BDF8] text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Restart</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
