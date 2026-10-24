import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronsUpDown,
  FolderGit2,
  Plus,
  Check,
  Search,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { CreateProjectModal } from './CreateProjectModal';

export const ProjectSwitcher: React.FC = () => {
  const { projects, projectsLoading, projectsError, currentProject, selectProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectProject = (projectId: number | null) => {
    selectProject(projectId);
    setIsOpen(false);
    setSearch('');

    if (projectId === null) {
      navigate('/projects');
      return;
    }

    // Keep the user on the same sub-page (logs, integrations ...) if applicable
    const subMatch = location.pathname.match(/^\/projects\/\d+(\/(?:integrations|logs|details))/);
    navigate(`/projects/${projectId}${subMatch ? subMatch[1] : ''}`);
  };

  const filteredProjects = projects.filter((p) => {
    const name = (p.name ?? p.projectName ?? '').toLowerCase();
    const env = (p.environment ?? '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || env.includes(q);
  });

  const getEnvBadge = (env?: string) => {
    if (!env) return null;
    const lower = env.toLowerCase();
    if (lower === 'prod' || lower === 'production') {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 uppercase">PROD</span>;
    }
    if (lower === 'staging') {
      return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 uppercase">STG</span>;
    }
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80 uppercase">DEV</span>;
  };

  return (
    <div className="px-3 pb-3 relative" ref={dropdownRef}>
      {/* Header Label + Quick Add Button */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span>Project Scope</span>
          {currentProject && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Scoped to active project" />
          )}
        </span>
        <button
          onClick={() => setCreating(true)}
          className="text-[10px] font-semibold text-neutral-700 hover:text-black flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-neutral-100 transition-colors"
          title="Create New Project"
        >
          <Plus className="w-3 h-3" />
          <span>New</span>
        </button>
      </div>

      {/* Main Switcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={projectsLoading}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border ${
          isOpen
            ? 'bg-white border-black/40 ring-2 ring-black/5'
            : 'bg-white hover:bg-neutral-50 border-black/10 hover:border-black/25'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform ${
          currentProject
            ? 'bg-black text-white'
            : 'bg-neutral-100 text-neutral-700'
        }`}>
          {currentProject ? <FolderGit2 className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 truncate block">
              {projectsLoading
                ? 'Loading projects...'
                : projectsError
                ? 'Error loading'
                : currentProject
                ? (currentProject.name ?? currentProject.projectName)
                : 'All Projects'}
            </span>
            {currentProject && getEnvBadge(currentProject.environment)}
          </div>
          <span className="text-[10px] font-medium text-slate-400 block truncate">
            {currentProject ? 'Active workspace' : 'Global system scope'}
          </span>
        </div>

        <ChevronsUpDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-black' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-2 animate-fade-in-up">
          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5 transition-all"
            />
          </div>

          {/* Project List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin pr-0.5">
            {/* "All Projects" Option */}
            <button
              type="button"
              onClick={() => handleSelectProject(null)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                currentProject === null
                  ? 'bg-neutral-100 text-black'
                  : 'text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <Layers className="w-3 h-3" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold">All Projects</span>
                  <span className="block text-[9.5px] font-normal text-slate-400">View across all systems</span>
                </div>
              </div>
              {currentProject === null && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
            </button>

            <div className="h-px bg-slate-100 my-1" />

            {/* Individual Projects */}
            {filteredProjects.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                {search ? `No project matching "${search}"` : 'No projects found'}
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = currentProject?.id === p.id;
                const pName = p.name ?? p.projectName;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProject(p.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 text-black'
                        : 'text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 text-[10px] font-bold ${
                        isSelected ? 'bg-black' : 'bg-slate-400'
                      }`}>
                        {pName.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left truncate">
                        <span className="block text-xs font-bold truncate">{pName}</span>
                        {p.environment && (
                          <span className="block text-[9.5px] font-normal text-slate-400 uppercase tracking-tight">
                            {p.environment}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {getEnvBadge(p.environment)}
                      {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 mt-1 border-t border-slate-100 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/projects');
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-black hover:bg-slate-100 transition-colors"
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>All Projects</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setCreating(true);
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-black hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal isOpen={creating} onClose={() => setCreating(false)} />
    </div>
  );
};
