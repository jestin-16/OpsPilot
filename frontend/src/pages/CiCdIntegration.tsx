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

  const webhookUrl = 'http://localhost:8080/api/webhooks/github';

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
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <GitBranch className="w-6 h-6 text-[#38BDF8]" />
              <h1 className="text-2xl font-bold text-[#F8FAFC]">CI/CD integration</h1>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              GitHub Actions webhook payloads, continuous deployment pipelines, and build status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateWebhook}
              disabled={triggering}
              className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#060B18] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{triggering ? 'Triggering...' : 'Simulate GitHub push'}</span>
            </button>
            <button
              onClick={fetchRuns}
              className="px-3.5 py-2 bg-[#0F1B2E] border border-[#1E2D45] hover:bg-[#1E2D45] text-[#F8FAFC] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Refresh runs</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Webhook Configuration Card */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-[#38BDF8]" />
              <h2 className="text-base font-bold text-[#F8FAFC]">GitHub Actions webhook URL</h2>
            </div>
            <span className="px-2.5 py-1 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded text-[11px] font-mono font-semibold">
              Status: Active (200 OK)
            </span>
          </div>

          <div className="flex items-center gap-3 bg-[#060B18] p-3 rounded-lg border border-[#1E2D45]">
            <span className="font-mono text-xs text-[#38BDF8] flex-1 truncate">{webhookUrl}</span>
            <button
              onClick={handleCopyUrl}
              className="px-3 py-1.5 bg-[#1E2D45] hover:bg-[#1E2D45]/80 text-[#F8FAFC] text-xs rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Copy className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{copied ? 'Copied!' : 'Copy URL'}</span>
            </button>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Configure this payload URL in your GitHub Repository Settings → Webhooks to receive automatic build events on every push or workflow run.
          </p>
        </div>

        {/* Pipeline Runs Table Card */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#F8FAFC]">Pipeline execution history ({runs.length})</h2>
            <span className="text-xs font-mono text-[#38BDF8]">Provider: GitHub Actions Webhooks</span>
          </div>

          {loading && runs.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">Loading pipeline runs...</div>
          ) : runs.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm border border-dashed border-[#1E2D45] rounded-lg">
              No pipeline runs detected. Click "Simulate GitHub push" above to fire a test webhook payload.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#F8FAFC]">
                <thead className="bg-[#060B18] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#1E2D45]">
                  <tr>
                    <th className="py-3 px-4">Run ID</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Commit SHA</th>
                    <th className="py-3 px-4">Commit message</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Triggered at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D45]">
                  {runs.map((r) => (
                    <tr key={r.runId} className="hover:bg-[#060B18]/50">
                      <td className="py-3.5 px-4 font-mono text-[#38BDF8]">#{r.runId}</td>
                      <td className="py-3.5 px-4 font-mono uppercase text-[10px] font-bold text-[#A78BFA]">
                        {r.eventType}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#F8FAFC]">{r.branch}</td>
                      <td className="py-3.5 px-4 font-mono text-[#38BDF8] flex items-center gap-1">
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>{r.commitSha}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#F8FAFC] max-w-xs truncate">{r.commitMessage}</td>
                      <td className="py-3.5 px-4 text-[#94A3B8]">{r.author}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{r.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#94A3B8]">
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
