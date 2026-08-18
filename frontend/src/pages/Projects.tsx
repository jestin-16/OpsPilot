import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { api, type Project, type Deployment } from '../services/api';
import { FolderGit2, Plus, Rocket, Trash2, ExternalLink, AlertCircle, Play, Globe, FileText, XCircle, Activity } from 'lucide-react';

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
  const [awsLogGroupName, setAwsLogGroupName] = useState('');
  const [githubRepoName, setGithubRepoName] = useState('');
  const [lokiAppLabel, setLokiAppLabel] = useState('');
  const [ociLogGroupOcid, setOciLogGroupOcid] = useState('');
  const [credentialsJson, setCredentialsJson] = useState('');
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
      await api.createProject({ projectName, description, repositoryUrl, awsLogGroupName, githubRepoName, lokiAppLabel, ociLogGroupOcid, credentialsJson });
      setIsModalOpen(false);
      setProjectName('');
      setDescription('');
      setRepositoryUrl('');
      setAwsLogGroupName('');
      setGithubRepoName('');
      setLokiAppLabel('');
      setOciLogGroupOcid('');
      setCredentialsJson('');
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
      <div className="p-8 max-w-[1500px] mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Projects & Deployments</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Manage your microservices, trigger pipelines, and inspect active deployment status
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md hover:shadow-indigo-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
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
          <div className="text-center py-16 text-slate-400 font-medium text-sm animate-pulse">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No projects registered yet</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Add your first project repository to start deploying.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
            >
              Add Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="glass-panel border-t-[3px] border-t-indigo-500 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{project.projectName}</h3>
                    <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-5 font-medium line-clamp-2 leading-relaxed">{project.description}</p>
                  
                  <div className="text-[11px] font-bold text-slate-500 space-y-2 mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="truncate flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline transition-colors">
                        {project.repositoryUrl}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center justify-center text-white text-[8px]">{project.ownerName.charAt(0)}</div>
                      <span>Owner: {project.ownerName} ({project.ownerEmail})</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => openDeployModal(project)}
                      className="flex-1 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-500 text-indigo-600 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>Deploy</span>
                    </button>

                    <a
                      href={project.deployedUrl || `http://localhost:8080/api/v1/projects/${project.id}/output`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Live Output</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/logs?query=${encodeURIComponent(project.projectName)}`}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Logs</span>
                    </Link>

                    <Link
                      to={`/projects/${project.id}/log-sources`}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:border-purple-200 hover:bg-purple-50 text-slate-600 hover:text-purple-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span>Sources</span>
                    </Link>

                    {canEdit(project.ownerId) && (
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete project"
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer rounded-xl border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up">
            <div className="glass-panel rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Create New Project</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Authentication Service"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    required
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/opspilot/auth-service"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                      AWS Log Group (Optional)
                    </label>
                    <input
                      type="text"
                      value={awsLogGroupName}
                      onChange={(e) => setAwsLogGroupName(e.target.value)}
                      placeholder="/ecs/my-app"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                      GitHub Repo (Optional)
                    </label>
                    <input
                      type="text"
                      value={githubRepoName}
                      onChange={(e) => setGithubRepoName(e.target.value)}
                      placeholder="org/repo"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                      OCI Log Group OCID (Optional)
                    </label>
                    <input
                      type="text"
                      value={ociLogGroupOcid}
                      onChange={(e) => setOciLogGroupOcid(e.target.value)}
                      placeholder="ocid1.loggroup.oc1..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                    Project Credentials JSON (Optional)
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2 ml-1">Paste your AWS Access Keys or OCI API Keys here in JSON format.</p>
                  <textarea
                    value={credentialsJson}
                    onChange={(e) => setCredentialsJson(e.target.value)}
                    placeholder='{&#10;  "oci": { "tenancy": "...", "user": "..." },&#10;  "aws": { "accessKey": "..." }&#10;}'
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:border-indigo-500 min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary of application component..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-indigo-500 text-white font-bold text-sm rounded-xl hover:bg-indigo-600 shadow-md transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Trigger Deployment Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up">
            <div className="glass-panel rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Deploy <span className="text-indigo-600">{selectedProject.projectName}</span>
                  </h3>
                  <span className="text-sm font-medium text-slate-500 mt-1 block">Trigger automated CI/CD pipeline execution</span>
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-800 transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Trigger Form */}
              <form onSubmit={handleTriggerDeployment} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="QA">QA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={triggering}
                  className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors h-[46px]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{triggering ? 'Triggering...' : 'Run Pipeline'}</span>
                </button>
              </form>

              {/* Deployment History Table */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-600 flex items-center justify-between">
                  <span>Deployment History</span>
                  <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-xs">{deployments.length} Records</span>
                </h4>
                {deployments.length === 0 ? (
                  <div className="text-center py-10 text-sm font-medium text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    No deployment executions recorded for this project yet.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl shadow-inner">
                    <table className="w-full text-left text-sm text-slate-800">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-3 px-5">Version</th>
                          <th className="py-3 px-5">Env</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5">Deployed By</th>
                          <th className="py-3 px-5 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {deployments.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-5 font-mono text-indigo-500 font-bold text-xs">{d.version}</td>
                            <td className="py-3 px-5 font-semibold text-slate-700 text-xs">{d.environment}</td>
                            <td className="py-3 px-5">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                d.status === 'Running' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="py-3 px-5 font-medium text-slate-600 text-xs">{d.deployedByName}</td>
                            <td className="py-3 px-5 text-slate-400 font-mono text-xs text-right">
                              {new Date(d.deployedAt).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
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
