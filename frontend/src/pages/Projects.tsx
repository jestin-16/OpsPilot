import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Project, type Deployment } from '../services/api';
import {
  Plus,
  FolderGit2,
  Rocket,
  ExternalLink,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected project for viewing details/deployments
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Trigger Deployment Form
  const [deployEnvironment, setDeployEnvironment] = useState('Dev');
  const [deployVersion, setDeployVersion] = useState('v1.0.0');
  const [deploySubmitting, setDeploySubmitting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployments = async (projectId: number) => {
    setDeploymentsLoading(true);
    try {
      const data = await api.getDeployments(projectId);
      setDeployments(data);
    } catch (err: any) {
      console.error('Failed to load deployments:', err);
    } finally {
      setDeploymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchDeployments(selectedProject.id);
      // Poll every 2 seconds to capture live deployment status updates (Draft -> Building -> Deploying -> Running)
      const interval = setInterval(() => {
        fetchDeployments(selectedProject.id);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedProject?.id]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setError('');

    try {
      const created = await api.createProject({
        projectName: newProjectName,
        description: newDescription,
        repositoryUrl: newRepoUrl,
      });
      setShowCreateModal(false);
      setNewProjectName('');
      setNewDescription('');
      setNewRepoUrl('');
      await fetchProjects();
      setSelectedProject(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleTriggerDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setDeploySubmitting(true);

    try {
      await api.triggerDeployment(selectedProject.id, {
        environment: deployEnvironment,
        version: deployVersion,
      });
      setShowDeployModal(false);
      await fetchDeployments(selectedProject.id);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger deployment');
    } finally {
      setDeploySubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(projectId);
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Action Forbidden: Only owner or Administrator can delete');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Running':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Running</span>
          </span>
        );
      case 'Deploying':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-1.5 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Deploying</span>
          </span>
        );
      case 'Building':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-950/60 text-sky-400 border border-sky-800/60 flex items-center gap-1.5 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Building</span>
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#F8FAFC]">Project Management</h1>
            <p className="text-sm text-[#94A3B8]">Create, manage, and trigger deployments for your repositories</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#060B18] font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Projects & Deployment View Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects List Column */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">Project Repositories</h2>
            {loading ? (
              <div className="p-6 bg-[#0F1B2E] border border-[#1E2D45] rounded-xl text-center text-[#94A3B8] text-sm">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="p-6 bg-[#0F1B2E] border border-[#1E2D45] rounded-xl text-center text-[#94A3B8] text-sm">
                No projects found. Click "New Project" to add your first repository.
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((proj) => {
                  const isSelected = selectedProject?.id === proj.id;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F1B2E] border-[#38BDF8]'
                          : 'bg-[#0F1B2E]/60 border-[#1E2D45] hover:border-[#1E2D45]/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <FolderGit2 className={`w-4 h-4 ${isSelected ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`} />
                          <h3 className="font-bold text-[#F8FAFC] text-sm">{proj.projectName}</h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E2D45] text-[#38BDF8]">
                          {proj.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-2 line-clamp-2">{proj.description || 'No description provided.'}</p>
                      <div className="mt-3 pt-3 border-t border-[#1E2D45]/60 flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span>Owner: {proj.ownerName}</span>
                        <span className="font-mono text-[#38BDF8]">ID: #{proj.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Project Details & Deployment Center Column */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProject ? (
              <>
                {/* Project Header Info */}
                <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-[#F8FAFC]">{selectedProject.projectName}</h2>
                        <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-full bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                          {selectedProject.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1">{selectedProject.description || 'No description'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDeployModal(true)}
                        className="px-3.5 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#060B18] font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Trigger Deployment</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProject(selectedProject.id)}
                        className="p-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Delete Project (Owner/Admin only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#94A3B8]">
                    <div>
                      <span className="block font-semibold text-[#F8FAFC]/70 uppercase tracking-wider text-[10px]">Repository URL</span>
                      <a
                        href={selectedProject.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#38BDF8] hover:underline flex items-center gap-1 mt-0.5 truncate"
                      >
                        <span className="truncate">{selectedProject.repositoryUrl || 'N/A'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <div>
                      <span className="block font-semibold text-[#F8FAFC]/70 uppercase tracking-wider text-[10px]">Project Owner</span>
                      <span className="text-[#F8FAFC] mt-0.5 block">{selectedProject.ownerName} ({selectedProject.ownerEmail})</span>
                    </div>
                  </div>
                </div>

                {/* Deployment History Table */}
                <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#F8FAFC]">Deployment History</h3>
                      <p className="text-xs text-[#94A3B8]">Simulated pipeline execution states (Draft → Building → Deploying → Running)</p>
                    </div>
                    <button
                      onClick={() => fetchDeployments(selectedProject.id)}
                      className="text-xs text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      Refresh
                    </button>
                  </div>

                  {deploymentsLoading && deployments.length === 0 ? (
                    <div className="py-8 text-center text-[#94A3B8] text-sm">Loading deployments...</div>
                  ) : deployments.length === 0 ? (
                    <div className="py-8 text-center text-[#94A3B8] text-sm border border-dashed border-[#1E2D45] rounded-lg">
                      No deployments triggered yet for this project.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-[#F8FAFC]">
                        <thead className="bg-[#060B18] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#1E2D45]">
                          <tr>
                            <th className="py-3 px-4">Deployment ID</th>
                            <th className="py-3 px-4">Environment</th>
                            <th className="py-3 px-4">Version</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Deployed By</th>
                            <th className="py-3 px-4">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2D45]">
                          {deployments.map((dep) => (
                            <tr key={dep.id} className="hover:bg-[#060B18]/50">
                              <td className="py-3 px-4 font-mono text-[#38BDF8]">#{dep.id}</td>
                              <td className="py-3 px-4 font-medium">{dep.environment}</td>
                              <td className="py-3 px-4 font-mono">{dep.version}</td>
                              <td className="py-3 px-4">{getStatusBadge(dep.status)}</td>
                              <td className="py-3 px-4 text-[#94A3B8]">{dep.deployedByName}</td>
                              <td className="py-3 px-4 text-[#94A3B8]">
                                {new Date(dep.deployedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-12 text-center text-[#94A3B8]">
                Select a project from the left panel or create a new project.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Create Project */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-4">
              <h3 className="text-lg font-bold text-[#F8FAFC]">Create New Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Authentication Service"
                  className="w-full px-3.5 py-2 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Repository URL *
                </label>
                <input
                  type="url"
                  required
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://github.com/opspilot/auth-service"
                  className="w-full px-3.5 py-2 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Short summary of application component"
                  className="w-full px-3.5 py-2 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E2D45]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#1E2D45] text-[#94A3B8] text-sm font-semibold rounded-lg hover:bg-[#1E2D45]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#060B18] text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Trigger Deployment */}
      {showDeployModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E2D45] pb-4">
              <h3 className="text-lg font-bold text-[#F8FAFC]">Trigger Deployment</h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerDeployment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Target Environment *
                </label>
                <select
                  value={deployEnvironment}
                  onChange={(e) => setDeployEnvironment(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8] cursor-pointer"
                >
                  <option value="Dev">Dev</option>
                  <option value="Staging">Staging</option>
                  <option value="Production">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Version Tag *
                </label>
                <input
                  type="text"
                  required
                  value={deployVersion}
                  onChange={(e) => setDeployVersion(e.target.value)}
                  placeholder="v1.0.0"
                  className="w-full px-3.5 py-2 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E2D45]">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 border border-[#1E2D45] text-[#94A3B8] text-sm font-semibold rounded-lg hover:bg-[#1E2D45]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deploySubmitting}
                  className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#060B18] text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {deploySubmitting ? 'Triggering...' : 'Trigger Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};
