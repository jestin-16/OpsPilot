import { useQuery } from '@tanstack/react-query';
import { projectApi, type ProjectIntegration } from '../services/projectApi';

export const integrationsKey = (projectId: number | null) => ['integrations', projectId] as const;

/** Integrations of one project; refreshed in the background so status changes show up. */
export function useProjectIntegrations(projectId: number | null, refetchMs: number | false = 30_000) {
  return useQuery<ProjectIntegration[]>({
    queryKey: integrationsKey(projectId),
    queryFn: () => projectApi.listIntegrations(projectId as number),
    enabled: projectId != null,
    refetchInterval: refetchMs,
  });
}
