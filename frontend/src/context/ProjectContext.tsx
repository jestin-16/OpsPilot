import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMatch } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Project } from '../services/api';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'opspilot_current_project';

interface ProjectContextValue {
  projects: Project[];
  projectsLoading: boolean;
  projectsError: boolean;
  currentProject: Project | null;
  currentProjectId: number | null;
  /** Remembers the choice; pass null for "all projects". */
  selectProject: (id: number | null) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const readStoredId = (): number | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

/** Must sit inside both the Router (reads the :id route param) and the AuthProvider. */
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const routeMatch = useMatch('/projects/:id/*');
  const routeId = routeMatch && /^\d+$/.test(routeMatch.params.id ?? '') ? Number(routeMatch.params.id) : null;

  const [storedId, setStoredId] = useState<number | null>(readStoredId);

  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const selectProject = useCallback((id: number | null) => {
    setStoredId(id);
    try {
      if (id == null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      // storage can be unavailable (private mode); the selection then lasts for this page load only
    }
  }, []);

  // Opening a project URL makes it the current project.
  useEffect(() => {
    if (routeId != null && routeId !== storedId) selectProject(routeId);
  }, [routeId, storedId, selectProject]);

  const currentProject = useMemo(() => {
    const id = routeId ?? storedId;
    return id == null ? null : projects.find((p) => p.id === id) ?? null;
  }, [projects, routeId, storedId]);

  const refreshProjects = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
  }, [queryClient]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      projectsLoading: isLoading,
      projectsError: isError,
      currentProject,
      currentProjectId: currentProject?.id ?? null,
      selectProject,
      refreshProjects,
    }),
    [projects, isLoading, isError, currentProject, selectProject, refreshProjects],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProject = (): ProjectContextValue => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};
