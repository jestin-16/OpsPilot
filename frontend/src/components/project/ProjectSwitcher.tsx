import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronsUpDown, FolderGit2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { CreateProjectModal } from './CreateProjectModal';

const CREATE = '__create__';
const ALL = '__all__';

/** Project selector for the main nav. Switching keeps you on the same sub-page (logs, integrations ...). */
export const ProjectSwitcher: React.FC = () => {
  const { projects, projectsLoading, projectsError, currentProject, selectProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [creating, setCreating] = useState(false);

  const onChange = (value: string) => {
    if (value === CREATE) {
      setCreating(true);
      return;
    }
    if (value === ALL) {
      selectProject(null);
      navigate('/projects');
      return;
    }
    const id = Number(value);
    selectProject(id);
    const sub = location.pathname.match(/^\/projects\/\d+(\/(?:integrations|logs|details))/);
    navigate(`/projects/${id}${sub ? sub[1] : ''}`);
  };

  return (
    <div className="px-4 pb-2">
      <label htmlFor="project-switcher" className="px-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Project</label>
      <div className="relative mt-1.5">
        <FolderGit2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" aria-hidden="true" />
        <select
          id="project-switcher"
          value={currentProject ? String(currentProject.id) : ALL}
          onChange={(e) => onChange(e.target.value)}
          disabled={projectsLoading}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-8 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60 cursor-pointer"
        >
          <option value={ALL}>{projectsLoading ? 'Loading projects…' : projectsError ? 'Could not load projects' : 'All projects'}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{(p.name ?? p.projectName)}{p.environment ? ` · ${p.environment}` : ''}</option>
          ))}
          <option value={CREATE}>+ Create project…</option>
        </select>
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      </div>
      <CreateProjectModal isOpen={creating} onClose={() => setCreating(false)} />
    </div>
  );
};
