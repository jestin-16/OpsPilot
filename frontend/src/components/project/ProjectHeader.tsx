import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AlertCircle, FolderGit2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

const ENV_STYLES: Record<string, string> = {
  dev: 'bg-sky-50 text-sky-700 border-sky-200',
  staging: 'bg-amber-50 text-amber-700 border-amber-200',
  prod: 'bg-rose-50 text-rose-700 border-rose-200',
};

const tabCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-xs font-bold transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-indigo-600'}`;

interface Props {
  projectId: number;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

/** Page header shared by every project-scoped page: project name, environment and section tabs. */
export const ProjectHeader: React.FC<Props> = ({ projectId, title, subtitle, actions, children }) => {
  const { currentProject, projectsLoading } = useProject();
  const base = `/projects/${projectId}`;
  const name = currentProject?.name ?? currentProject?.projectName;
  return (
    <header className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
            <span>/</span>
            <Link to={base} className="inline-flex items-center gap-1 hover:text-indigo-600"><FolderGit2 className="h-3 w-3" />{projectsLoading ? '…' : name ?? `Project ${projectId}`}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">{title}</h1>
            {currentProject?.environment && (
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${ENV_STYLES[currentProject.environment]}`}>{currentProject.environment}</span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <nav aria-label="Project sections" className="inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <NavLink end to={base} className={tabCls}>Overview</NavLink>
        <NavLink to={`${base}/integrations`} className={tabCls}>Integrations</NavLink>
        <NavLink end to={`${base}/logs`} className={tabCls}>Logs</NavLink>
        <NavLink to={`${base}/details`} className={tabCls}>Deployments &amp; pipelines</NavLink>
      </nav>
      {children}
    </header>
  );
};

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
    <AlertCircle className="h-4 w-4 shrink-0" />
    <span className="flex-1">{message}</span>
    {onRetry && <button onClick={onRetry} className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-bold hover:bg-rose-100">Retry</button>}
  </div>
);
