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
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

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

  useEffect(() => {
    const stored = localStorage.getItem('opspilot_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) {
          setUser(parsed);
        }
      } catch (err) {
        // Fallback to default mock user
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
    { name: 'Notifications', icon: Bell },
    { name: 'AI Assistant', icon: Sparkles, isAi: true },
  ];

  const recentActivity = [
    {
      id: 'act-1',
      title: 'Deployment #482 to production-us-east succeeded',
      time: '10 mins ago',
      status: 'success',
      service: 'payment-gateway',
    },
    {
      id: 'act-2',
      title: 'Pod memory threshold high on k8s-cluster-01',
      time: '24 mins ago',
      status: 'warning',
      service: 'analytics-worker',
    },
    {
      id: 'act-3',
      title: 'New project repository linked: billing-service',
      time: '1 hour ago',
      status: 'success',
      service: 'billing-service',
    },
    {
      id: 'act-4',
      title: 'Jenkins Pipeline #108 failed during integration test',
      time: '2 hours ago',
      status: 'danger',
      service: 'auth-service',
    },
    {
      id: 'act-5',
      title: 'Prometheus alert resolved: DB connection pool recovered',
      time: '4 hours ago',
      status: 'success',
      service: 'postgres-primary',
    },
    {
      id: 'act-6',
      title: 'AI Root Cause Analysis completed for Incident #904',
      time: '5 hours ago',
      status: 'success',
      service: 'opspilot-brain',
    },
  ];

  return (
    <div className="min-h-screen text-op-fg flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-op-surface border-b border-op-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
            className="md:hidden text-op-muted hover:text-op-fg p-1.5 rounded-lg hover:bg-op-raised"
            aria-label="Toggle navigation menu"
          >
            {isSidebarMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo size="md" />
        </div>

        {/* User Profile & Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-op-raised border border-transparent hover:border-op-border transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-op-raised border border-op-accent flex items-center justify-center text-op-accent font-bold text-xs">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-op-fg leading-none">{user.name}</span>
              <span className="text-[11px] text-op-highlight font-semibold leading-tight mt-1">
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
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full px-3 py-2 text-xs font-medium text-op-muted hover:text-op-fg hover:bg-op-raised flex items-center gap-2 text-left cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-op-subtle" />
                Profile & Settings
              </button>
              <div className="border-t border-op-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-xs font-semibold text-op-danger hover:text-op-danger hover:bg-op-raised flex items-center gap-2 text-left cursor-pointer"
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
          className={`fixed md:static inset-y-0 left-0 top-16 z-20 w-64 bg-op-surface border-r border-op-border flex flex-col justify-between p-3 transition-transform duration-200 ${
            isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex flex-col gap-1">
            <div className="px-3 py-2 text-[11px] font-bold text-op-subtle uppercase tracking-wider">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                    isActive
                      ? item.isAi
                        ? 'bg-op-raised text-op-highlight border border-op-highlight/50 font-bold'
                        : 'bg-op-raised text-op-accent border border-op-accent/50 font-bold'
                      : item.isAi
                      ? 'text-op-highlight hover:bg-op-raised font-semibold'
                      : 'text-op-muted font-medium hover:text-op-fg hover:bg-op-raised'
                  }`}
                >
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
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-op-border">
            <button
              onClick={() => setActiveTab('Settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                activeTab === 'Settings'
                  ? 'bg-op-raised text-op-accent border border-op-accent/50 font-bold'
                  : 'text-op-muted hover:text-op-fg hover:bg-op-raised'
              }`}
            >
              <Settings className="w-4 h-4 text-op-subtle" />
              <span>Settings</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-op-border">
            <div>
              <h1 className="text-2xl font-bold text-op-fg tracking-tight">
                Welcome back, {user.name}
              </h1>
              <p className="text-xs font-medium text-op-muted mt-1">
                OpsPilot internal developer platform status & operational metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-op-raised text-op-success border border-op-success/30">
                <span className="w-2 h-2 rounded-full bg-op-success animate-pulse" />
                Cluster Healthy
              </span>
              <Button
                variant="primary"
                onClick={() => alert('Mock trigger: New Deployment Initiated')}
                className="text-xs py-2"
              >
                <Rocket className="w-3.5 h-3.5 mr-1.5 inline" />
                New Deployment
              </Button>
            </div>
          </div>

          {/* 4 Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card hoverEffect>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-op-muted">Active Projects</span>
                <div className="p-2 rounded-lg bg-op-raised text-op-accent">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-op-fg">14</span>
                <span className="text-xs text-op-success flex items-center font-bold">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +2 this month
                </span>
              </div>
            </Card>

            <Card hoverEffect>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-op-muted">Running Deployments</span>
                <div className="p-2 rounded-lg bg-op-raised text-op-accent">
                  <Rocket className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-op-fg">42</span>
                <span className="text-xs text-op-muted font-medium">K8s & Docker</span>
              </div>
            </Card>

            <Card hoverEffect className="border-l-4 border-l-op-warn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-op-muted">Open Alerts</span>
                <div className="p-2 rounded-lg bg-op-raised text-op-warn">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-op-warn">3</span>
                <span className="text-xs text-op-warn font-bold">Requires review</span>
              </div>
            </Card>

            <Card hoverEffect>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-op-muted">Uptime %</span>
                <div className="p-2 rounded-lg bg-op-raised text-op-success">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-op-fg">99.98%</span>
                <span className="text-xs text-op-success font-bold">SLA Target met</span>
              </div>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-op-fg">Recent Activity</h2>
              <span className="text-xs font-semibold text-op-accent cursor-pointer hover:underline">
                View all logs &rarr;
              </span>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-op-border">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 flex items-center justify-between hover:bg-op-raised transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      {activity.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-op-success flex-shrink-0" />
                      )}
                      {activity.status === 'warning' && (
                        <AlertTriangle className="w-4 h-4 text-op-warn flex-shrink-0" />
                      )}
                      {activity.status === 'danger' && (
                        <XCircle className="w-4 h-4 text-op-danger flex-shrink-0" />
                      )}

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-op-fg">
                          {activity.title}
                        </span>
                        <span className="text-xs text-op-muted mt-0.5">
                          Target service: <code className="text-op-accent font-mono bg-op-input px-1.5 py-0.5 rounded border border-op-border-strong">{activity.service}</code>
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-op-muted whitespace-nowrap ml-4">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};
