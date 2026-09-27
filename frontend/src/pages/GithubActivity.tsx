import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Project } from '../services/api';
import { 
  GitCommit, RefreshCw, AlertCircle, X, CheckCircle, 
  GitBranch, Clock, User, ArrowRight, PlayCircle, Rocket 
} from 'lucide-react';

export const GithubActivity: React.FC = () => {
  const [commits, setCommits] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [projectId, setProjectId] = useState<number>(-1);
  const [selectedCommit, setSelectedCommit] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [commitsData, projectsData, pipelinesData, deploymentsData] = await Promise.all([
        api.getCommits(projectId),
        api.getProjects().catch(() => []),
        api.getPipelineRuns().catch(() => []),
        api.getAllDeployments().catch(() => [])
      ]);
      setCommits(commitsData);
      
      if (projects.length === 0) setProjects(projectsData);
      setPipelines(pipelinesData);
      setDeployments(deploymentsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load GitHub activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleSync = async () => {
    setSyncing(true);
    setWarning('');
    setSuccessMsg('');
    setError('');
    try {
      const res = await api.syncCommits(projectId);
      if (res.warning) {
        setWarning(`Synced ${res.synced_count} commits with warning: ${res.warning}`);
      } else {
        setSuccessMsg(`Successfully synced ${res.synced_count} commits.`);
      }
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to sync commits');
    } finally {
      setSyncing(false);
      setTimeout(() => { setWarning(''); setSuccessMsg(''); }, 8000);
    }
  };

  const getPipelineForCommit = (sha: string, projId?: number) => {
    return pipelines.find(p => p.commitSha === sha && (!projId || p.projectId === projId));
  };

  const getDeploymentForCommit = (sha: string, projId?: number) => {
    const pipeline = getPipelineForCommit(sha, projId);
    if (!pipeline) return null;
    return deployments.find(d => 
      d.projectId === (projId || pipeline.projectId) && 
      d.version === sha.substring(0, 7) // Simple heuristic, matching by tag/sha prefix
    );
  };

  return (
    <SidebarLayout>
      <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-op-surface">
        
        {/* Main Content */}
        <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${selectedCommit ? 'pr-[400px]' : ''}`}>
          <div className="p-8 border-b border-op-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-op-fg flex items-center gap-3">
                  <GitCommit className="w-6 h-6 text-op-accent" /> GitHub Activity
                </h1>
                <p className="text-sm font-medium text-op-muted mt-1">
                  Commit synchronization and end-to-end trace.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <select 
                  value={projectId} 
                  onChange={(e) => setProjectId(Number(e.target.value))}
                  className="bg-op-raised border border-op-border text-op-fg text-sm rounded-lg px-4 py-2 outline-none focus:border-op-accent"
                >
                  <option value={-1}>All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
                </select>

                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-4 py-2 bg-op-accent hover:bg-op-accent-hover text-op-accent-fg text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> 
                  {syncing ? 'Syncing...' : 'Sync History'}
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3 text-rose-500 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {warning && (
              <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-3 text-amber-500 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{warning}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-500 text-sm">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-8">
            {loading ? (
              <div className="flex justify-center py-20 text-op-muted">Loading commits...</div>
            ) : commits.length === 0 ? (
              <div className="flex justify-center py-20 text-op-muted bg-op-raised/30 rounded-xl border border-op-border border-dashed">
                No commits found. Try syncing history.
              </div>
            ) : (
              <div className="space-y-4">
                {commits.map((commit, idx) => {
                  const pipeline = getPipelineForCommit(commit.commitSha, commit.projectId);
                  const isSelected = selectedCommit?.commitLogId === commit.commitLogId;
                  
                  return (
                    <div 
                      key={commit.commitLogId || idx} 
                      onClick={() => setSelectedCommit(commit)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-op-raised border-op-accent' 
                          : 'bg-op-surface border-op-border hover:border-op-accent/50 hover:bg-op-raised/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-op-accent/10 text-op-accent p-2 rounded-lg">
                            <GitCommit className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-op-fg text-base">{commit.message}</div>
                            <div className="flex items-center gap-3 text-xs text-op-muted mt-1">
                              <span className="font-mono text-op-accent">{commit.commitSha.substring(0, 7)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {commit.author}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {commit.branchName}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(commit.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                          {commit.projectName}
                        </div>
                      </div>

                      {/* Visual Flow Indicator */}
                      {pipeline && (
                        <div className="mt-4 pt-4 border-t border-op-border flex items-center gap-4 text-xs font-bold text-op-muted">
                          <div className="flex items-center gap-2 text-op-accent">
                            <GitCommit className="w-4 h-4" /> Commit
                          </div>
                          <ArrowRight className="w-4 h-4 opacity-50" />
                          <div className={`flex items-center gap-2 ${pipeline.status === 'SUCCESS' ? 'text-emerald-400' : pipeline.status === 'FAILED' ? 'text-rose-400' : 'text-amber-400'}`}>
                            <PlayCircle className="w-4 h-4" /> Pipeline {pipeline.status}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail Sidebar */}
        <div className={`fixed right-0 top-16 bottom-0 w-[400px] bg-[#121214] border-l border-op-border shadow-2xl transition-transform duration-300 transform ${selectedCommit ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto z-20 flex flex-col text-op-fg`}>
          {selectedCommit && (() => {
            const pipeline = getPipelineForCommit(selectedCommit.commitSha, selectedCommit.projectId);
            const deployment = getDeploymentForCommit(selectedCommit.commitSha, selectedCommit.projectId);
            
            return (
              <>
                <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#121214] z-10">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <GitCommit className="w-5 h-5 text-op-accent" /> Commit Details
                  </h3>
                  <button onClick={() => setSelectedCommit(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-op-muted transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-5 flex-1 space-y-8">
                  {/* Summary */}
                  <div>
                    <h4 className="font-bold text-lg mb-2">{selectedCommit.message}</h4>
                    <div className="flex flex-col gap-2 text-sm text-op-muted bg-black/30 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between"><span>SHA</span><span className="font-mono text-op-accent">{selectedCommit.commitSha}</span></div>
                      <div className="flex justify-between"><span>Project</span><span className="font-bold text-slate-300">{selectedCommit.projectName}</span></div>
                      <div className="flex justify-between"><span>Author</span><span>{selectedCommit.author}</span></div>
                      <div className="flex justify-between"><span>Branch</span><span>{selectedCommit.branchName}</span></div>
                      <div className="flex justify-between"><span>Date</span><span>{new Date(selectedCommit.timestamp).toLocaleString()}</span></div>
                    </div>
                  </div>

                  {/* Flow View */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-op-muted mb-4">Lifecycle Trace</h4>
                    
                    <div className="relative pl-6 space-y-6">
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-op-border"></div>
                      
                      {/* Step 1: Commit */}
                      <div className="relative">
                        <div className="absolute -left-[29px] bg-op-accent w-5 h-5 rounded-full border-4 border-[#121214]"></div>
                        <div className="font-bold text-sm text-op-accent">Code Committed</div>
                        <div className="text-xs text-op-muted">{new Date(selectedCommit.timestamp).toLocaleString()}</div>
                      </div>

                      {/* Step 2: Pipeline */}
                      {pipeline ? (
                        <div className="relative">
                          <div className={`absolute -left-[29px] w-5 h-5 rounded-full border-4 border-[#121214] ${
                            pipeline.status === 'SUCCESS' ? 'bg-emerald-500' : pipeline.status === 'FAILED' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}></div>
                          <div className="font-bold text-sm flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" /> Pipeline Run #{pipeline.runId}
                          </div>
                          <div className="text-xs text-op-muted mt-1">{pipeline.status} • {pipeline.durationMs ? `${pipeline.durationMs}ms` : 'N/A'}</div>
                        </div>
                      ) : (
                        <div className="relative opacity-50">
                          <div className="absolute -left-[29px] bg-slate-600 w-5 h-5 rounded-full border-4 border-[#121214]"></div>
                          <div className="font-bold text-sm text-slate-400">No Pipeline Run Found</div>
                        </div>
                      )}

                      {/* Step 3: Deployment */}
                      {deployment ? (
                        <div className="relative">
                          <div className={`absolute -left-[29px] w-5 h-5 rounded-full border-4 border-[#121214] ${
                            deployment.status === 'Running' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}></div>
                          <div className="font-bold text-sm flex items-center gap-2">
                            <Rocket className="w-4 h-4" /> Deployment #{deployment.id}
                          </div>
                          <div className="text-xs text-op-muted mt-1">Environment: {deployment.environment}</div>
                          <div className="text-xs text-op-muted">Status: {deployment.status}</div>
                        </div>
                      ) : (
                        <div className="relative opacity-50">
                          <div className="absolute -left-[29px] bg-slate-600 w-5 h-5 rounded-full border-4 border-[#121214]"></div>
                          <div className="font-bold text-sm text-slate-400">No Deployment Found</div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

      </div>
    </SidebarLayout>
  );
};
