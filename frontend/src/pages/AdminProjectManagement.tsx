import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, FolderGit2, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type Project } from '../services/api';

const isQuarantined = (project: Project) => project.status.toUpperCase() === 'QUARANTINED';

export const AdminProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      setProjects(await api.getProjects());
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProjects(); }, []);

  const updateStatus = async (project: Project, status: string) => {
    setWorkingId(project.id);
    setError('');
    try {
      const updated = await api.updateProject(project.id, { status });
      setProjects((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to update project status.');
    } finally {
      setWorkingId(null);
    }
  };

  const quarantine = async (project: Project) => {
    if (!window.confirm(`Quarantine ${project.projectName}? This marks it as blocked until it is reviewed.`)) return;
    await updateStatus(project, 'QUARANTINED');
  };

  const removeProject = async (project: Project) => {
    if (!window.confirm(`Permanently delete ${project.projectName} and its linked deployment data?`)) return;
    setWorkingId(project.id);
    setError('');
    try {
      await api.deleteProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to delete project.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-[1500px] space-y-6 p-5 md:p-8">
        <header className="flex flex-col justify-between gap-5 rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/70 to-rose-50/50 p-6 shadow-sm md:flex-row md:items-end md:p-8">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700"><ShieldAlert className="h-4 w-4" /> Security and project control</div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Project management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review every registered repository, quarantine suspicious projects, and remove unsafe workloads from the platform.</p>
          </div>
          <button onClick={() => void loadProjects()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-amber-300 hover:text-amber-700"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
        </header>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm font-medium text-amber-900"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><p>This is an administrative containment workflow. Quarantine blocks the project by status; it does not replace repository malware scanning.</p></div>
        {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</div>}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-800">Registered projects</h2><p className="mt-1 text-xs text-slate-500">{projects.length} project{projects.length === 1 ? '' : 's'} across all developer workspaces</p></div>
          {loading ? <p className="p-8 text-sm text-slate-400">Loading projects...</p> : projects.length === 0 ? <p className="p-8 text-sm text-slate-400">No projects registered.</p> : <div className="divide-y divide-slate-100">
            {projects.map((project) => {
              const quarantined = isQuarantined(project);
              const busy = workingId === project.id;
              return <article key={project.id} className={`flex flex-col gap-4 p-5 transition md:flex-row md:items-center md:justify-between ${quarantined ? 'bg-rose-50/50' : 'hover:bg-slate-50/70'}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><FolderGit2 className="h-5 w-5 text-indigo-500" /><h3 className="truncate text-sm font-black text-slate-800">{project.projectName}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${quarantined ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{quarantined ? 'Quarantined' : project.status}</span></div>
                  <p className="mt-2 text-xs text-slate-500">Owner: <span className="font-bold text-slate-700">{project.ownerName}</span> · {project.ownerEmail}</p>
                  <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-indigo-600 hover:underline"><ExternalLink className="h-3.5 w-3.5 shrink-0" />{project.repositoryUrl}</a>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <select value={project.status} disabled={busy} onChange={(event) => void updateStatus(project, event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"><option value="ACTIVE">Active</option><option value="SETUP_IN_PROGRESS">Setup in progress</option><option value="SUSPENDED">Suspended</option><option value="QUARANTINED">Quarantined</option></select>
                  {!quarantined && <button onClick={() => void quarantine(project)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"><ShieldAlert className="h-3.5 w-3.5" />Quarantine</button>}
                  <button onClick={() => void removeProject(project)} disabled={busy} title="Delete project" className="rounded-xl border border-rose-100 p-2 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>;
            })}
          </div>}
        </section>
      </div>
    </SidebarLayout>
  );
};
