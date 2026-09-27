import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Project } from '../services/api';
import { 
  AlertTriangle, ShieldAlert, AlertOctagon, Info,
  Plus, CheckCircle, RefreshCw, X, PlayCircle, Rocket
} from 'lucide-react';

export const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [projectId, setProjectId] = useState<number>(-1);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '', description: '', severity: 'MEDIUM', projectId: -1, affectedService: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [incidentsData, projectsData] = await Promise.all([
        api.getIncidents(projectId),
        api.getProjects().catch(() => [])
      ]);
      setIncidents(incidentsData);
      if (projects.length === 0) {
        setProjects(projectsData);
        if (projectsData.length > 0) setNewIncident(prev => ({...prev, projectId: projectsData[0].id}));
      }
    } catch (err: any) {
      console.error('Failed to load incidents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncident.projectId === -1) return;
    try {
      await api.createIncident(newIncident);
      setIsCreating(false);
      setNewIncident({ title: '', description: '', severity: 'MEDIUM', projectId: projects[0]?.id || -1, affectedService: '' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateIncidentStatus(id, status);
      if (selectedIncident?.id === id) {
        setSelectedIncident({...selectedIncident, status, resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : null});
      }
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'CRITICAL': return <AlertOctagon className="w-5 h-5 text-rose-500" />;
      case 'HIGH': return <ShieldAlert className="w-5 h-5 text-orange-500" />;
      case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'INVESTIGATING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MITIGATED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'RESOLVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <SidebarLayout>
      <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-op-surface relative">
        <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${selectedIncident ? 'pr-[400px]' : ''}`}>
          
          <div className="p-8 border-b border-op-border">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-op-fg flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-500" /> Incident Management
                </h1>
                <p className="text-sm font-medium text-op-muted mt-1">
                  Track, investigate, and resolve system anomalies.
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
                  onClick={loadData}
                  className="p-2 bg-op-raised hover:bg-op-accent/20 hover:text-op-accent text-op-muted rounded-lg transition-colors border border-op-border"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Report Incident
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {loading ? (
              <div className="flex justify-center py-20 text-op-muted">Loading incidents...</div>
            ) : incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-op-muted bg-op-raised/30 rounded-xl border border-op-border border-dashed">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
                <p>No incidents reported. All systems go.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {incidents.map((incident) => (
                  <div 
                    key={incident.id} 
                    onClick={() => setSelectedIncident(incident)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer ${
                      selectedIncident?.id === incident.id 
                        ? 'bg-op-raised border-rose-500/50' 
                        : 'bg-op-surface border-op-border hover:border-op-accent/50 hover:bg-op-raised/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getSeverityIcon(incident.severity)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-op-fg">{incident.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-op-muted mt-2">
                            <span>#{incident.id}</span>
                            <span>•</span>
                            <span>{new Date(incident.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-300">{incident.project?.projectName}</span>
                            {incident.affectedService && (
                              <>
                                <span>•</span>
                                <span>Service: {incident.affectedService}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Sidebar */}
        <div className={`fixed right-0 top-16 bottom-0 w-[400px] bg-[#121214] border-l border-op-border shadow-2xl transition-transform duration-300 transform ${selectedIncident ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto z-20 flex flex-col text-op-fg`}>
          {selectedIncident && (
            <>
              <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#121214] z-10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Incident #{selectedIncident.id}
                </h3>
                <button onClick={() => setSelectedIncident(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-op-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 flex-1 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-xl">{selectedIncident.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                      Severity: {selectedIncident.severity}
                    </span>
                  </div>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-op-muted">Project</span>
                    <span className="font-bold">{selectedIncident.project?.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-op-muted">Reported By</span>
                    <span>{selectedIncident.createdBy?.name || 'System'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-op-muted">Created</span>
                    <span>{new Date(selectedIncident.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedIncident.resolvedAt && (
                    <div className="flex justify-between">
                      <span className="text-op-muted">Resolved</span>
                      <span className="text-emerald-400">{new Date(selectedIncident.resolvedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-op-muted mb-2">Description</h4>
                  <div className="bg-op-raised/50 p-4 rounded-lg text-sm border border-op-border text-slate-300 whitespace-pre-wrap">
                    {selectedIncident.description || 'No description provided.'}
                  </div>
                </div>

                {(selectedIncident.relatedPipelineRun || selectedIncident.relatedDeployment) && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-op-muted mb-2">Related Entities</h4>
                    <div className="space-y-2">
                      {selectedIncident.relatedPipelineRun && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm">
                          <PlayCircle className="w-5 h-5" />
                          <div>
                            <div className="font-bold">Pipeline Run #{selectedIncident.relatedPipelineRun.runId}</div>
                            <div className="text-xs opacity-75">{selectedIncident.relatedPipelineRun.commitMessage}</div>
                          </div>
                        </div>
                      )}
                      {selectedIncident.relatedDeployment && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
                          <Rocket className="w-5 h-5" />
                          <div>
                            <div className="font-bold">Deployment #{selectedIncident.relatedDeployment.id}</div>
                            <div className="text-xs opacity-75">v{selectedIncident.relatedDeployment.version} in {selectedIncident.relatedDeployment.environment}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-op-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-op-muted mb-3">Update Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleUpdateStatus(selectedIncident.id, 'INVESTIGATING')} className="px-3 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-sm font-bold transition-colors">
                      Investigating
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedIncident.id, 'MITIGATED')} className="px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-bold transition-colors">
                      Mitigated
                    </button>
                    <button onClick={() => handleUpdateStatus(selectedIncident.id, 'RESOLVED')} className="px-3 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-sm font-bold transition-colors col-span-2">
                      Mark as Resolved
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-op-surface border border-op-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-op-border bg-op-raised/50">
              <h2 className="text-xl font-bold text-op-fg">Report Incident</h2>
              <button onClick={() => setIsCreating(false)} className="text-op-muted hover:text-op-fg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-op-muted mb-1">Project</label>
                <select 
                  required
                  value={newIncident.projectId}
                  onChange={e => setNewIncident({...newIncident, projectId: Number(e.target.value)})}
                  className="w-full bg-op-raised border border-op-border text-op-fg rounded-lg px-4 py-2.5 outline-none focus:border-op-accent"
                >
                  <option value={-1} disabled>Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-op-muted mb-1">Incident Title</label>
                <input 
                  required
                  type="text"
                  value={newIncident.title}
                  onChange={e => setNewIncident({...newIncident, title: e.target.value})}
                  className="w-full bg-op-raised border border-op-border text-op-fg rounded-lg px-4 py-2.5 outline-none focus:border-op-accent"
                  placeholder="e.g., High latency in payment gateway"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-op-muted mb-1">Severity</label>
                  <select 
                    value={newIncident.severity}
                    onChange={e => setNewIncident({...newIncident, severity: e.target.value})}
                    className="w-full bg-op-raised border border-op-border text-op-fg rounded-lg px-4 py-2.5 outline-none focus:border-op-accent"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-op-muted mb-1">Affected Service</label>
                  <input 
                    type="text"
                    value={newIncident.affectedService}
                    onChange={e => setNewIncident({...newIncident, affectedService: e.target.value})}
                    className="w-full bg-op-raised border border-op-border text-op-fg rounded-lg px-4 py-2.5 outline-none focus:border-op-accent"
                    placeholder="e.g., auth-service"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-op-muted mb-1">Description</label>
                <textarea 
                  rows={4}
                  value={newIncident.description}
                  onChange={e => setNewIncident({...newIncident, description: e.target.value})}
                  className="w-full bg-op-raised border border-op-border text-op-fg rounded-lg px-4 py-2.5 outline-none focus:border-op-accent resize-none"
                  placeholder="Provide details about the incident..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 text-sm font-bold text-op-muted hover:text-op-fg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  <AlertTriangle className="w-4 h-4" /> Report Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </SidebarLayout>
  );
};
