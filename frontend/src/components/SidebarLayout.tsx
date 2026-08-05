import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderGit2,
  Rocket,
  Container,
  Boxes,
  Activity,
  FileText,
  Bell,
  GitBranch,
  Bot,
  BookOpen,
  Settings,
  LogOut,
  User as UserIcon,
  Terminal
} from 'lucide-react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
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
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#FFFFFF] border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0] gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-[#FFFFFF]">
              <Terminal className="w-5 h-5 font-bold" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#0F172A]">OpsPilot</span>
              <span className="text-xs block text-[#64748B]">Developer platform</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path && item.enabled;

              if (!item.enabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#94A3B8] opacity-50 cursor-not-allowed select-none"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-[#94A3B8]" />
                      <span className="text-xs font-medium text-[#94A3B8]">{item.name}</span>
                    </div>
                    <span className="text-[9px] bg-[#E2E8F0] text-[#64748B] px-1.5 py-0.5 rounded font-mono uppercase">Soon</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? item.ai ? 'bg-[#7C3AED] text-[#FFFFFF] font-bold shadow-sm' : 'bg-[#4F46E5] text-[#FFFFFF] font-semibold shadow-sm'
                      : item.ai ? 'text-[#7C3AED] hover:bg-violet-50 font-semibold' : 'text-[#334155] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#FFFFFF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5] shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-[#0F172A] truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] text-[#64748B] truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {children}
      </main>
    </div>
  );
};
