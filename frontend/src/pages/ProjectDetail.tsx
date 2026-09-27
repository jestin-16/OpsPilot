import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Project, type Deployment, type PipelineRun, type CommitLog, type Container, type Pod } from '../services/api';
import { FolderGit2, Rocket, FileText, Activity, Server, Terminal, GitCommit, AlertTriangle, PlayCircle, Undo2, ChevronLeft } from 'lucide-react';
import { Badge } from '../components/Badge';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);

  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRun[]>([]);
  const [commits, setCommits] = useState<CommitLog[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proj, deps, runs, projCommits, projIncidents, allContainers, allPods] = await Promise.all([
          api.getProjectById(projectId).catch(() => null),
          api.getDeployments(projectId).catch(() => []),
          api.getPipelineRuns().catch(() => []),
          api.getCommits(projectId).catch(() => []),
          api.getIncidents(projectId).catch(() => []),
          api.getDockerContainers().catch(() => []),
          api.getKubernetesPods().catch(() => [])
        ]);

        if (proj) setProject(proj);
        setDeployments(deps);
        setPipelines(runs.filter(r => r.project?.id === projectId));
        setCommits(projCommits);
        setIncidents(projIncidents);
        // Simplified container/pod matching
        setContainers(allContainers);
        setPods(allPods);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center py-20 text-slate-500 animate-pulse">Loading project details...</div>
      </SidebarLayout>
    );
  }

  if (!project) {
    return (
      <SidebarLayout>
        <div className="flex justify-center py-20 text-rose-500">Project not found.</div>
      </SidebarLayout>
    );
  }

  const latestDeployment = deployments[0];
  const latestPipeline = pipelines[0];
  const latestCommit = commits[0];
  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');

  const tabs = [
    'Overview', 'Deployments', 'Pipelines', 'Docker', 
    'Kubernetes', 'Logs', 'Monitoring', 'Commits', 'Incidents'
  ];

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link to="/projects" className="text-slate-400 hover:text-op-accent transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-op-accent flex items-center justify-center text-white shadow-lg">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800">{project.projectName}</h1>
              <Badge variant={project.status === 'Active' ? 'success' : 'neutral'}>{project.status}</Badge>
            </div>
            <p className="text-sm text-slate-500 ml-12">{project.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-op-accent hover:bg-op-accent-hover text-op-accent-fg text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors">
              <PlayCircle className="w-4 h-4" /> Deploy
            </button>
            <button className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors">
              <Undo2 className="w-4 h-4 text-rose-500" /> Rollback
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 mb-8 pb-px no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-op-accent text-op-accent' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Project Meta */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Project Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block mb-1">Repository</span>
                    <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="text-op-accent hover:underline font-medium break-all">
                      {project.repositoryUrl}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Owner</span>
                    <span className="font-medium text-slate-800">{project.ownerName} ({project.ownerEmail})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Created At</span>
                    <span className="text-slate-800 font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Health Status</span>
                    <span className="flex items-center gap-2 font-bold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Healthy</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Links */}
              <div className="grid grid-cols-3 gap-4">
                <Link to="/pipelines" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-op-accent/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Rocket className="w-5 h-5 text-op-accent" />
                    <span className="font-bold text-slate-700 group-hover:text-op-accent">View Pipeline</span>
                  </div>
                </Link>
                <Link to="/logs" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-op-accent/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-op-accent" />
                    <span className="font-bold text-slate-700 group-hover:text-op-accent">View Logs</span>
                  </div>
                </Link>
                <Link to="/kubernetes" className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-op-accent/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-op-accent" />
                    <span className="font-bold text-slate-700 group-hover:text-op-accent">View Kubernetes</span>
                  </div>
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">Status Summary</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><GitCommit className="w-4 h-4"/> Latest Commit</span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">{latestCommit ? latestCommit.commitSha.substring(0,7) : 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><Rocket className="w-4 h-4"/> Latest Deployment</span>
                    {latestDeployment ? (
                      <Badge variant={latestDeployment.status === 'Running' ? 'success' : 'neutral'}>{latestDeployment.version}</Badge>
                    ) : <span className="text-slate-400">None</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><Activity className="w-4 h-4"/> Pipeline Status</span>
                    {latestPipeline ? (
                      <Badge variant={latestPipeline.status === 'SUCCESS' ? 'success' : 'error'}>{latestPipeline.status}</Badge>
                    ) : <span className="text-slate-400">None</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><Terminal className="w-4 h-4"/> Container Count</span>
                    <span className="font-bold text-slate-800">{containers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><Server className="w-4 h-4"/> Pod Count</span>
                    <span className="font-bold text-slate-800">{pods.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Error Count</span>
                    <span className="font-bold text-rose-500">{activeIncidents.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs (Placeholder for simplicity, reusing existing views is ideal but we map to lists here) */}
        {activeTab !== 'Overview' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
            <h3 className="text-lg font-bold text-slate-700 mb-2">{activeTab}</h3>
            <p className="text-slate-500 mb-4">View {activeTab.toLowerCase()} related to {project.projectName}.</p>
            <Link to={`/${activeTab.toLowerCase()}`} className="text-op-accent font-bold hover:underline">
              Go to full {activeTab} view &rarr;
            </Link>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
