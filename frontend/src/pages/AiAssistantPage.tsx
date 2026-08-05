import React, { useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type AiDiagnosisResponse } from '../services/api';
import { Bot, Sparkles, Send, AlertTriangle, FileText, ShieldCheck } from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<AiDiagnosisResponse | null>(null);
  const [error, setError] = useState('');

  const quickPrompts = [
    'Why did deployment #1 fail?',
    'Summarize overall platform health',
    'Correlate recent error logs with deployments',
  ];

  const handleQuery = async (queryText?: string) => {
    const activeQuery = queryText || prompt;
    if (!activeQuery.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.queryAiAssistant({ prompt: activeQuery });
      setDiagnosis(res);
    } catch (err: any) {
      setError(err.message || 'AI engine error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery();
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6 text-[#A78BFA]" />
              <h1 className="text-2xl font-bold text-[#F8FAFC]">AI assistant</h1>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Rule-based timestamp correlation matching deployment events with container logs
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-950/40 border border-violet-800/60 rounded-lg text-[#A78BFA] text-xs font-mono font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Correlation engine: Active</span>
          </div>
        </div>

        {/* Search Query Input Form */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask AI Assistant e.g. Why did deployment #1 fail? or Correlate logs..."
                className="w-full px-4 py-3 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#A78BFA] placeholder-[#94A3B8]/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-[#060B18] font-bold text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>{loading ? 'Analyzing...' : 'Run diagnosis'}</span>
            </button>
          </form>

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-[#94A3B8] font-medium mr-1">Suggested prompts:</span>
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                onClick={() => {
                  setPrompt(qp);
                  handleQuery(qp);
                }}
                className="px-3 py-1 bg-[#060B18] border border-[#1E2D45] hover:border-[#A78BFA] text-[#F8FAFC] text-xs rounded-full transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Diagnosis Results Card */}
        {diagnosis && (
          <div className="space-y-6">
            {/* Root Cause Banner */}
            <div className="bg-[#0F1B2E] border border-violet-800/60 rounded-xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#A78BFA]/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-start justify-between gap-4 border-b border-[#1E2D45] pb-4">
                <div>
                  <span className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider block">
                    AI Diagnostic Root Cause Result
                  </span>
                  <h2 className="text-lg font-bold text-[#F8FAFC] mt-1">{diagnosis.rootCause}</h2>
                </div>
                <span className="px-3 py-1 bg-violet-950/60 text-[#A78BFA] border border-violet-800/60 rounded-lg text-xs font-mono font-bold shrink-0 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{diagnosis.confidence}</span>
                </span>
              </div>

              {/* Summary & Remediation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                    Analysis summary
                  </h3>
                  <p className="text-xs text-[#F8FAFC] leading-relaxed bg-[#060B18] p-4 rounded-lg border border-[#1E2D45]">
                    {diagnosis.summary}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                    Suggested remediation
                  </h3>
                  <div className="text-xs text-[#F8FAFC] leading-relaxed bg-[#060B18] p-4 rounded-lg border border-[#1E2D45] font-mono whitespace-pre-line">
                    {diagnosis.suggestedRemediation}
                  </div>
                </div>
              </div>
            </div>

            {/* Correlated Logs Table Card */}
            <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#A78BFA]" />
                  <h3 className="text-base font-bold text-[#F8FAFC]">
                    Correlated log records ({diagnosis.correlatedLogs.length})
                  </h3>
                </div>
                {diagnosis.correlatedDeploymentId && (
                  <span className="text-xs font-mono text-[#38BDF8]">
                    Deployment #{diagnosis.correlatedDeploymentId} ({diagnosis.correlatedDeploymentVersion})
                  </span>
                )}
              </div>

              {diagnosis.correlatedLogs.length === 0 ? (
                <div className="py-8 text-center text-[#94A3B8] text-xs border border-dashed border-[#1E2D45] rounded-lg">
                  No error logs correlated within the timestamp proximity window.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#F8FAFC]">
                    <thead className="bg-[#060B18] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#1E2D45]">
                      <tr>
                        <th className="py-3 px-4">Log ID</th>
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4">Level</th>
                        <th className="py-3 px-4">Message</th>
                        <th className="py-3 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2D45]">
                      {diagnosis.correlatedLogs.map((l) => (
                        <tr key={l.logId} className="hover:bg-[#060B18]/50">
                          <td className="py-3 px-4 font-mono text-[#38BDF8]">#{l.logId}</td>
                          <td className="py-3 px-4 font-mono text-[#F8FAFC]">{l.sourceService}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-red-950/60 text-red-400 border border-red-800/60">
                              {l.logLevel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#F8FAFC] max-w-md truncate">{l.message}</td>
                          <td className="py-3 px-4 text-[#94A3B8]">{new Date(l.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
