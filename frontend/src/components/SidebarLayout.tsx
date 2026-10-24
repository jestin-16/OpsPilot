import React, { useEffect, useState } from 'react';
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

export const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { currentProject, currentProjectId, selectProject } = useProject();
  const { data: projectIntegrations = [] } = useProjectIntegrations(currentProjectId, false);
  const pid = currentProjectId;

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getNotifications();
      const unread = data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch {
      // The badge is best-effort; the notifications page shows errors.
    }
  };

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups: NavGroup[] = [
    {
      title: 'PLATFORM',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
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
        { name: 'System Logs', path: pid != null ? `/projects/${pid}/logs` : '/logs', icon: FileText, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
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
        { name: 'Users & Access', path: '/users', icon: UserIcon, roles: ['ADMIN'] as const },
        { name: 'Security & Auth', path: '/settings/security', icon: ShieldCheck, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Preferences', path: '/profile', icon: Settings, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans text-[#111111]">
      {mobileNavOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-30 bg-black/25 md:hidden" />}
      <aside className={`fixed inset-y-3 left-3 z-40 flex w-[min(84vw,252px)] flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white transition-transform duration-200 md:relative md:inset-auto md:z-10 md:m-3 md:w-[252px] md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] md:translate-x-0'}`}>
        {/* Scrollable Nav Area with Smooth Hidden/Thin Scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:#e2e8f0_transparent] hover:[scrollbar-color:#cbd5e1_transparent]">
          {/* Logo Brand Header */}
          <div className="h-18 flex items-center px-4 gap-3 pt-3 pb-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden shrink-0 transform transition-transform hover:scale-105">
              <img src="/opspilot-logo.png" alt="OpsPilot Logo" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[18px] tracking-tight text-black">
                  OpsPilot
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System operational" />
              </div>
              <span className="text-[9px] font-semibold tracking-[0.15em] block text-neutral-500 uppercase">
                Operations Platform
              </span>
            </div>
            <button type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 md:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Interactive Project Switcher (Dropdown with Search & Actions) */}
          <ProjectSwitcher />

          {/* Navigation Links */}
          <nav className="px-3 pb-4 space-y-5">
            {navGroups.map((group) => {
              const groupItems = group.items.filter((item) => canAccessRole(user?.roles, [...item.roles]));

              if (groupItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[9px] font-semibold text-neutral-500 uppercase tracking-[0.14em] truncate">
                      {group.title}
                    </span>
                    {group.badge && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-black/10 uppercase">
                        {group.badge}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname + location.search === item.path || location.pathname === item.path;

                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-neutral-100 text-black border border-black/10 font-bold'
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            isActive
                              ? 'text-black'
                              : 'text-neutral-400 group-hover:text-black'
                          }`} />
                          <span className="truncate flex-1">{item.name}</span>

                          {item.badge && (
                            <span className={`shrink-0 flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full shadow-xs ${
                              item.badgeColor === 'rose'
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {isActive && !item.badge && (
                            <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-black" />
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

        {/* User Card Profile Footer */}
        <div className="p-3 border-t border-black/10 bg-white">
          <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/80 transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shrink-0 text-xs font-semibold">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="truncate min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 truncate">{user?.name || 'User'}</span>
                  {user?.roles?.[0] && (
                    <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-slate-100 text-slate-600 uppercase border border-slate-200">
                      {user.roles[0]}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-medium text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-0 flex-1 overflow-y-auto">
        <div className="mx-auto min-h-full w-full max-w-[1600px] px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
          <div className="mb-5 flex items-center gap-3 md:hidden">
            <button type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)} className="rounded-full border border-black/10 bg-white p-2.5 text-black hover:bg-neutral-50">
              <Menu className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs font-bold tracking-[0.12em] text-black">OPS/PILOT</span>
          </div>
          {pid != null && SCOPED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`)) && (
            <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-700">
              <span>Showing data for <strong>{currentProject?.name ?? currentProject?.projectName ?? 'the selected project'}</strong>.</span>
              <button onClick={() => selectProject(null)} className="rounded-full border border-black/15 bg-white px-3 py-1.5 font-semibold text-black hover:bg-neutral-100 transition-colors">
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
