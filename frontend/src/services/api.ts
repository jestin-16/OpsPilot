import axios, { AxiosError } from 'axios';
import { z } from 'zod';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Axios Instance with Credentials for httpOnly Cookies
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('opspilot_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: 401 Auto-Refresh Loop
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    if (isAuthError && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register') && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('opspilot_token', data.token);
        localStorage.setItem('opspilot_user', JSON.stringify({ id: data.id, name: data.name, email: data.email, roles: data.roles }));

        processQueue(null, data.token);
        isRefreshing = false;

        originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        localStorage.removeItem('opspilot_token');
        localStorage.removeItem('opspilot_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// Zod Validation Schemas (Item 5.2)
export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit'),
  role: z.string().min(1, 'Role is required'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const ProjectSchema = z.object({
  projectName: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  repositoryUrl: z.string().url('Invalid repository URL format'),
});

// TypeScript Interfaces
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
  deployedUrl?: string;
  status: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
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

export interface AiDiagnosisResponse {
  query: string;
  rootCause: string;
  confidence: string;
  summary: string;
  suggestedRemediation: string;
  correlatedDeploymentId: number | null;
  correlatedDeploymentVersion: string | null;
  correlatedLogs: LogEntry[];
}

export const api = {
  // Auth
  register: async (data: z.infer<typeof RegisterSchema>): Promise<AuthResponse> => {
    RegisterSchema.parse(data);
    const res = await axiosInstance.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: z.infer<typeof LoginSchema>): Promise<AuthResponse> => {
    LoginSchema.parse(data);
    const res = await axiosInstance.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await axiosInstance.get<PagedResponse<Project>>('/projects');
    return res.data.content;
  },

  getPaginatedProjects: async (page = 0, size = 10, sortBy = 'id', sortDir = 'asc'): Promise<PagedResponse<Project>> => {
    const res = await axiosInstance.get<PagedResponse<Project>>(`/projects?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
    return res.data;
  },

  getProjectById: async (id: number): Promise<Project> => {
    const res = await axiosInstance.get<Project>(`/projects/${id}`);
    return res.data;
  },

  createProject: async (data: z.infer<typeof ProjectSchema> & { status?: string }): Promise<Project> => {
    ProjectSchema.parse({
      projectName: data.projectName,
      description: data.description,
      repositoryUrl: data.repositoryUrl,
    });
    const res = await axiosInstance.post<Project>('/projects', data);
    return res.data;
  },

  updateProject: async (id: number, data: Partial<z.infer<typeof ProjectSchema>> & { status?: string }): Promise<Project> => {
    const res = await axiosInstance.put<Project>(`/projects/${id}`, data);
    return res.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/projects/${id}`);
  },

  // Deployments
  getDeployments: async (projectId: number): Promise<Deployment[]> => {
    const res = await axiosInstance.get<Deployment[]>(`/projects/${projectId}/deployments`);
    return res.data;
  },

  triggerDeployment: async (projectId: number, data: { version: string; environment: string }): Promise<Deployment> => {
    const res = await axiosInstance.post<Deployment>(`/projects/${projectId}/deployments`, data);
    return res.data;
  },

  // Docker
  getDockerContainers: async (): Promise<Container[]> => {
    const res = await axiosInstance.get<Container[]>('/docker/containers');
    return res.data;
  },

  startContainer: async (id: number): Promise<Container> => {
    const res = await axiosInstance.post<Container>(`/docker/containers/${id}/start`);
    return res.data;
  },

  stopContainer: async (id: number): Promise<Container> => {
    const res = await axiosInstance.post<Container>(`/docker/containers/${id}/stop`);
    return res.data;
  },

  restartContainer: async (id: number): Promise<Container> => {
    const res = await axiosInstance.post<Container>(`/docker/containers/${id}/restart`);
    return res.data;
  },

  // Kubernetes
  getKubernetesPods: async (): Promise<Pod[]> => {
    const res = await axiosInstance.get<Pod[]>('/kubernetes/pods');
    return res.data;
  },

  // Logs
  getLogs: async (params?: { sourceService?: string; logLevel?: string; query?: string }): Promise<LogEntry[]> => {
    const res = await axiosInstance.get<LogEntry[]>('/logs', { params });
    return res.data;
  },

  createLog: async (data: { sourceService: string; logLevel: string; message: string }): Promise<LogEntry> => {
    const res = await axiosInstance.post<LogEntry>('/logs', data);
    return res.data;
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    const res = await axiosInstance.get<NotificationItem[]>('/notifications');
    return res.data;
  },

  markNotificationRead: async (id: number): Promise<NotificationItem> => {
    const res = await axiosInstance.put<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  // Monitoring
  getMetrics: async (): Promise<MetricsData> => {
    const res = await axiosInstance.get<MetricsData>('/monitoring/metrics');
    return res.data;
  },

  probeUrl: async (url: string): Promise<{ success: number; duration: number; httpStatus: number; sslExpiry: number }> => {
    const res = await axiosInstance.get(`/monitoring/probe?url=${encodeURIComponent(url)}`);
    return res.data;
  },

  // CI/CD
  getPipelineRuns: async (): Promise<PipelineRun[]> => {
    const res = await axiosInstance.get<PipelineRun[]>('/cicd/runs');
    return res.data;
  },

  simulateGitHubWebhook: async (eventType = 'push'): Promise<any> => {
    const res = await axiosInstance.post(
      '/cicd/webhooks/github',
      {
        ref: 'refs/heads/main',
        repository: {
          name: 'payment-engine',
          clone_url: 'https://github.com/opspilot/payment-engine',
        },
        head_commit: {
          id: '8f3e4d29a01',
          message: 'feat(core): Optimize payment gateway latency',
          author: {
            name: 'GitHub Webhook Bot',
            email: 'bot@github.com',
          },
        },
      },
      {
        headers: {
          'X-GitHub-Event': eventType,
        },
      }
    );
    return res.data;
  },

  // AI Assistant
  queryAiAssistant: async (data: { prompt: string; deploymentId?: number }): Promise<AiDiagnosisResponse> => {
    const res = await axiosInstance.post<AiDiagnosisResponse>('/ai/query', data);
    return res.data;
  },
};
