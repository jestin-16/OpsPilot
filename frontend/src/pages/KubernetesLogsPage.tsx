import React, { useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { LogViewer } from '../components/kubernetes/LogViewer';
import { PodStatusPanel } from '../components/kubernetes/PodStatusPanel';
import {
  Terminal,
  Activity,
  Layers
} from 'lucide-react';

export const KubernetesLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stream' | 'status' | 'split'>('split');
  const [selectedPod, setSelectedPod] = useState<string>('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('default');

  const handleSelectPodFromStatus = (podName: string, namespace: string) => {
    setSelectedPod(podName);
    setSelectedNamespace(namespace);
    setActiveTab('stream');
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 bg-[#080A0F] text-slate-100">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Kubernetes Log Watcher & Monitoring
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time pod event detection, backpressure-protected SSE log streaming, and CrashLoopBackOff diagnostics
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 bg-[#11141E] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'split'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>

            <button
              onClick={() => setActiveTab('stream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'stream'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Live Log Stream</span>
            </button>

            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'status'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Pod Health & Signals</span>
            </button>
          </div>
        </div>

        {/* Dynamic View Content */}
        {activeTab === 'status' && (
          <div className="animate-in fade-in duration-200">
            <PodStatusPanel
              onSelectPod={handleSelectPodFromStatus}
              selectedPodName={selectedPod}
            />
          </div>
        )}

        {activeTab === 'stream' && (
          <div className="h-[750px] animate-in fade-in duration-200">
            <LogViewer
              initialPod={selectedPod}
              initialNamespace={selectedNamespace}
            />
          </div>
        )}

        {activeTab === 'split' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Upper: Pod Health Status */}
            <PodStatusPanel
              onSelectPod={handleSelectPodFromStatus}
              selectedPodName={selectedPod}
            />

            {/* Lower: Live Stream Log Viewer */}
            <div className="h-[600px]">
              <LogViewer
                initialPod={selectedPod}
                initialNamespace={selectedNamespace}
              />
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
