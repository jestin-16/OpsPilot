import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileText, Plus, Rocket } from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { ErrorBanner, ProjectHeader } from '../components/project/ProjectHeader';
import { SourceBadge, StatusPill } from '../components/project/badges';
import { formatTime } from '../components/logs/LogViewer';
import { TYPE_ICONS } from './ProjectIntegrations';
import { useProject } from '../context/ProjectContext';
import { useProjectIntegrations } from '../hooks/useProjectIntegrations';
import { INTEGRATION_TYPES } from '../lib/integrationTypes';
import { LEVEL_STYLES } from '../lib/logBuffer';
import { errorMessage, projectApi, type IntegrationStatus, type ProjectIntegration } from '../services/projectApi';

/** One status for a group of integrations of the same type: the worst one wins. */
function summarize(items: ProjectIntegration[]): IntegrationStatus | null {
  if (items.length === 0) return null;
  for (const s of ['ERROR', 'DEGRADED', 'CONNECTING', 'DISCONNECTED'] as IntegrationStatus[]) {
    if (items.some((i) => i.status === s)) return s;
  }
  return 'CONNECTED';
}

export const ProjectOverview: React.FC = () => {
  const projectId = Number(useParams().id);
  const { currentProject, projectsLoading, projectsError } = useProject();
  const { data: integrations = [], isLoading, isError, error, refetch } = useProjectIntegrations(projectId);
  const recent = useQuery({
    queryKey: ['recent-errors', projectId],
    queryFn: () => projectApi.queryLogs(projectId, { level: 'ERROR' }, 0, 8),
    refetchInterval: 30_000,
  });

  const missing = !projectsLoading && !projectsError && !currentProject;

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6 sm:p-8">
        <ProjectHeader
          projectId={projectId}
          title={currentProject?.name ?? currentProject?.projectName ?? 'Project'}
          subtitle={currentProject?.description || 'Overview of connected systems and recent problems.'}
          actions={<Link to={`/projects/${projectId}/logs`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700"><FileText className="h-4 w-4" />Open live logs</Link>}
        />

        {missing && <ErrorBanner message="This project does not exist or you do not have access to it." />}
        {isError && <ErrorBanner message={errorMessage(error, 'Could not load integrations')} onRetry={() => refetch()} />}

        <section aria-labelledby="integrations-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="integrations-heading" className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Integrations</h2>
            <Link to={`/projects/${projectId}/integrations`} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">Manage<ArrowRight className="h-3 w-3" /></Link>
          </div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-busy="true">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />)}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {INTEGRATION_TYPES.map((def) => {
                const Icon = TYPE_ICONS[def.type];
                const items = integrations.filter((i) => i.provider === def.type);
                const status = summarize(items);
                const first = items[0];
                return (
                  <div key={def.type} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-4.5 w-4.5" /></div>
                      {status ? <StatusPill status={status} /> : <span className="text-xs font-semibold text-slate-400">Not connected</span>}
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-800">{def.label}</h3>
                    <p className="text-xs text-slate-500">{items.length === 0 ? 'Nothing connected yet' : `${items.length} connection${items.length > 1 ? 's' : ''}`}</p>
                    <div className="mt-auto pt-3">
                      {first ? (
                        <Link to={`/projects/${projectId}/logs/${first.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">View logs<ArrowRight className="h-3 w-3" /></Link>
                      ) : (
                        <Link to={`/projects/${projectId}/integrations?connect=${def.type}`} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"><Plus className="h-3 w-3" />Connect</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="errors-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="errors-heading" className="text-sm font-extrabold uppercase tracking-widest text-slate-400">Latest errors</h2>
            <Link to={`/projects/${projectId}/logs`} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">All logs<ArrowRight className="h-3 w-3" /></Link>
          </div>
          {recent.isLoading ? (
            <div className="space-y-2" aria-busy="true">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />)}</div>
          ) : recent.isError ? (
            <ErrorBanner message={errorMessage(recent.error, 'Could not load recent errors')} onRetry={() => recent.refetch()} />
          ) : (recent.data?.content.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm font-medium text-slate-400">No errors logged. Either all is well, or nothing is connected yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.data!.content.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2 font-mono text-xs">
                  <span className="w-[92px] shrink-0 text-slate-400">{formatTime(e.timestamp)}</span>
                  <span className={`rounded border px-1 py-px text-[10px] font-bold ${LEVEL_STYLES[e.level]}`}>{e.level}</span>
                  <SourceBadge type={e.sourceType} detail={e.metadata?.container || e.metadata?.pod || e.metadata?.repo} />
                  <span className="min-w-0 flex-1 truncate text-slate-700">{e.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link to={`/projects/${projectId}/details`} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300">
            <span className="flex items-center gap-3"><Rocket className="h-5 w-5 text-indigo-500" /><span><span className="block text-sm font-bold text-slate-800">Deployments &amp; pipelines</span><span className="text-xs text-slate-500">History, commits and CI runs for this project</span></span></span>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />
          </Link>
          <Link to="/incidents" className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300">
            <span className="flex items-center gap-3"><FileText className="h-5 w-5 text-indigo-500" /><span><span className="block text-sm font-bold text-slate-800">Incidents</span><span className="text-xs text-slate-500">Open incidents for this project</span></span></span>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />
          </Link>
        </section>
      </div>
    </SidebarLayout>
  );
};
