import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Rocket,
  Box,
  Server,
  Activity,
  FileText,
  Bell,
  Sparkles,
  Settings,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  Search,
  Globe,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { DashboardView } from '../components/views/DashboardView';
import { ProjectsView } from '../components/views/ProjectsView';
import { DeploymentsView } from '../components/views/DeploymentsView';
import { DockerView } from '../components/views/DockerView';
import { KubernetesView } from '../components/views/KubernetesView';
import { MonitoringView } from '../components/views/MonitoringView';
import { LogsView } from '../components/views/LogsView';
import { NotificationsView } from '../components/views/NotificationsView';
import { AiAssistantView } from '../components/views/AiAssistantView';
import { SettingsView } from '../components/views/SettingsView';

interface UserSession {
  name: string;
  email: string;
  role: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession>({
    name: 'Alex Mercer',
    email: 'alex.mercer@opspilot.internal',
    role: 'DevOps Engineer',
  });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedEnv, setSelectedEnv] = useState('Production (AWS us-east-1)');

  useEffect(() => {
    const stored = localStorage.getItem('opspilot_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) {
          setUser(parsed);
        }
      } catch (err) {
        // Fallback
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('opspilot_user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Projects', icon: FolderGit2 },
    { name: 'Deployments', icon: Rocket },
    { name: 'Docker', icon: Box },
    { name: 'Kubernetes', icon: Server },
    { name: 'Monitoring', icon: Activity },
    { name: 'Logs', icon: FileText },
    { name: 'Notifications', icon: Bell, badge: 3 },
    { name: 'AI Assistant', icon: Sparkles, isAi: true },
  ];

  return (
    <div className="min-h-screen text-op-fg flex flex-col font-sans bg-op-bg selection:bg-op-accent/30 selection:text-op-accent">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-op-surface/90 border-b border-op-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
            className="md:hidden text-op-muted hover:text-op-fg p-1.5 rounded-lg hover:bg-op-raised cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isSidebarMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo size="md" />

          {/* Environment Switcher */}
          <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1 rounded-lg bg-op-raised border border-op-border text-xs">
            <Globe className="w-3.5 h-3.5 text-op-accent" />
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="bg-transparent text-op-fg text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="Production (AWS us-east-1)" className="bg-op-surface">Production (AWS us-east-1)</option>
              <option value="Staging (K8s eu-west-1)" className="bg-op-surface">Staging (K8s eu-west-1)</option>
              <option value="Dev Sandbox (Local Docker)" className="bg-op-surface">Dev Sandbox (Local Docker)</option>
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center relative w-64 lg:w-80">
          <Search className="w-4 h-4 text-op-subtle absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search microservices, pods, logs (Cmd+K)..."
            onClick={() => alert('Search shortcut activated. Enter any service name or log ID.')}
            className="w-full bg-op-input text-op-fg text-xs rounded-xl border border-op-border-strong pl-9 pr-3 py-1.5 outline-none focus:border-op-accent transition-colors"
          />
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-op-raised border border-transparent hover:border-op-border transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-op-raised border-2 border-op-accent flex items-center justify-center text-op-accent font-extrabold text-xs">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-op-fg leading-none">{user.name}</span>
              <span className="text-[10px] text-op-accent font-semibold leading-tight mt-1">
                {user.role}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-op-subtle" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-op-surface border border-op-border rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-2 border-b border-op-border">
                <p className="text-xs font-bold text-op-fg">{user.name}</p>
                <p className="text-[11px] text-op-muted truncate">{user.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-op-raised text-op-accent border border-op-border">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveTab('Settings');
                  setIsUserMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-op-muted hover:text-op-fg hover:bg-op-raised flex items-center gap-2 text-left cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-op-subtle" />
                Profile & Settings
              </button>
              <div className="border-t border-op-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-xs font-semibold text-op-danger hover:bg-op-raised flex items-center gap-2 text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 top-16 z-20 w-64 bg-op-surface/95 border-r border-op-border flex flex-col justify-between p-3 transition-transform duration-200 backdrop-blur-md ${
            isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex flex-col gap-1">
            <div className="px-3 py-2 text-[10px] font-extrabold text-op-subtle uppercase tracking-wider">
              Platform Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name);
                    setIsSidebarMobileOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? item.isAi
                        ? 'bg-op-raised text-op-highlight border border-op-highlight/50 font-extrabold shadow-sm'
                        : 'bg-op-raised text-op-accent border border-op-accent/50 font-extrabold shadow-sm'
                      : item.isAi
                      ? 'text-op-highlight hover:bg-op-raised font-semibold'
                      : 'text-op-muted font-medium hover:text-op-fg hover:bg-op-raised'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? item.isAi
                            ? 'text-op-highlight'
                            : 'text-op-accent'
                          : item.isAi
                          ? 'text-op-highlight'
                          : 'text-op-subtle'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-op-highlight text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-op-border">
            <button
              onClick={() => {
                setActiveTab('Settings');
                setIsSidebarMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                activeTab === 'Settings'
                  ? 'bg-op-raised text-op-accent border border-op-accent/50 font-extrabold'
                  : 'text-op-muted hover:text-op-fg hover:bg-op-raised'
              }`}
            >
              <Settings className="w-4 h-4 text-op-subtle" />
              <span>Platform Settings</span>
            </button>
          </div>
        </aside>

        {/* Main Dynamic Viewport */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'Dashboard' && <DashboardView user={user} onNavigateTab={setActiveTab} />}
          {activeTab === 'Projects' && <ProjectsView />}
          {activeTab === 'Deployments' && <DeploymentsView />}
          {activeTab === 'Docker' && <DockerView />}
          {activeTab === 'Kubernetes' && <KubernetesView />}
          {activeTab === 'Monitoring' && <MonitoringView />}
          {activeTab === 'Logs' && <LogsView />}
          {activeTab === 'Notifications' && <NotificationsView />}
          {activeTab === 'AI Assistant' && <AiAssistantView />}
          {activeTab === 'Settings' && <SettingsView user={user} />}
        </main>
      </div>
    </div>
  );
};
