import React, { useState } from 'react';
import {
  FolderGit2,
  Rocket,
  AlertTriangle,
  Activity,
  Server,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Zap,
  Terminal,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

interface UserSession {
  name: string;
  email: string;
  role: string;
}

interface DashboardViewProps {
  user: UserSession;
  onNavigateTab: (tabName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onNavigateTab }) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'warning' | 'danger'>('all');

  const environments = [
    { name: 'Production (AWS us-east-1)', status: 'Healthy', pods: 24, latency: '42ms', uptime: '99.99%', health: 'success' },
    { name: 'Staging (Kubernetes eu-west-1)', status: 'Warning', pods: 12, latency: '118ms', uptime: '99.85%', health: 'warning' },
    { name: 'Development (Local Docker)', status: 'Healthy', pods: 6, latency: '12ms', uptime: '100%', health: 'success' },
  ];

  const recentActivity = [
    {
      id: 'act-1',
      title: 'Deployment #482 to production-us-east succeeded',
      time: '10 mins ago',
      status: 'success',
      service: 'payment-gateway',
      author: 'Alex Mercer',
    },
    {
      id: 'act-2',
      title: 'Pod memory threshold high on k8s-cluster-01',
      time: '24 mins ago',
      status: 'warning',
      service: 'analytics-worker',
      author: 'System Monitor',
    },
    {
      id: 'act-3',
      title: 'New project repository linked: billing-service',
      time: '1 hour ago',
      status: 'success',
      service: 'billing-service',
      author: 'Sarah Chen',
    },
    {
      id: 'act-4',
      title: 'Jenkins Pipeline #108 failed during integration test',
      time: '2 hours ago',
      status: 'danger',
      service: 'auth-service',
      author: 'Marcus Vance',
    },
    {
      id: 'act-5',
      title: 'Prometheus alert resolved: DB connection pool recovered',
      time: '4 hours ago',
      status: 'success',
      service: 'postgres-primary',
      author: 'Prometheus Auto-heal',
    },
    {
      id: 'act-6',
      title: 'AI Root Cause Analysis completed for Incident #904',
      time: '5 hours ago',
      status: 'success',
      service: 'opspilot-brain',
      author: 'OpsPilot AI',
    },
  ];

  const filteredActivity = recentActivity.filter(
    (item) => filterStatus === 'all' || item.status === filterStatus
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-op-surface via-op-raised to-op-surface border border-op-border rounded-2xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-op-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 w-48 h-48 bg-op-highlight/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-op-accent/15 text-op-accent border border-op-accent/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> OpsPilot IDP v2.4 Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-op-success/15 text-op-success border border-op-success/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-op-success animate-pulse" /> AWS & K8s Connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-op-fg tracking-tight mt-1">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-op-muted max-w-2xl">
              Internal Developer Platform Overview • Active user role: <strong className="text-op-accent">{user.role}</strong>. Real-time telemetry, automated pipelines & AI-assisted operational health.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <Button
              variant="secondary"
              onClick={() => onNavigateTab('AI Assistant')}
              className="text-xs py-2.5 px-4 flex items-center gap-1.5 text-op-highlight border-op-highlight/40 hover:bg-op-highlight/10"
            >
              <Sparkles className="w-4 h-4" /> AI Diagnostics
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigateTab('Deployments')}
              className="text-xs py-2.5 px-4 flex items-center gap-1.5"
            >
              <Rocket className="w-4 h-4" /> New Deployment
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect className="relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-op-muted uppercase tracking-wider">Active Projects</span>
            <div className="p-2.5 rounded-xl bg-op-accent/10 text-op-accent border border-op-accent/20 group-hover:scale-110 transition-transform">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-op-fg">14</span>
            <span className="text-xs text-op-success flex items-center font-bold bg-op-success/10 px-2 py-0.5 rounded border border-op-success/20">
              <TrendingUp className="w-3 h-3 mr-1" /> +2 this week
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-op-border/60 flex items-center justify-between text-[11px] text-op-subtle">
            <span>12 Microservices</span>
            <span className="text-op-accent cursor-pointer hover:underline font-semibold" onClick={() => onNavigateTab('Projects')}>View Repos &rarr;</span>
          </div>
        </Card>

        <Card hoverEffect className="relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-op-muted uppercase tracking-wider">Active Deployments</span>
            <div className="p-2.5 rounded-xl bg-op-accent/10 text-op-accent border border-op-accent/20 group-hover:scale-110 transition-transform">
              <Rocket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-op-fg">42</span>
            <span className="text-xs text-op-accent font-bold bg-op-accent/10 px-2 py-0.5 rounded border border-op-accent/20">
              3 In-Progress
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-op-border/60 flex items-center justify-between text-[11px] text-op-subtle">
            <span>98.4% Success Rate</span>
            <span className="text-op-accent cursor-pointer hover:underline font-semibold" onClick={() => onNavigateTab('Deployments')}>Pipelines &rarr;</span>
          </div>
        </Card>

        <Card hoverEffect className="relative overflow-hidden group border-l-4 border-l-op-warn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-op-muted uppercase tracking-wider">Active Alerts</span>
            <div className="p-2.5 rounded-xl bg-op-warn/10 text-op-warn border border-op-warn/20 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-op-warn">3</span>
            <span className="text-xs text-op-warn font-bold bg-op-warn/10 px-2 py-0.5 rounded border border-op-warn/20">
              1 Critical
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-op-border/60 flex items-center justify-between text-[11px] text-op-subtle">
            <span>Prometheus & K8s</span>
            <span className="text-op-warn cursor-pointer hover:underline font-semibold" onClick={() => onNavigateTab('Notifications')}>Review &rarr;</span>
          </div>
        </Card>

        <Card hoverEffect className="relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-op-muted uppercase tracking-wider">Overall Uptime</span>
            <div className="p-2.5 rounded-xl bg-op-success/10 text-op-success border border-op-success/20 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-op-fg">99.98%</span>
            <span className="text-xs text-op-success font-bold bg-op-success/10 px-2 py-0.5 rounded border border-op-success/20">
              SLA Met
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-op-border/60 flex items-center justify-between text-[11px] text-op-subtle">
            <span>Latency: avg 38ms</span>
            <span className="text-op-accent cursor-pointer hover:underline font-semibold" onClick={() => onNavigateTab('Monitoring')}>Metrics &rarr;</span>
          </div>
        </Card>
      </div>

      {/* Cluster Environments Topology Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-op-fg flex items-center gap-2">
                <Server className="w-4 h-4 text-op-accent" /> Cluster & Infrastructure Health
              </h2>
              <p className="text-xs text-op-muted">Real-time status across target cloud deployment environments</p>
            </div>
            <div className="flex items-center bg-op-raised border border-op-border rounded-lg p-0.5 text-xs">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    timeRange === range
                      ? 'bg-op-accent text-op-accent-fg shadow-sm'
                      : 'text-op-muted hover:text-op-fg'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {environments.map((env) => (
              <Card key={env.name} hoverEffect className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      env.health === 'success' ? 'bg-op-success/15 text-op-success border border-op-success/30' : 'bg-op-warn/15 text-op-warn border border-op-warn/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${env.health === 'success' ? 'bg-op-success' : 'bg-op-warn'} animate-pulse`} />
                      {env.status}
                    </span>
                    <span className="text-[11px] font-mono text-op-subtle">{env.pods} Pods</span>
                  </div>
                  <h3 className="text-xs font-bold text-op-fg line-clamp-1">{env.name}</h3>
                </div>

                <div className="mt-4 pt-3 border-t border-op-border flex items-center justify-between text-xs text-op-muted font-mono">
                  <div>
                    <span className="text-[10px] block text-op-subtle font-sans">Latency</span>
                    <span className="font-bold text-op-fg">{env.latency}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] block text-op-subtle font-sans">Uptime</span>
                    <span className="font-bold text-op-success">{env.uptime}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Deployment Velocity Mock Telemetry Chart */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-op-highlight" />
                <span className="text-xs font-bold text-op-fg">Deployment Velocity & Incident Telemetry</span>
              </div>
              <span className="text-[11px] font-mono text-op-muted">Live 60-min window</span>
            </div>

            <div className="h-40 w-full flex items-end justify-between gap-1.5 pt-4 pb-2 px-2 bg-op-bg/60 rounded-xl border border-op-border/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#363d4d15_1px,transparent_1px),linear-gradient(to_bottom,#363d4d15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              {[45, 60, 35, 80, 95, 70, 85, 40, 65, 90, 100, 75, 85, 92, 78, 88].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative z-10">
                  <div
                    style={{ height: `${val}%` }}
                    className="w-full max-w-[18px] bg-gradient-to-t from-op-accent/40 to-op-accent rounded-t transition-all group-hover:from-op-accent group-hover:to-op-accent-hover cursor-pointer relative"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-op-surface text-[10px] text-op-fg font-mono px-2 py-0.5 rounded border border-op-border shadow-lg pointer-events-none whitespace-nowrap z-20">
                      {val} deploys/h
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-op-subtle font-mono px-1">
              <span>18:00</span>
              <span>18:15</span>
              <span>18:30</span>
              <span>18:45</span>
              <span>19:00 (Current)</span>
            </div>
          </Card>
        </div>

        {/* Right Sidebar: AI Operational Assistant & Quick Shortcuts */}
        <div className="flex flex-col gap-4">
          <Card className="bg-gradient-to-b from-op-surface to-op-raised border-op-highlight/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-op-highlight/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-op-highlight/20 text-op-highlight">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-op-fg uppercase tracking-wider">OpsPilot AI Insights</h3>
            </div>
            <p className="text-xs text-op-muted leading-relaxed mb-4">
              AI model evaluated <strong className="text-op-fg">Incident #904</strong>: Microservice memory leak in <code className="text-op-accent font-mono">analytics-worker</code> resolved via automated pod scale-up.
            </p>
            <div className="bg-op-bg/80 border border-op-border p-3 rounded-lg flex flex-col gap-2 mb-4">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-op-subtle font-medium">Deployment Risk Score:</span>
                <span className="text-op-success font-bold font-mono">Low (12/100)</span>
              </div>
              <div className="w-full bg-op-input h-1.5 rounded-full overflow-hidden">
                <div className="bg-op-success h-full w-[12%]" />
              </div>
            </div>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => onNavigateTab('AI Assistant')}
              className="text-xs py-2 text-op-highlight border-op-highlight/30 hover:bg-op-highlight/15"
            >
              Open AI Brain &rarr;
            </Button>
          </Card>

          <Card className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-op-fg uppercase tracking-wider flex items-center justify-between">
              <span>Platform Quick Actions</span>
              <Zap className="w-3.5 h-3.5 text-op-accent" />
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigateTab('Projects')}
                className="w-full p-2.5 rounded-lg bg-op-raised border border-op-border hover:border-op-accent/50 text-left text-xs font-semibold text-op-fg flex items-center justify-between transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-op-accent" />
                  Connect New GitHub Repo
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-op-subtle group-hover:text-op-accent" />
              </button>
              <button
                onClick={() => onNavigateTab('Kubernetes')}
                className="w-full p-2.5 rounded-lg bg-op-raised border border-op-border hover:border-op-accent/50 text-left text-xs font-semibold text-op-fg flex items-center justify-between transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-op-accent" />
                  Inspect K8s Pod Topology
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-op-subtle group-hover:text-op-accent" />
              </button>
              <button
                onClick={() => onNavigateTab('Logs')}
                className="w-full p-2.5 rounded-lg bg-op-raised border border-op-border hover:border-op-accent/50 text-left text-xs font-semibold text-op-fg flex items-center justify-between transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-op-accent" />
                  Stream Centralized Logs
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-op-subtle group-hover:text-op-accent" />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-op-fg">Recent Platform Operations</h2>
            <p className="text-xs text-op-muted">Audit log of system deployments, pipeline triggers & alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-op-subtle font-medium">Filter:</span>
            <div className="flex items-center bg-op-raised border border-op-border rounded-lg p-0.5 text-xs">
              {(['all', 'success', 'warning', 'danger'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md transition-all capitalize font-semibold cursor-pointer ${
                    filterStatus === st
                      ? 'bg-op-accent text-op-accent-fg shadow-sm'
                      : 'text-op-muted hover:text-op-fg'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-op-border">
            {filteredActivity.map((activity) => (
              <div
                key={activity.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-op-raised transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  {activity.status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-op-success flex-shrink-0 mt-0.5" />
                  )}
                  {activity.status === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-op-warn flex-shrink-0 mt-0.5" />
                  )}
                  {activity.status === 'danger' && (
                    <XCircle className="w-4 h-4 text-op-danger flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-op-fg">
                      {activity.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-op-muted">
                        Service: <code className="text-op-accent font-mono bg-op-input px-1.5 py-0.5 rounded border border-op-border">{activity.service}</code>
                      </span>
                      <span className="text-[11px] text-op-subtle">•</span>
                      <span className="text-[11px] text-op-subtle">
                        Triggered by <strong className="text-op-fg font-medium">{activity.author}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-op-muted">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-op-subtle" />
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
