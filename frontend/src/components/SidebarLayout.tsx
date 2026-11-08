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
  ChevronRight,
} from 'lucide-react';
import { OpsPilotLogo } from './OpsPilotLogo';
import '../styles/dashboard.css';
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

  const activePage = navGroups.flatMap(group => group.items)
    .filter(item => isItemActive(item.path, location.pathname))
    .sort((a, b) => b.path.length - a.path.length)[0]?.name ?? 'Workspace';

  return (
    <div className="dashboard-shell flex h-dvh overflow-hidden bg-op-canvas text-op-fg font-sans">
      <a href="#dashboard-content" className="dashboard-skip-link">Skip to content</a>
      {mobileNavOpen && (
        <button 
          type="button" 
          aria-label="Close navigation" 
          onClick={() => setMobileNavOpen(false)} 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" 
        />
      )}
      
      <aside id="dashboard-navigation" aria-label="Workspace navigation" className={`dashboard-sidebar fixed inset-y-3 left-3 z-40 flex w-[min(86vw,248px)] shrink-0 flex-col justify-between rounded-3xl border border-op-border bg-op-surface transition-transform duration-200 md:relative md:inset-auto md:z-20 md:m-4 md:mr-0 md:w-[232px] md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] md:translate-x-0'}`}>
        
        {/* Top Header Deck (Logo & Switcher) */}
        <div className="shrink-0 z-20 border-b border-op-border">
          {/* Logo Brand Header */}
          <div className="flex items-center px-5 py-6 gap-3">
            <Link to="/dashboard" aria-label="OpsPilot dashboard" className="flex-1 min-w-0">
              <OpsPilotLogo size={34} showWordmark />
            </Link>
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
        <div className="dashboard-nav-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
          <nav className="space-y-5">
            {navGroups.map((group) => {
              const groupItems = group.items.filter((item) => canAccessRole(user?.roles, [...item.roles]));

              if (groupItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[9px] font-medium text-op-muted uppercase tracking-[0.13em] truncate">
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
                          aria-current={isActive ? 'page' : undefined}
                          className={`dashboard-nav-link group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 ${
                            isActive
                              ? 'bg-op-sage-soft text-op-sage'
                              : 'text-op-muted hover:bg-op-raised hover:text-op-fg'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                            isActive
                              ? 'text-op-sage'
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
                            <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-op-sage" />
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
        <div className="p-3 border-t border-op-border shrink-0">
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
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main id="dashboard-content" tabIndex={-1} className="dashboard-main relative min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto min-h-full w-full max-w-[1600px] px-4 pb-8 pt-4 sm:px-6 lg:px-9">
          <header className="dashboard-topbar mb-8 flex min-h-14 items-center justify-between gap-3 rounded-full border border-op-border bg-op-surface px-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label="Open navigation" aria-expanded={mobileNavOpen} aria-controls="dashboard-navigation" onClick={() => setMobileNavOpen(true)} className="rounded-full p-2 text-op-muted hover:bg-op-raised md:hidden">
                <Menu className="h-4 w-4" />
              </button>
              <span className="hidden text-xs text-op-muted sm:inline">Workspace</span>
              <ChevronRight className="hidden h-3 w-3 text-op-subtle sm:block" />
              <span className="truncate text-xs font-medium">{activePage}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Link to="/guide" className="hidden items-center gap-1.5 text-xs text-op-muted hover:text-op-fg sm:flex"><BookOpen className="h-3.5 w-3.5" /> Guide</Link>
              <Link to="/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative rounded-full p-2 text-op-muted hover:bg-op-raised">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />}
              </Link>
              <Link to="/profile" aria-label="Your profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-op-sage-soft text-xs font-semibold text-op-sage">{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</Link>
            </div>
          </header>

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

          <div className="dashboard-page">{children}</div>
        </div>
      </main>
    </div>
  );
};
