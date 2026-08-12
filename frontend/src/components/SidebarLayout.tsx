import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderGit2, Rocket, Container, Boxes,
  Activity, FileText, Bell, GitBranch, Bot, BookOpen,
  Settings, LogOut, User as UserIcon, Terminal
} from 'lucide-react';

export const SidebarLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, enabled: true },
    { name: 'Projects', path: '/projects', icon: FolderGit2, enabled: true },
    { name: 'Deployments', path: '/projects', icon: Rocket, enabled: true },
    { name: 'Docker management', path: '/docker', icon: Container, enabled: true },
    { name: 'Kubernetes management', path: '/kubernetes', icon: Boxes, enabled: true },
    { name: 'Monitoring dashboard', path: '/monitoring', icon: Activity, enabled: true },
    { name: 'Log management', path: '/logs', icon: FileText, enabled: true },
    { name: 'Notification center', path: '/notifications', icon: Bell, enabled: true },
    { name: 'CI/CD integration', path: '/cicd', icon: GitBranch, enabled: true },
    { name: 'AI assistant', path: '/ai', icon: Bot, enabled: true, ai: true },
    { name: 'Platform guide', path: '/guide', icon: BookOpen, enabled: true },
    { name: 'Settings', path: '#', icon: Settings, enabled: false },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-hidden">
      {/* Sidebar with Glassmorphism */}
      <aside className="w-[260px] glass-panel border-r border-white/40 flex flex-col justify-between shrink-0 shadow-lg relative z-10 m-2 rounded-2xl">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 gap-3 pt-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden transform transition-transform hover:scale-105">
              <img src="/opspilot-logo.png" alt="OpsPilot Logo" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <div>
              <span className="font-bold text-[19px] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">OpsPilot</span>
              <span className="text-[11px] font-medium tracking-wide block text-indigo-500 uppercase">Platform Hub</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path && item.enabled;

              if (!item.enabled) {
                return (
                  <div key={item.name} className="flex items-center justify-between px-3 py-3 rounded-xl text-slate-400 opacity-50 cursor-not-allowed select-none">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{item.name}</span>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Soon</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-300 transform hover:translate-x-1 ${
                    isActive
                      ? item.ai 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg' 
                        : 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                      : item.ai 
                        ? 'text-purple-600 hover:bg-purple-50/50 hover:text-purple-700' 
                        : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  <span>{item.name}</span>
                  {isActive && !item.ai && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  )}
                </Link>
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
