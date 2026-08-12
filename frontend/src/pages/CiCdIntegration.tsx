import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type PipelineRun } from '../services/api';
import { GitBranch, GitCommit, Play, RefreshCw, CheckCircle2, AlertCircle, Terminal, Copy } from 'lucide-react';

export const CiCdIntegration: React.FC = () => {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = 'http://localhost:8080/api/v1/cicd/webhooks/github';

  const fetchRuns = async () => {
    try {
      const data = await api.getPipelineRuns();
      setRuns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pipeline runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateWebhook = async () => {
    setTriggering(true);
    try {
      await api.simulateGitHubWebhook('push');
      await fetchRuns();
    } catch (err: any) {
      alert(err.message || 'Webhook simulation failed');
    } finally {
      setTriggering(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <GitBranch className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">CI/CD Pipelines</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2">
              GitHub Webhooks, automated deployments, and real-time build status tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateWebhook}
              disabled={triggering}
              className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{triggering ? 'Triggering...' : 'Simulate GitHub Push'}</span>
            </button>
            <button
              onClick={fetchRuns}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-indigo-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Webhook Configuration Card */}
        <div className="glass-panel rounded-2xl p-6 space-y-5 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Terminal className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">GitHub Webhook Payload URL</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Listening
            </span>
          </div>

          <div className="flex items-center gap-3 bg-slate-50/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-inner group">
            <span className="font-mono text-sm text-slate-600 flex-1 truncate group-hover:text-indigo-600 transition-colors">{webhookUrl}</span>
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 text-xs rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
            >
              <Copy className="w-4 h-4 text-indigo-500" />
              <span>{copied ? 'Copied!' : 'Copy URL'}</span>
            </button>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Paste this URL in your <strong className="text-slate-700">GitHub Repository → Settings → Webhooks</strong> to automatically trigger builds on every push.
          </p>
        </div>

        {/* Pipeline Runs Table Card */}
        <div className="glass-panel rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Pipeline Execution History <span className="text-slate-400 font-normal">({runs.length})</span></h2>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">Live Webhooks</span>
          </div>

          {loading && runs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-sm animate-pulse">Fetching pipelines...</div>
          ) : runs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Terminal className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              No pipeline runs detected.<br/>Click <strong>"Simulate GitHub Push"</strong> above to test the webhook listener.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-5">Run ID</th>
                    <th className="py-4 px-5">Event</th>
                    <th className="py-4 px-5">Branch</th>
                    <th className="py-4 px-5">Commit SHA</th>
                    <th className="py-4 px-5">Commit Message</th>
                    <th className="py-4 px-5">Author</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {runs.map((r) => (
                    <tr key={r.runId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-slate-700">#{r.runId}</td>
                      <td className="py-4 px-5 font-mono uppercase text-xs font-bold text-purple-600 bg-purple-50/50 inline-block mt-2 rounded">
                        {r.eventType}
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-700 font-semibold">{r.branch}</td>
                      <td className="py-4 px-5 font-mono text-indigo-600 flex items-center gap-1.5 mt-2">
                        <GitCommit className="w-4 h-4" />
                        <span className="hover:underline cursor-pointer">{r.commitSha.substring(0, 7)}</span>
                      </td>
                      <td className="py-4 px-5 font-medium max-w-xs truncate">{r.commitMessage}</td>
                      <td className="py-4 px-5 text-slate-500 font-medium">{r.author}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 w-fit shadow-sm ${
                          r.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          r.status === 'FAILED'  ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{r.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-medium text-xs">
                        {new Date(r.createdAt).toLocaleString()}
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
