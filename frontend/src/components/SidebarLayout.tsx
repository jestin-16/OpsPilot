import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  LayoutDashboard, FolderGit2, Rocket,
  Activity, FileText, Bell, Plus,
  LogOut, User as UserIcon, Terminal, Server, ShieldCheck, GitCommit, AlertTriangle, Undo2, Settings
} from 'lucide-react';
import { canAccessRole } from '../utils/roles';

export const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getNotifications();
      const unread = data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {}
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

  const navGroups = [
    {
      title: 'OPS PILOT',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    },
    {
      title: 'PROJECTS',
      items: [
        { name: 'All Projects', path: '/projects', icon: FolderGit2, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Add Project', path: '/projects/new', icon: Plus, roles: ['DEVELOPER', 'ADMIN'] as const }
      ]
    },
    {
      title: 'DELIVERY',
      items: [
        { name: 'Deployments', path: '/deployments', icon: Rocket, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'CI/CD Pipelines', path: '/pipelines', icon: Rocket, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Rollbacks', path: '/deployments', icon: Undo2, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    },
    {
      title: 'INFRASTRUCTURE',
      items: [
        { name: 'Docker', path: '/docker', icon: Terminal, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Kubernetes', path: '/kubernetes', icon: Server, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    },
    {
      title: 'OBSERVABILITY',
      items: [
        { name: 'Monitoring', path: '/monitoring', icon: Activity, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Logs', path: '/logs', icon: FileText, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
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
      title: 'SYSTEM',
      items: [
        { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Users & Roles', path: '/users', icon: UserIcon, roles: ['ADMIN'] as const },
        { name: 'Security', path: '/settings/security', icon: ShieldCheck, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const },
        { name: 'Settings', path: '/profile', icon: Settings, roles: ['DEVELOPER', 'DEVOPS', 'ADMIN'] as const }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-hidden">
      {/* Sidebar with Glassmorphism */}
      <aside className="w-[260px] glass-panel border-r border-white/40 flex flex-col justify-between shrink-0 shadow-lg relative z-10 m-2 rounded-2xl">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 gap-3 pt-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden transform transition-transform hover:scale-105">
              <img src="/opspilot-logo.png" alt="OpsPilot Logo" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <div>
              <span className="font-bold text-[19px] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">OpsPilot</span>
              <span className="text-[11px] font-medium tracking-wide block text-indigo-500 uppercase">Platform Hub</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-6">
            {navGroups.map((group) => {
              const groupItems = group.items.filter((item) => canAccessRole(user?.roles, [...item.roles]));
              
              if (groupItems.length === 0) return null;

              return (
                <div key={group.title}>
                  <div className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;

                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 transform hover:translate-x-1 ${
                            isActive
                              ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                              : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600'
                          }`}
                        >
                          <Icon className={`w-[16px] h-[16px] transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                          <span>{item.name}</span>
                          {item.name === 'Notifications' && unreadCount > 0 && (
                            <span className="ml-auto flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-sm animate-pulse">
                              {unreadCount}
                            </span>
                          )}
                          {isActive && item.name !== 'Notifications' && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
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

        {/* User Card */}
        <div className="p-4 border-t border-slate-200/50 bg-white/40 backdrop-blur-md rounded-b-2xl">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/60 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 shrink-0 border border-white shadow-sm group-hover:scale-105 transition-transform">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-[13px] font-bold text-slate-800 truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] font-medium text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all transform hover:rotate-12"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-0 animate-fade-in-up">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-purple-200/30 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
        <div className="h-full w-full max-w-[1600px] mx-auto p-2">
          {children}
        </div>
      </main>
    </div>
  );
};
