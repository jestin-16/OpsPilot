import React, { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { ProjectHeader } from '../components/project/ProjectHeader';
import { LogViewer } from '../components/logs/LogViewer';
import { DEFAULT_FILTERS, LogFilterBar, toQueryFilters, type LogFilterState } from '../components/logs/LogFilterBar';
import { useProjectLogs } from '../hooks/useProjectLogs';
import { useProjectIntegrations } from '../hooks/useProjectIntegrations';

/** Everything from every connected source in one live stream. */
export const ProjectLogs: React.FC = () => {
  const projectId = Number(useParams().id);
  const { data: integrations = [], isLoading: integrationsLoading } = useProjectIntegrations(projectId);
  const [filters, setFilters] = useState<LogFilterState>(DEFAULT_FILTERS);
  const onChange = useCallback((next: LogFilterState) => setFilters(next), []);

  const logs = useProjectLogs({ projectId, filters: toQueryFilters(filters), historyWindowMs: filters.rangeMs });
  const names = useMemo(() => new Map(integrations.map((i) => [i.id, i.name])), [integrations]);

  const noIntegrations = !integrationsLoading && integrations.length === 0;

  return (
    <SidebarLayout>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 p-6 sm:p-8">
        <ProjectHeader projectId={projectId} title="Logs" subtitle="All connected sources in one stream." />
        <LogFilterBar value={filters} onChange={onChange} integrations={integrations} />
        <LogViewer
          logs={logs}
          integrationNames={names}
          className="h-[68vh] min-h-[420px]"
          emptyHint={noIntegrations
            ? <>Nothing is connected to this project yet. <Link className="font-bold text-indigo-600 underline" to={`/projects/${projectId}/integrations`}>Connect an integration</Link> to see logs here.</>
            : undefined}
        />
      </div>
    </SidebarLayout>
  );
};
