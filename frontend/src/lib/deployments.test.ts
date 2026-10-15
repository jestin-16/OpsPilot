import { describe, expect, it } from 'vitest';
import { deployedBy, deploymentStatusVariant, isSuccessfulDeployment } from './deployments';
import type { Deployment } from '../services/api';

describe('deploymentStatusVariant', () => {
  it('colours the statuses OpsPilot records', () => {
    expect(deploymentStatusVariant('Succeeded')).toBe('success');
    expect(deploymentStatusVariant('Failed')).toBe('error');
    expect(deploymentStatusVariant('In progress')).toBe('warning');
    expect(deploymentStatusVariant('Inactive')).toBe('neutral');
  });

  it('still understands the old simulator values on legacy rows', () => {
    expect(deploymentStatusVariant('Running')).toBe('success');
    expect(deploymentStatusVariant('Building')).toBe('warning');
    expect(deploymentStatusVariant('RolledBack')).toBe('neutral');
    expect(isSuccessfulDeployment('Running')).toBe(true);
  });
});

describe('deployedBy', () => {
  const base = { deployedById: null, deployedByName: null, actor: null } as unknown as Deployment;

  it('prefers the OpsPilot user, then the GitHub login', () => {
    expect(deployedBy({ ...base, deployedByName: 'Asha' })).toBe('Asha');
    expect(deployedBy({ ...base, actor: 'octocat' })).toBe('octocat');
    expect(deployedBy(base)).toBe('Unknown');
  });
});
