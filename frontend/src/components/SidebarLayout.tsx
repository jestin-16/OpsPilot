import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Rocket,
  Activity,
  FileText,
  Bell,
  LogOut,
  User as UserIcon,
  Terminal,
  Server,
  ShieldCheck,
  GitCommit,
  AlertTriangle,
  Settings,
  GitBranch,
  Layers,
  Menu,
  X,
  FolderGit2,
  BookOpen,
  Radio,
  Gauge,
  KeyRound,
  Eye,
} from 'lucide-react';
import { canAccessRole } from '../utils/roles';
import { useProject } from '../context/ProjectContext';
import { ProjectSwitcher } from './project/ProjectSwitcher';
import { useProjectIntegrations } from '../hooks/useProjectIntegrations';
import { INTEGRATION_TYPES } from '../lib/integrationTypes';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly ('DEVELOPER' | 'DEVOPS' | 'ADMIN')[];
  badge?: string;
  badgeColor?: 'rose' | 'indigo';
}

interface NavGroup {
  title: string;
  badge?: string;
  items: NavItem[];
}

/** Global pages that follow the project chosen in the switcher. */
const SCOPED_PATHS = ['/pipelines', '/deployments', '/incidents', '/github'];

/** Roots that require exact matching so they don't incorrectly stay active on sibling sub-routes */
const EXACT_MATCH_ROOTS = ['/dashboard', '/', '/projects', '/admin', '/kubernetes', '/monitoring'];

const isItemActive = (itemPath: string, currentPath: string): boolean => {
  if (currentPath === itemPath) return true;
  if (EXACT_MATCH_ROOTS.includes(itemPath)) {
    return false;
  }
  return currentPath.startsWith(`${itemPath}/`);
};

export const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { currentProject, currentProjectId, selectProject } = useProject();
  const { data: projectIntegrations = [] } = useProjectIntegrations(currentProjectId, false);
  const pid = currentProjectId;

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        const unread = data.filter(
          (n) => !n.read && !(n as unknown as { isRead?: boolean }).isRead
        ).length;
        setUnreadCount(unread);
      }
    } catch {
      // The badge is best-effort
    }
  }, [user]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups: NavGroup[] = useMemo(() => [
    {
      title: 'PLATFORM',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Projects', path: '/projects', icon: Layers, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: '3D Operations', path: '/operations', icon: Radio, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
      ]
    },
    ...(pid != null ? [{
      title: `${(currentProject?.name ?? currentProject?.projectName ?? 'ACTIVE PROJECT').toUpperCase()}`,
      badge: 'ACTIVE',
      items: [
        { name: 'Overview', path: `/projects/${pid}`, icon: Layers, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        {
          name: 'Integrations',
          path: `/projects/${pid}/integrations`,
          icon: Server,
          roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const,
          badge: projectIntegrations.length > 0 ? `${projectIntegrations.length}` : undefined
        },
        { name: 'Unified Logs', path: `/projects/${pid}/logs`, icon: FileText, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        ...INTEGRATION_TYPES.flatMap((t) => {
          const first = projectIntegrations.find((i) => i.provider === t.type);
          return first ? [{
            name: t.type === 'APP_LOGS' ? 'App Logs' : `${t.label} Logs`,
            path: `/projects/${pid}/logs/${first.id}`,
            icon: Terminal,
            roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const
          }] : [];
        }),
      ]
    }] : []),
    {
      title: 'DELIVERY & CI/CD',
      items: [
        { name: 'Deployments', path: '/deployments', icon: Rocket, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'CI/CD Pipelines', path: '/pipelines', icon: GitBranch, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    },
    {
      title: 'KUBERNETES',
      items: [
        { name: 'Cluster & Workloads', path: '/kubernetes', icon: Server, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Live Pod Logs', path: '/kubernetes/logs', icon: Activity, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
      ]
    },
    {
      title: 'CONTAINERS',
      items: [
        { name: 'Docker Containers', path: '/docker', icon: Terminal, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    },
    {
      title: 'OBSERVABILITY',
      items: [
        { name: 'Live Monitoring', path: '/monitoring', icon: Activity, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Whitebox Metrics', path: '/whitebox', icon: Gauge, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Blackbox Probes', path: '/blackbox', icon: Eye, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'System Logs', path: '/logs', icon: FileText, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Incidents', path: '/incidents', icon: AlertTriangle, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    },
    {
      title: 'SOURCE CONTROL',
      items: [
        { name: 'GitHub Activity', path: '/github', icon: GitCommit, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { name: 'Platform Governance', path: '/admin', icon: ShieldCheck, roles: ['ADMIN'] as const },
        { name: 'Project Oversight', path: '/admin/projects', icon: FolderGit2, roles: ['ADMIN'] as const },
        { name: 'Users & Access', path: '/users', icon: UserIcon, roles: ['ADMIN'] as const },
      ]
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        {
          name: 'Notifications',
          path: '/notifications',
          icon: Bell,
          roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const,
          badge: unreadCount > 0 ? `${unreadCount}` : undefined,
          badgeColor: 'rose'
        },
        { name: 'Platform Guide', path: '/guide', icon: BookOpen, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Security & Auth', path: '/settings/security', icon: KeyRound, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Preferences', path: '/profile', icon: Settings, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    }
  ], [pid, currentProject, projectIntegrations, unreadCount]);

  return (
    <div className="flex h-screen overflow-hidden bg-op-canvas text-op-fg dark:bg-slate-950 dark:text-slate-100 font-sans">
      {mobileNavOpen && (
        <button 
          type="button" 
          aria-label="Close navigation" 
          onClick={() => setMobileNavOpen(false)} 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" 
        />
      )}
      
      <aside className={`fixed inset-y-3 left-3 z-40 flex w-[min(84vw,256px)] flex-col justify-between overflow-hidden rounded-2xl border border-op-border bg-op-surface dark:bg-slate-900/95 dark:border-slate-800 shadow-xl backdrop-blur-2xl transition-transform duration-200 md:relative md:inset-auto md:z-10 md:m-3 md:w-[256px] md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] md:translate-x-0'}`}>
        
        {/* Top Header Deck (Logo & Switcher) */}
        <div className="shrink-0 z-20 bg-op-surface dark:bg-slate-900 border-b border-op-border dark:border-slate-800/80">
          {/* Logo Brand Header */}
          <div className="flex items-center px-4 py-3 gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs border border-slate-200/80 overflow-hidden shrink-0 transform transition-transform hover:scale-105">
              <img src="/opspilot-logo.png" alt="OpsPilot Logo" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[17px] tracking-tight text-op-fg dark:text-white">
                  OpsPilot
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System operational" />
              </div>
              <span className="text-[9px] font-bold tracking-[0.16em] block text-op-muted uppercase">
                Operations Platform
              </span>
            </div>
            <button 
              type="button" 
              aria-label="Close navigation" 
              onClick={() => setMobileNavOpen(false)} 
              className="rounded-lg p-1.5 text-op-muted hover:bg-op-raised hover:text-op-fg md:hidden transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Interactive Project Switcher */}
          <ProjectSwitcher />
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-5 [scrollbar-width:thin] [scrollbar-color:#e2e8f0_transparent] dark:[scrollbar-color:#334155_transparent]">
          <nav className="space-y-5">
            {navGroups.map((group) => {
              const groupItems = group.items.filter((item) => canAccessRole(user?.roles, [...item.roles]));

              if (groupItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[9px] font-extrabold text-op-muted uppercase tracking-[0.16em] truncate">
                      {group.title}
                    </span>
                    {group.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-op-accent/10 text-op-accent border border-op-accent/20 uppercase tracking-wide">
                        {group.badge}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isItemActive(item.path, location.pathname);

                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                            isActive
                              ? 'bg-op-accent/10 text-op-accent border border-op-accent/25 font-bold shadow-xs dark:bg-op-accent/15 dark:text-op-accent'
                              : 'text-op-muted hover:bg-op-raised hover:text-op-fg dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                            isActive
                              ? 'text-op-accent'
                              : 'text-op-muted group-hover:text-op-fg group-hover:scale-105'
                          }`} />
                          <span className="truncate flex-1">{item.name}</span>

                          {item.badge && (
                            <span className={`shrink-0 flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full shadow-xs ${
                              item.badgeColor === 'rose'
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-op-raised text-op-fg border border-op-border'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {isActive && !item.badge && (
                            <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-op-accent" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-op-border dark:border-slate-800/80 bg-op-surface dark:bg-slate-900 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-op-raised/50 border border-op-border dark:border-slate-800 hover:bg-op-raised transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-full bg-op-accent text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="truncate min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-op-fg dark:text-white truncate">{user?.name || 'User'}</span>
                  {user?.roles?.[0] && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-op-accent/10 text-op-accent uppercase border border-op-accent/20">
                      {user.roles[0]}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-medium text-op-muted truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-op-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors shrink-0 ml-1"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto min-h-full w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {/* Mobile Top Bar */}
          <div className="mb-4 flex items-center justify-between gap-3 md:hidden rounded-2xl border border-op-border bg-op-surface p-3 shadow-xs">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                aria-label="Open navigation" 
                onClick={() => setMobileNavOpen(true)} 
                className="rounded-xl border border-op-border bg-op-raised p-2 text-op-fg hover:bg-op-surface transition-colors"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span className="font-extrabold text-sm tracking-tight text-op-fg">OPSPILOT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-op-muted">Online</span>
            </div>
          </div>

          {/* Active Scoped Project Notice */}
          {pid != null && SCOPED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`)) && (
            <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-op-border bg-op-surface p-3.5 text-xs font-medium text-op-fg shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-op-accent" />
                <span>Showing data scoped to <strong>{currentProject?.name ?? currentProject?.projectName ?? 'Active Project'}</strong>.</span>
              </div>
              <button 
                onClick={() => selectProject(null)} 
                className="rounded-xl border border-op-border bg-op-raised px-3 py-1.5 font-bold text-xs text-op-fg hover:bg-op-surface hover:border-op-accent/40 transition-colors shadow-xs"
              >
                Show all projects
              </button>
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
};
