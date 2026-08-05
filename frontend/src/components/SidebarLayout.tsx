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
    { name: 'CI/CD integration', path: '#', icon: GitBranch, enabled: false },
    { name: 'AI assistant', path: '#', icon: Bot, enabled: false, ai: true },
    { name: 'Settings', path: '#', icon: Settings, enabled: false },
  ];

  return (
    <div className="flex h-screen bg-[#060B18] text-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F1B2E] border-r border-[#1E2D45] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[#1E2D45] gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#38BDF8] flex items-center justify-center text-[#060B18]">
              <Terminal className="w-5 h-5 font-bold" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#F8FAFC]">OpsPilot</span>
              <span className="text-xs block text-[#94A3B8]">Developer platform</span>
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
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[#94A3B8] opacity-50 cursor-not-allowed select-none ${
                      item.ai ? 'hover:bg-violet-950/20' : 'hover:bg-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${item.ai ? 'text-[#A78BFA]' : ''}`} />
                      <span className={`text-xs font-medium ${item.ai ? 'text-[#A78BFA]' : ''}`}>{item.name}</span>
                    </div>
                    <span className="text-[9px] bg-[#1E2D45] text-[#94A3B8] px-1.5 py-0.5 rounded font-mono uppercase">Soon</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#38BDF8] text-[#060B18] font-semibold'
                      : 'text-[#F8FAFC] hover:bg-[#1E2D45]'
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
        <div className="p-4 border-t border-[#1E2D45] bg-[#0F1B2E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#1E2D45] flex items-center justify-center text-[#38BDF8] shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-[#F8FAFC] truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] text-[#94A3B8] truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg hover:bg-[#1E2D45] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#060B18]">
        {children}
      </main>
    </div>
  );
};
