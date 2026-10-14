// Provider and category names used by the project wizard's quick-connect step.
export const ProviderType = {
  DOCKER: 'DOCKER',
  KUBERNETES: 'KUBERNETES',
  GITHUB: 'GITHUB',
  AWS: 'AWS',
  VERCEL: 'VERCEL',
  ORACLE_CLOUD: 'ORACLE_CLOUD'
} as const;
export type ProviderType = typeof ProviderType[keyof typeof ProviderType];

export const IntegrationCategory = {
  SOURCE_CONTROL: 'SOURCE_CONTROL',
  CONTAINERS: 'CONTAINER',
  KUBERNETES: 'KUBERNETES',
  CLOUD: 'CLOUD',
  DEPLOYMENT: 'DEPLOYMENT',
  DATABASE: 'DATABASE',
  MONITORING: 'MONITORING'
} as const;
export type IntegrationCategory = typeof IntegrationCategory[keyof typeof IntegrationCategory];
