const API_BASE_URL = 'http://localhost:8080/api';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export interface Project {
  id: number;
  projectName: string;
  description: string;
  repositoryUrl: string;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  status: string;
  createdAt: string;
}

export interface Deployment {
  id: number;
  projectId: number;
  projectName: string;
  deployedById: number;
  deployedByName: string;
  version: string;
  environment: string;
  status: string;
  deployedAt: string;
}

export interface Container {
  containerId: number;
  imageName: string;
  containerStatus: string;
  createdAt: string;
}

export interface Pod {
  podId: number;
  nodeName: string;
  podStatus: string;
  cpuUsage: string;
  memoryUsage: string;
}

export interface LogEntry {
  logId: number;
  sourceService: string;
  logLevel: string;
  message: string;
  timestamp: string;
}

export interface NotificationItem {
  notificationId: number;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface MetricPoint {
  time: string;
  cpu: number;
  memory: number;
  requests: number;
}

export interface MetricsData {
  cpuUsagePercent: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  activeRequests: number;
  totalDeployments: number;
  history: MetricPoint[];
}

export interface PipelineRun {
  runId: number;
  eventType: string;
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  status: string;
  createdAt: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('opspilot_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  register: async (data: { name: string; email: string; password: string; role: string }): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Invalid credentials' }));
      throw new Error(err.message || 'Invalid credentials');
    }
    return res.json();
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  getProjectById: async (id: number): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch project details');
    return res.json();
  },

  createProject: async (data: { projectName: string; description: string; repositoryUrl: string; status?: string }): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create project' }));
      throw new Error(err.message || 'Failed to create project');
    }
    return res.json();
  },

  updateProject: async (id: number, data: { projectName?: string; description?: string; repositoryUrl?: string; status?: string }): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update project' }));
      throw new Error(err.message || 'Failed to update project');
    }
    return res.json();
  },

  deleteProject: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete project' }));
      throw new Error(err.message || 'Failed to delete project');
    }
  },

  // Deployments
  getDeployments: async (projectId: number): Promise<Deployment[]> => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/deployments`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch deployments');
    return res.json();
  },

  triggerDeployment: async (projectId: number, data: { version: string; environment: string }): Promise<Deployment> => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/deployments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to trigger deployment' }));
      throw new Error(err.message || 'Failed to trigger deployment');
    }
    return res.json();
  },

  // Docker
  getDockerContainers: async (): Promise<Container[]> => {
    const res = await fetch(`${API_BASE_URL}/docker/containers`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch docker containers');
    return res.json();
  },

  startContainer: async (id: number): Promise<Container> => {
    const res = await fetch(`${API_BASE_URL}/docker/containers/${id}/start`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start container');
    return res.json();
  },

  stopContainer: async (id: number): Promise<Container> => {
    const res = await fetch(`${API_BASE_URL}/docker/containers/${id}/stop`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to stop container');
    return res.json();
  },

  restartContainer: async (id: number): Promise<Container> => {
    const res = await fetch(`${API_BASE_URL}/docker/containers/${id}/restart`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to restart container');
    return res.json();
  },

  // Kubernetes
  getKubernetesPods: async (): Promise<Pod[]> => {
    const res = await fetch(`${API_BASE_URL}/kubernetes/pods`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch kubernetes pods');
    return res.json();
  },

  // Logs
  getLogs: async (params?: { sourceService?: string; logLevel?: string; query?: string }): Promise<LogEntry[]> => {
    const url = new URL(`${API_BASE_URL}/logs`);
    if (params?.sourceService) url.searchParams.append('sourceService', params.sourceService);
    if (params?.logLevel) url.searchParams.append('logLevel', params.logLevel);
    if (params?.query) url.searchParams.append('query', params.query);

    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch system logs');
    return res.json();
  },

  createLog: async (data: { sourceService: string; logLevel: string; message: string }): Promise<LogEntry> => {
    const res = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to post log entry');
    return res.json();
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  markNotificationRead: async (id: number): Promise<NotificationItem> => {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  // Monitoring
  getMetrics: async (): Promise<MetricsData> => {
    const res = await fetch(`${API_BASE_URL}/monitoring/metrics`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch monitoring metrics');
    return res.json();
  },

  // CI/CD
  getPipelineRuns: async (): Promise<PipelineRun[]> => {
    const res = await fetch(`${API_BASE_URL}/cicd/runs`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pipeline runs');
    return res.json();
  },

  simulateGitHubWebhook: async (eventType: string = 'push'): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/webhooks/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GitHub-Event': eventType,
      },
      body: JSON.stringify({
        ref: 'refs/heads/main',
        repository: {
          name: 'payment-engine',
          html_url: 'https://github.com/opspilot/payment-engine',
        },
        head_commit: {
          id: '8f3e4d29a01',
          message: 'feat(core): Optimize payment gateway latency',
          author: {
            name: 'GitHub Webhook Bot',
            email: 'bot@github.com',
          },
        },
      }),
    });
    if (!res.ok) throw new Error('Failed to send webhook event');
    return res.json();
  },
};
