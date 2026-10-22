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
  Layers
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
      title: 'INFRASTRUCTURE',
      items: [
        { name: 'Kubernetes', path: '/kubernetes', icon: Server, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Docker Containers', path: '/docker', icon: Terminal, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Pod Logs', path: '/kubernetes/logs', icon: Activity, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
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
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-hidden">
      {/* Sleek Modern Glassmorphic Sidebar */}
      <aside className="w-[264px] glass-panel border border-white/60 flex flex-col justify-between shrink-0 shadow-xl shadow-slate-200/50 relative z-10 m-2.5 rounded-2xl overflow-hidden backdrop-blur-2xl">
        {/* Scrollable Nav Area with Smooth Hidden/Thin Scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:#e2e8f0_transparent] hover:[scrollbar-color:#cbd5e1_transparent]">
          {/* Logo Brand Header */}
          <div className="h-18 flex items-center px-4 gap-3 pt-3 pb-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden shrink-0 transform transition-transform hover:scale-105">
              <img src="/opspilot-logo.png" alt="OpsPilot Logo" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[18px] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800">
                  OpsPilot
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System operational" />
              </div>
              <span className="text-[10px] font-bold tracking-wider block text-indigo-500 uppercase">
                Enterprise Cloud Hub
              </span>
            </div>
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
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
                      {group.title}
                    </span>
                    {group.badge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200/60 uppercase">
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
                              ? 'bg-gradient-to-r from-indigo-50/90 to-purple-50/50 text-indigo-700 shadow-xs border border-indigo-100 font-bold'
                              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:translate-x-1'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            isActive
                              ? 'text-indigo-600 scale-105'
                              : 'text-slate-400 group-hover:text-indigo-500'
                          }`} />
                          <span className="truncate flex-1">{item.name}</span>

                          {item.badge && (
                            <span className={`shrink-0 flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full shadow-xs ${
                              item.badgeColor === 'rose'
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {isActive && !item.badge && (
                            <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
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
        <div className="p-3 border-t border-slate-200/60 bg-white/50 backdrop-blur-md">
          <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/80 transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-xs">
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
      <main className="flex-1 overflow-y-auto relative z-0 animate-fade-in-up">
        {/* Decorative background ambient glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/25 blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-purple-200/25 blur-[140px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
        <div className="h-full w-full max-w-[1600px] mx-auto p-2">
          {pid != null && SCOPED_PATHS.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`)) && (
            <div role="status" className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-2 text-xs font-semibold text-indigo-800 sm:mx-8 shadow-xs">
              <span>Showing data for <strong>{currentProject?.name ?? currentProject?.projectName ?? 'the selected project'}</strong>.</span>
              <button onClick={() => selectProject(null)} className="rounded-md border border-indigo-200 bg-white px-2.5 py-1 font-bold text-indigo-700 hover:bg-indigo-100 transition-colors">
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
