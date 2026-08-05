import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { api, type Project, type Deployment } from '../services/api';
import { FolderGit2, Plus, Rocket, Trash2, ExternalLink, AlertCircle, Play } from 'lucide-react';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Trigger Deployment Modal State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [version, setVersion] = useState('v1.0.0');
  const [environment, setEnvironment] = useState('Production');
  const [triggering, setTriggering] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createProject({ projectName, description, repositoryUrl });
      setIsModalOpen(false);
      setProjectName('');
      setDescription('');
      setRepositoryUrl('');
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const openDeployModal = async (project: Project) => {
    setSelectedProject(project);
    try {
      const history = await api.getDeployments(project.id);
      setDeployments(history);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setTriggering(true);
    try {
      await api.triggerDeployment(selectedProject.id, { version, environment });
      const updatedHistory = await api.getDeployments(selectedProject.id);
      setDeployments(updatedHistory);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger deployment');
    } finally {
      setTriggering(false);
    }
  };

  const canEdit = (ownerId: number) => {
    if (!user) return false;
    const isOwner = user.id === ownerId;
    const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('Admin');
    return isOwner || isAdmin;
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-6 h-6 text-[#4F46E5]" />
              <h1 className="text-2xl font-bold text-[#0F172A]">Projects & deployments</h1>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Manage your microservices, trigger pipelines, and inspect active deployment status
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New project</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-16 text-[#64748B] text-sm">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#E2E8F0] rounded-xl bg-[#FFFFFF] shadow-sm">
            <FolderGit2 className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#0F172A]">No projects registered yet</h3>
            <p className="text-xs text-[#64748B] mt-1">Add your first project repository to start deploying.</p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 px-4 py-2 bg-[#4F46E5] text-[#FFFFFF] text-xs font-semibold rounded-lg shadow-sm"
            >
              Add project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-bold text-[#0F172A] truncate">{project.projectName}</h3>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mb-4 line-clamp-2">{project.description}</p>
                  <div className="text-[11px] text-[#475569] space-y-1 font-mono mb-4 bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0]">
                    <div className="truncate flex items-center gap-1.5">
                      <ExternalLink className="w-3 h-3 text-[#4F46E5] shrink-0" />
                      <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="hover:underline text-[#4F46E5]">
                        {project.repositoryUrl}
                      </a>
                    </div>
                    <div>Owner: {project.ownerName} ({project.ownerEmail})</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => openDeployModal(project)}
                    className="px-3 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Trigger deployment</span>
                  </button>

                  {canEdit(project.ownerId) && (
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      title="Delete project"
                      className="p-1.5 text-[#94A3B8] hover:text-red-600 transition-colors cursor-pointer rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                <h3 className="text-base font-bold text-[#0F172A]">Create new project</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold">
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1">
                    Project name
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Authentication Service"
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    required
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/opspilot/auth-service"
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary of application component..."
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#E2E8F0] text-[#475569] text-xs font-semibold rounded-lg hover:bg-[#F1F5F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#4F46E5] text-[#FFFFFF] text-xs font-semibold rounded-lg hover:bg-[#4338CA] shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Trigger Deployment Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Deploy: {selectedProject.projectName}
                  </h3>
                  <span className="text-xs text-[#64748B]">Trigger pipeline execution</span>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold">
                  ×
                </button>
              </div>

              {/* Trigger Form */}
              <form onSubmit={handleTriggerDeployment} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#4F46E5]"
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="QA">QA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[#0F172A] text-xs focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={triggering}
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{triggering ? 'Triggering...' : 'Trigger pipeline'}</span>
                </button>
              </form>

              {/* Deployment History Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  Deployment History ({deployments.length})
                </h4>
                {deployments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#94A3B8] border border-dashed border-[#E2E8F0] rounded-lg">
                    No deployment executions recorded for this project yet.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-[#E2E8F0] rounded-lg">
                    <table className="w-full text-left text-xs text-[#0F172A]">
                      <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
                        <tr>
                          <th className="py-2.5 px-3">Version</th>
                          <th className="py-2.5 px-3">Env</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Deployed By</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {deployments.map((d) => (
                          <tr key={d.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3 font-mono text-[#4F46E5] font-semibold">{d.version}</td>
                            <td className="py-2 px-3 text-[#334155]">{d.environment}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                d.status === 'Running' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[#64748B]">{d.deployedByName}</td>
                            <td className="py-2 px-3 text-[#64748B] text-[11px]">
                              {new Date(d.deployedAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
