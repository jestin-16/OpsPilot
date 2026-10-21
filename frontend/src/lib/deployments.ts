import type { Deployment } from '../services/api';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Badge colour for a deployment status, including the old simulator's values on SIMULATED rows. */
export function deploymentStatusVariant(status: string): BadgeVariant {
  switch (status.trim().toLowerCase()) {
    case 'succeeded':
    case 'success':
    case 'running':
      return 'success';
    case 'failed':
    case 'failure':
    case 'error':
      return 'error';
    case 'in progress':
    case 'pending':
    case 'queued':
    case 'draft':
    case 'building':
    case 'deploying':
      return 'warning';
    default:
      return 'neutral';
  }
}

/** Whether the deployment ended well (used for success counts). */
export const isSuccessfulDeployment = (status: string): boolean => deploymentStatusVariant(status) === 'success';

export const DEPLOYMENT_SOURCE_LABEL: Record<Deployment['source'], string> = {
  GITHUB: 'GitHub',
  CI: 'CI pipeline',
  MANUAL: 'Recorded',
  SIMULATED: 'Simulated (legacy)',
};

/** Who deployed: an OpsPilot user, the GitHub login, or unknown. */
export const deployedBy = (d: Deployment): string => d.deployedByName ?? d.actor ?? 'Unknown';
