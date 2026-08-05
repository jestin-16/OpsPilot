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
    if (!res.ok) {
      throw new Error('Failed to fetch projects');
    }
    return res.json();
  },

  getProjectById: async (id: number): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch project details');
    }
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
    if (!res.ok) {
      throw new Error('Failed to fetch deployments');
    }
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
};
