import { createContext, useContext } from 'react';
import type { Project } from '../services/api';

export const STORAGE_KEY = 'opspilot_current_project';

export interface ProjectContextValue {
  projects: Project[];
  projectsLoading: boolean;
  projectsError: boolean;
  currentProject: Project | null;
  currentProjectId: number | null;
  /** Remembers the choice; pass null for "all projects". */
  selectProject: (id: number | null) => void;
  refreshProjects: () => Promise<void>;
}

export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const readStoredId = (): number | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

export const useProject = (): ProjectContextValue => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};
