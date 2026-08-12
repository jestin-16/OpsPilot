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
      <div className="p-8 max-w-[1500px] mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <ContainerIcon className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Docker Engine</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Inspect active engine containers, manage lifecycle states, and review container tags
            </p>
          </div>
          <button
            onClick={fetchContainers}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : 'text-slate-400'}`} />
            <span>Refresh Containers</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-bold shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Containers Table Card */}
        <div className="glass-panel rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Active Containers <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-xs">{containers.length}</span>
            </h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-lg shadow-inner">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Host: Local Docker Daemon</span>
            </div>
          </div>

          {loading && containers.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-sky-400" />
              <div className="text-sm font-bold">Querying Docker Daemon...</div>
            </div>
          ) : containers.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <ContainerIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-800">No active containers provisioned</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Trigger a deployment from the Projects page to build and run containers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner">
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Container ID</th>
                    <th className="py-4 px-6">Image Name</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Created At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {containers.map((c) => (
                    <tr key={c.containerId} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-mono text-cyan-600 font-bold text-xs bg-cyan-50/50 px-3 py-1.5 rounded-lg inline-block border border-cyan-100 group-hover:bg-cyan-100 transition-colors">
                          #ctr-{c.containerId.toString().substring(0, 8)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-mono text-slate-700 text-xs font-medium">
                          {c.imageName}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            c.containerStatus === 'RUNNING'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {c.containerStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs font-medium">
                        {new Date(c.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(c.containerId, 'start')}
                            disabled={c.containerStatus === 'RUNNING'}
                            title="Start container"
                            className="p-2 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-500 rounded-xl cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                          <button
                            onClick={() => handleAction(c.containerId, 'stop')}
                            disabled={c.containerStatus === 'STOPPED'}
                            title="Stop container"
                            className="p-2 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-500 rounded-xl cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
                          >
                            <Square className="w-4 h-4 fill-current" />
                          </button>
                          <button
                            onClick={() => handleAction(c.containerId, 'restart')}
                            title="Restart container"
                            className="p-2 bg-white border border-slate-200 hover:bg-sky-50 hover:border-sky-200 text-sky-500 rounded-xl cursor-pointer shadow-sm transition-colors"
                          >
                            <RotateCw className="w-4 h-4" />
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
