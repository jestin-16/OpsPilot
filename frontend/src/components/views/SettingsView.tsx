import React, { useState } from 'react';
import {
  Settings,
  User as UserIcon,
  ShieldCheck,
  Key,
  Save,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

interface UserSession {
  name: string;
  email: string;
  role: string;
}

interface SettingsViewProps {
  user: UserSession;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'rbac' | 'integrations' | 'apikeys'>('profile');
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [userRole, setUserRole] = useState(user.role);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { name: userName, email: userEmail, role: userRole };
    localStorage.setItem('opspilot_user', JSON.stringify(updated));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const integrations = [
    { name: 'AWS Cloud Provider', status: 'Connected (us-east-1)', icon: 'AWS', type: 'Cloud Infrastructure' },
    { name: 'Kubernetes Cluster', status: 'Connected (1.30.2)', icon: 'K8s', type: 'Container Orchestration' },
    { name: 'Jenkins CI/CD Engine', status: 'Connected (v2.440)', icon: 'CI', type: 'Build Automation' },
    { name: 'Prometheus & Grafana', status: 'Connected (Telemetry Active)', icon: 'PROM', type: 'Monitoring' },
    { name: 'GitHub Enterprise', status: 'Connected (@opspilot-org)', icon: 'GIT', type: 'Source Control' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Settings className="w-6 h-6 text-op-accent" /> Platform Settings & Governance
          </h1>
          <p className="text-xs text-op-muted mt-1">
            User preferences, Role-Based Access Control (RBAC), third-party integrations & API security tokens.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-op-raised border border-op-border rounded-lg p-0.5 text-xs">
          {(['profile', 'rbac', 'integrations', 'apikeys'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md transition-all font-semibold capitalize cursor-pointer ${
                activeTab === tab
                  ? 'bg-op-accent text-op-accent-fg shadow-sm'
                  : 'text-op-muted hover:text-op-fg'
              }`}
            >
              {tab === 'apikeys' ? 'API Tokens' : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <Card>
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-op-fg flex items-center gap-2 pb-3 border-b border-op-border">
                <UserIcon className="w-4 h-4 text-op-accent" /> User Profile Information
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-op-raised border-2 border-op-accent flex items-center justify-center text-op-accent font-extrabold text-lg">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-op-fg">{userName}</p>
                  <p className="text-xs text-op-muted">{userEmail}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-op-raised text-op-accent border border-op-border">
                    {userRole}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-op-muted">Full Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-op-input text-op-fg text-xs rounded-lg border border-op-border-strong p-2.5 outline-none focus:border-op-accent"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-op-muted">Email Address</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-op-input text-op-fg text-xs rounded-lg border border-op-border-strong p-2.5 outline-none focus:border-op-accent"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-op-muted">Active Platform Role (RBAC)</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full bg-op-input text-op-fg text-xs rounded-lg border border-op-border-strong p-2.5 outline-none focus:border-op-accent cursor-pointer"
                >
                  <option value="Developer">Developer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-op-border">
                {savedSuccess ? (
                  <span className="text-xs text-op-success font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Profile updated!
                  </span>
                ) : (
                  <span className="text-xs text-op-subtle">Changes take effect immediately</span>
                )}

                <Button type="submit" variant="primary" className="text-xs py-2 px-4 flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> Save Profile
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {activeTab === 'rbac' && (
        <Card className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-op-fg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-op-accent" /> Role-Based Access Control (RBAC) Permissions Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-op-fg">
              <thead className="bg-op-raised text-op-subtle uppercase tracking-wider font-semibold border-b border-op-border text-[11px]">
                <tr>
                  <th className="px-4 py-3">Permission Capability</th>
                  <th className="px-4 py-3 text-center">Developer</th>
                  <th className="px-4 py-3 text-center">DevOps Engineer</th>
                  <th className="px-4 py-3 text-center">Administrator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-op-border">
                {[
                  { name: 'View Dashboards & Logs', dev: true, ops: true, admin: true },
                  { name: 'Trigger Deployments to Staging', dev: true, ops: true, admin: true },
                  { name: 'Trigger Deployments to Production', dev: false, ops: true, admin: true },
                  { name: 'Kubernetes Pod Shell Exec', dev: false, ops: true, admin: true },
                  { name: 'Manage Cloud Credentials & API Keys', dev: false, ops: false, admin: true },
                ].map((row) => (
                  <tr key={row.name} className="hover:bg-op-raised/50">
                    <td className="px-4 py-3 font-semibold">{row.name}</td>
                    <td className="px-4 py-3 text-center">{row.dev ? <Check className="w-4 h-4 text-op-success mx-auto" /> : '—'}</td>
                    <td className="px-4 py-3 text-center">{row.ops ? <Check className="w-4 h-4 text-op-success mx-auto" /> : '—'}</td>
                    <td className="px-4 py-3 text-center">{row.admin ? <Check className="w-4 h-4 text-op-success mx-auto" /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => (
            <Card key={item.name} hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-op-raised text-op-accent border border-op-border">
                    {item.icon}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-op-success/15 text-op-success border border-op-success/30">
                    Connected
                  </span>
                </div>
                <h3 className="text-sm font-bold text-op-fg">{item.name}</h3>
                <p className="text-xs text-op-muted mt-1">{item.type} • {item.status}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-op-border flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => alert(`Configuring ${item.name}...`)}
                  className="text-xs py-1.5 px-3"
                >
                  Configure
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'apikeys' && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-op-fg flex items-center gap-2">
              <Key className="w-4 h-4 text-op-accent" /> Active Personal Access Tokens & API Keys
            </h3>
            <Button
              variant="primary"
              onClick={() => alert('Generating new OpsPilot API token...')}
              className="text-xs py-1.5 px-3"
            >
              + Generate New Token
            </Button>
          </div>

          <div className="bg-op-bg/80 border border-op-border p-4 rounded-xl flex items-center justify-between text-xs font-mono">
            <div>
              <span className="font-bold text-op-fg block">OpsPilot CLI Access Token (opspilot_live_...)</span>
              <span className="text-op-subtle text-[11px]">Created: 2026-07-01 • Expires in 90 days</span>
            </div>
            <span className="text-op-accent font-bold">opspilot_live_98a7c2b...</span>
          </div>
        </Card>
      )}
    </div>
  );
};
