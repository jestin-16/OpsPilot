import React, { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { ErrorBanner, ProjectHeader } from '../components/project/ProjectHeader';
import { StatusPill } from '../components/project/badges';
import { LogViewer } from '../components/logs/LogViewer';
import { DEFAULT_FILTERS, LogFilterBar, toQueryFilters, type LogFilterState } from '../components/logs/LogFilterBar';
import { AppLogsPanel, CicdRuns, DockerPanel, GitTimeline, KubernetesPanel, SnapshotList } from '../components/logs/IntegrationPanels';
import { useProjectIntegrations } from '../hooks/useProjectIntegrations';
import { useProjectLogs } from '../hooks/useProjectLogs';
import { TYPE_BY_KEY } from '../lib/integrationTypes';
import { projectApi, type ProjectIntegration } from '../services/projectApi';

/** /projects/:id/logs/:integrationId — the unified view narrowed to one integration, with type-specific controls. */
export const IntegrationLogs: React.FC = () => {
  const params = useParams();
  const projectId = Number(params.id);
  const integrationId = Number(params.integrationId);
  const { data: integrations = [], isLoading, isError } = useProjectIntegrations(projectId);
  const integration = integrations.find((i) => i.id === integrationId);

  return (
    <SidebarLayout>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 p-6 sm:p-8">
        <ProjectHeader
          projectId={projectId}
          title={integration ? integration.name : 'Integration'}
          subtitle={integration ? TYPE_BY_KEY[integration.provider]?.description : undefined}
          actions={integration && <StatusPill status={integration.status} />}
        >
          <Link to={`/projects/${projectId}/logs`} className="inline-flex w-fit items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"><ArrowLeft className="h-3 w-3" />All sources</Link>
        </ProjectHeader>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />
        ) : isError ? (
          <ErrorBanner message="Could not load this project's integrations." />
        ) : !integration ? (
          <ErrorBanner message="This integration does not exist in this project." />
        ) : (
          <IntegrationBody integration={integration} />
        )}
      </div>
    </SidebarLayout>
  );
};

const IntegrationBody: React.FC<{ integration: ProjectIntegration }> = ({ integration }) => {
  const [filters, setFilters] = useState<LogFilterState>(DEFAULT_FILTERS);
  const [container, setContainer] = useState('');
  const [namespace, setNamespace] = useState('');
  const [pod, setPod] = useState('');
  const onChange = useCallback((next: LogFilterState) => setFilters(next), []);

  const kind = integration.provider;
  const configuredNs = String(integration.config.namespace || 'default');
  const snapshot = kind === 'KUBERNETES' && namespace !== '' && namespace !== configuredNs;

  const queryFilters = toQueryFilters({ ...filters, integrationId: integration.id }, {
    container: kind === 'DOCKER' || kind === 'KUBERNETES' ? container || undefined : undefined,
    pod: kind === 'KUBERNETES' ? pod || undefined : undefined,
  });
  // A Git timeline needs a long window to be useful; the others default to the chosen range.
  const windowMs = kind === 'GITHUB' || kind === 'CICD' ? null : filters.rangeMs;
  const logs = useProjectLogs({ projectId: integration.projectId, filters: queryFilters, historyWindowMs: windowMs, historySize: kind === 'GITHUB' || kind === 'CICD' ? 200 : 300 });
  const names = useMemo(() => new Map([[integration.id, integration.name]]), [integration]);

  const snap = useQuery({
    queryKey: ['k8s-snapshot', integration.id, namespace, container],
    queryFn: () => projectApi.history(integration.projectId, integration.id, { namespace, container: container || undefined, level: filters.level === 'ALL' ? undefined : filters.level, q: filters.q || undefined, size: 300 }),
    enabled: snapshot,
  });

  const notConnected = integration.status !== 'CONNECTED' && kind !== 'APP_LOGS';

  return (
    <>
      {notConnected && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          This integration is {integration.status.toLowerCase()}, so no new lines are being collected.{' '}
          <Link className="font-bold underline" to={`/projects/${integration.projectId}/integrations`}>Test or reconfigure it</Link>.
          {integration.statusMessage && <span className="ml-1 opacity-80">({integration.statusMessage})</span>}
        </div>
      )}

      {kind === 'DOCKER' && <DockerPanel integration={integration} container={container} onContainer={setContainer} />}
      {kind === 'KUBERNETES' && <KubernetesPanel integration={integration} namespace={namespace} pod={pod} onNamespace={setNamespace} onPod={setPod} snapshot={snapshot} />}
      {kind === 'APP_LOGS' && <AppLogsPanel integration={integration} />}

      {kind === 'GITHUB' ? (
        <GitTimeline entries={logs.entries} loading={logs.status === 'loading'} integration={integration} />
      ) : kind === 'CICD' ? (
        <CicdRuns integration={integration} entries={logs.entries} />
      ) : snapshot ? (
        <SnapshotList title={`Snapshot · namespace ${namespace}`} entries={snap.data} loading={snap.isLoading} error={snap.error} onRefresh={() => snap.refetch()} onClose={() => setNamespace('')} />
      ) : (
        <>
          <LogFilterBar value={filters} onChange={onChange} hideIntegration />
          <LogViewer logs={logs} integrationNames={names} className="h-[62vh] min-h-[380px]" />
        </>
      )}
    </>
  );
};
