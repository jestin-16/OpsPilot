import { axiosInstance, type PagedResponse, type Project } from './api';

export type IntegrationType = 'DOCKER' | 'KUBERNETES' | 'GITHUB' | 'CICD' | 'APP_LOGS';
export type IntegrationStatus = 'CONNECTING' | 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'ERROR';
export type Environment = 'dev' | 'staging' | 'prod';

export interface ProjectIntegration {
  id: number;
  projectId: number;
  /** One of IntegrationType, or a legacy provider (AWS, VERCEL, ORACLE_CLOUD). */
  provider: string;
  name: string;
  category: string;
  status: IntegrationStatus;
  /** Non-secret settings only. */
  config: Record<string, unknown>;
  /** Names of stored secrets, never their values. */
  credentialKeys: string[];
  lastCheckedAt?: string;
  statusMessage?: string;
  /** Returned once, by the create call of an APP_LOGS integration. */
  ingestToken?: string;
  ingestTokenPrefix?: string;
}

export interface IntegrationInput {
  provider: IntegrationType;
  name: string;
  category: string;
  config: Record<string, unknown>;
  secrets: Record<string, string>;
}

export interface ProjectLogEntry {
  id: string;
  projectId: number;
  integrationId?: number;
  sourceType?: IntegrationType | null;
  level: string;
  message: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export interface LogQueryFilters {
  integrationId?: number;
  type?: string;
  level?: string;
  q?: string;
  from?: string;
  to?: string;
  container?: string;
  namespace?: string;
  pod?: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  environment: Environment;
  repositoryUrl?: string;
}

const clean = <T extends Record<string, unknown>>(params: T): Record<string, unknown> =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL'));

export const projectApi = {
  createProject: async (input: CreateProjectInput): Promise<Project> => {
    const res = await axiosInstance.post<Project>('/projects', clean({ ...input }));
    return res.data;
  },

  listIntegrations: async (projectId: number): Promise<ProjectIntegration[]> => {
    const res = await axiosInstance.get<ProjectIntegration[]>(`/projects/${projectId}/integrations`);
    return res.data;
  },

  createIntegration: async (projectId: number, input: IntegrationInput): Promise<ProjectIntegration> => {
    const res = await axiosInstance.post<ProjectIntegration>(`/projects/${projectId}/integrations`, {
      provider: input.provider,
      name: input.name,
      category: input.category,
      config: input.config,
      secrets: input.secrets,
    });
    return res.data;
  },

  /** Secrets that are omitted (or blank) keep their stored value. */
  updateIntegration: async (projectId: number, id: number, input: Pick<IntegrationInput, 'name' | 'config' | 'secrets'>): Promise<ProjectIntegration> => {
    const res = await axiosInstance.put<ProjectIntegration>(`/projects/${projectId}/integrations/${id}`, input);
    return res.data;
  },

  testIntegration: async (projectId: number, id: number): Promise<ProjectIntegration> => {
    const res = await axiosInstance.post<ProjectIntegration>(`/projects/${projectId}/integrations/${id}/test`);
    return res.data;
  },

  disconnectIntegration: async (projectId: number, id: number): Promise<ProjectIntegration> => {
    const res = await axiosInstance.post<ProjectIntegration>(`/projects/${projectId}/integrations/${id}/disconnect`);
    return res.data;
  },

  deleteIntegration: async (projectId: number, id: number): Promise<void> => {
    await axiosInstance.delete(`/projects/${projectId}/integrations/${id}`);
  },

  /** Containers, namespaces or pods for the pickers. */
  discover: async (projectId: number, id: number, kind: 'containers' | 'namespaces' | 'pods'): Promise<Array<Record<string, unknown>>> => {
    const res = await axiosInstance.get<Array<Record<string, unknown>>>(`/projects/${projectId}/integrations/${id}/resources`, { params: { kind } });
    return res.data;
  },

  /** Reads straight from the source (not the log store); selectors: container, namespace, pod, run, build. */
  history: async (projectId: number, id: number, params: Record<string, string | number | undefined> = {}): Promise<ProjectLogEntry[]> => {
    const res = await axiosInstance.get<ProjectLogEntry[]>(`/projects/${projectId}/integrations/${id}/history`, { params: clean(params) });
    return res.data;
  },

  /** Stored logs, newest first. */
  queryLogs: async (projectId: number, filters: LogQueryFilters, page = 0, size = 200): Promise<PagedResponse<ProjectLogEntry>> => {
    const res = await axiosInstance.get<PagedResponse<ProjectLogEntry>>(`/projects/${projectId}/logs`, {
      params: clean({ ...filters, page, size }),
    });
    return res.data;
  },
};

export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
}
