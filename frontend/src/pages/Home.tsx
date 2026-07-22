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
    <div className="min-h-screen bg-[#090D16] text-[#F9FAFB] flex flex-col font-sans selection:bg-[#38BDF8]/30 selection:text-[#38BDF8]">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-[#111827] border-b border-[#374151] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
            className="md:hidden text-[#CBD5E1] hover:text-[#F9FAFB] p-1.5 rounded-lg hover:bg-[#1F2937]"
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
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#1F2937] border border-transparent hover:border-[#374151] transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#1F2937] border border-[#38BDF8] flex items-center justify-center text-[#38BDF8] font-bold text-xs">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#F9FAFB] leading-none">{user.name}</span>
              <span className="text-[11px] text-[#C4B5FD] font-semibold leading-tight mt-1">
                {user.role}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#111827] border border-[#374151] rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-2 border-b border-[#374151]">
                <p className="text-xs font-bold text-[#F9FAFB]">{user.name}</p>
                <p className="text-[11px] text-[#CBD5E1] truncate">{user.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-[#1F2937] text-[#38BDF8] border border-[#374151]">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:text-[#F9FAFB] hover:bg-[#1F2937] flex items-center gap-2 text-left cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-[#94A3B8]" />
                Profile & Settings
              </button>
              <div className="border-t border-[#374151] my-1" />
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-[#1F2937] flex items-center gap-2 text-left cursor-pointer"
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
          className={`fixed md:static inset-y-0 left-0 top-16 z-20 w-64 bg-[#111827] border-r border-[#374151] flex flex-col justify-between p-3 transition-transform duration-200 ${
            isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex flex-col gap-1">
            <div className="px-3 py-2 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
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
                        ? 'bg-[#1F2937] text-[#C4B5FD] border border-[#C4B5FD]/50 font-bold'
                        : 'bg-[#1F2937] text-[#38BDF8] border border-[#38BDF8]/50 font-bold'
                      : item.isAi
                      ? 'text-[#C4B5FD] hover:bg-[#1F2937] font-semibold'
                      : 'text-[#CBD5E1] font-medium hover:text-[#F9FAFB] hover:bg-[#1F2937]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? item.isAi
                          ? 'text-[#C4B5FD]'
                          : 'text-[#38BDF8]'
                        : item.isAi
                        ? 'text-[#C4B5FD]'
                        : 'text-[#94A3B8]'
                    }`}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#374151]">
            <button
              onClick={() => setActiveTab('Settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                activeTab === 'Settings'
                  ? 'bg-[#1F2937] text-[#38BDF8] border border-[#38BDF8]/50 font-bold'
                  : 'text-[#CBD5E1] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
              }`}
            >
              <Settings className="w-4 h-4 text-[#94A3B8]" />
              <span>Settings</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#374151]">
            <div>
              <h1 className="text-2xl font-bold text-[#F9FAFB] tracking-tight">
                Welcome back, {user.name}
              </h1>
              <p className="text-xs font-medium text-[#CBD5E1] mt-1">
                OpsPilot internal developer platform status & operational metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F2937] text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
                <span className="text-xs font-semibold text-[#CBD5E1]">Active Projects</span>
                <div className="p-2 rounded-lg bg-[#1F2937] text-[#38BDF8]">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#F9FAFB]">14</span>
                <span className="text-xs text-emerald-400 flex items-center font-bold">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +2 this month
                </span>
              </div>
            </Card>

            <Card hoverEffect>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#CBD5E1]">Running Deployments</span>
                <div className="p-2 rounded-lg bg-[#1F2937] text-[#38BDF8]">
                  <Rocket className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#F9FAFB]">42</span>
                <span className="text-xs text-[#CBD5E1] font-medium">K8s & Docker</span>
              </div>
            </Card>

            <Card hoverEffect className="border-l-4 border-l-[#F59E0B]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#CBD5E1]">Open Alerts</span>
                <div className="p-2 rounded-lg bg-[#1F2937] text-[#F59E0B]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#F59E0B]">3</span>
                <span className="text-xs text-[#F59E0B] font-bold">Requires review</span>
              </div>
            </Card>

            <Card hoverEffect>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#CBD5E1]">Uptime %</span>
                <div className="p-2 rounded-lg bg-[#1F2937] text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#F9FAFB]">99.98%</span>
                <span className="text-xs text-emerald-400 font-bold">SLA Target met</span>
              </div>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#F9FAFB]">Recent Activity</h2>
              <span className="text-xs font-semibold text-[#38BDF8] cursor-pointer hover:underline">
                View all logs &rarr;
              </span>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-[#374151]">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 flex items-center justify-between hover:bg-[#1F2937] transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      {activity.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {activity.status === 'warning' && (
                        <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                      )}
                      {activity.status === 'danger' && (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#F9FAFB]">
                          {activity.title}
                        </span>
                        <span className="text-xs text-[#CBD5E1] mt-0.5">
                          Target service: <code className="text-[#38BDF8] font-mono bg-[#1E293B] px-1.5 py-0.5 rounded border border-[#475569]">{activity.service}</code>
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-[#CBD5E1] whitespace-nowrap ml-4">
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
