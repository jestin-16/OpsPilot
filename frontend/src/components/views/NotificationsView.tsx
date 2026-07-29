import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  Check,
  Volume2,
  Mail,
  Smartphone,
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

export const NotificationsView: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'critical'>('all');

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'High CPU Memory Threshold on analytics-worker-64b58498f',
      type: 'warning',
      category: 'Kubernetes Pod',
      time: '24 mins ago',
      read: false,
      channel: 'Slack #devops-alerts',
    },
    {
      id: 'notif-2',
      title: 'Jenkins Pipeline #108 failed during integration testing',
      type: 'critical',
      category: 'CI/CD Pipeline',
      time: '2 hours ago',
      read: false,
      channel: 'PagerDuty',
    },
    {
      id: 'notif-3',
      title: 'Deployment #482 to production-us-east completed successfully',
      type: 'info',
      category: 'Deployment',
      time: '3 hours ago',
      read: true,
      channel: 'Email / AWS SNS',
    },
    {
      id: 'notif-4',
      title: 'Prometheus DB pool connection recovered automatically',
      type: 'info',
      category: 'Monitoring',
      time: '4 hours ago',
      read: true,
      channel: 'Slack #devops-alerts',
    },
    {
      id: 'notif-5',
      title: 'OpsPilot Phase 2 AI Model trained on 10,000 incident traces',
      type: 'info',
      category: 'AI Assistant',
      time: '1 day ago',
      read: true,
      channel: 'Platform HUD',
    },
  ]);

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    if (filterType === 'critical') return n.type === 'critical';
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-op-border">
        <div>
          <h1 className="text-2xl font-bold text-op-fg flex items-center gap-2 tracking-tight">
            <Bell className="w-6 h-6 text-op-accent" /> Alert Center & Notification Rules
          </h1>
          <p className="text-xs text-op-muted mt-1">
            System notifications, incident escalation channels (Slack, PagerDuty, Email) & alert severity rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={markAllRead}
            className="text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-op-accent" /> Mark All as Read
          </Button>
        </div>
      </div>

      {/* Integration Status Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hoverEffect className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-op-accent/15 text-op-accent border border-op-accent/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-op-fg">Slack #devops-alerts</h3>
              <p className="text-[11px] text-op-muted">Connected • Auto-dispatch</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-op-success/15 text-op-success border border-op-success/30">Active</span>
        </Card>

        <Card hoverEffect className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-op-highlight/15 text-op-highlight border border-op-highlight/30">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-op-fg">PagerDuty Escalation</h3>
              <p className="text-[11px] text-op-muted">Critical Incidents Only</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-op-success/15 text-op-success border border-op-success/30">Active</span>
        </Card>

        <Card hoverEffect className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-op-raised text-op-muted border border-op-border">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-op-fg">AWS SNS Digest</h3>
              <p className="text-[11px] text-op-muted">Daily Summary Email</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-op-raised text-op-muted border border-op-border">Enabled</span>
        </Card>
      </div>

      {/* Notifications Filter & List */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-op-raised border border-op-border rounded-lg p-0.5 text-xs">
            {(['all', 'unread', 'critical'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-md transition-all font-semibold capitalize cursor-pointer ${
                  filterType === t
                    ? 'bg-op-accent text-op-accent-fg shadow-sm'
                    : 'text-op-muted hover:text-op-fg'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="text-xs font-mono text-op-subtle">{filteredNotifs.length} items</span>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-op-border">
            {filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  n.read ? 'bg-transparent opacity-80' : 'bg-op-raised/40 font-semibold'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {n.type === 'critical' && <AlertTriangle className="w-4 h-4 text-op-danger flex-shrink-0 mt-0.5" />}
                  {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-op-warn flex-shrink-0 mt-0.5" />}
                  {n.type === 'info' && <Info className="w-4 h-4 text-op-accent flex-shrink-0 mt-0.5" />}

                  <div className="flex flex-col">
                    <span className="text-xs text-op-fg">{n.title}</span>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-op-muted">
                      <span className="font-mono text-op-accent bg-op-input px-1.5 py-0.2 rounded border border-op-border">{n.category}</span>
                      <span>•</span>
                      <span>Channel: {n.channel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-op-subtle font-mono text-[11px] whitespace-nowrap">{n.time}</span>
                  <button
                    onClick={() => toggleRead(n.id)}
                    className="px-2.5 py-1 rounded bg-op-raised hover:bg-op-accent/20 text-op-subtle hover:text-op-fg text-[11px] border border-op-border transition-all cursor-pointer"
                  >
                    {n.read ? 'Mark Unread' : 'Mark Read'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
