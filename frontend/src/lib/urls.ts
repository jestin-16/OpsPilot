import { API_BASE_URL } from '../services/api';

export const ingestUrl = (projectId: number) => `${API_BASE_URL}/ingest/${projectId}`;
export const githubWebhookUrl = (projectId: number, integrationId: number) =>
  `${API_BASE_URL}/ingest/${projectId}/github/${integrationId}`;
