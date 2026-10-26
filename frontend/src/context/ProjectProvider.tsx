import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMatch } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { ProjectContext, readStoredId, STORAGE_KEY, type ProjectContextValue } from './ProjectContext';

/** Must sit inside both the Router (reads the :id route param) and the AuthProvider. */
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const routeMatch = useMatch('/projects/:id/*');
  const routeId = routeMatch && /^\d+$/.test(routeMatch.params.id ?? '') ? Number(routeMatch.params.id) : null;

  const [storedId, setStoredId] = useState<number | null>(readStoredId);

  const { data: projects = [], isLoading, isError } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => api.getProjects(),
    enabled: isAuthenticated && !!user,
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

  // Sync stored project when authentication state changes or user switches
  useEffect(() => {
    if (!isAuthenticated) {
      setStoredId(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, [isAuthenticated]);

  // Ensure storedId belongs to the current user's projects once loaded
  useEffect(() => {
    if (!isLoading && isAuthenticated && projects.length > 0) {
      if (storedId != null && !projects.some((p) => p.id === storedId) && routeId == null) {
        selectProject(projects[0].id);
      }
    } else if (!isLoading && isAuthenticated && projects.length === 0 && storedId != null && routeId == null) {
      selectProject(null);
    }
  }, [isLoading, isAuthenticated, projects, storedId, routeId, selectProject]);

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
