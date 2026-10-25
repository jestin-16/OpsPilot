import React, { useEffect, useState, useCallback } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type NotificationItem } from '../services/api';
import { Bell, Check, RefreshCw, AlertCircle, Rocket, ShieldAlert, Sparkles, CheckCheck } from 'lucide-react';
import { errorMessage } from '../services/projectApi';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      setError('');
    } catch (err) {
      if (isManual || notifications.length === 0) {
        setError(errorMessage(err, 'Could not fetch notifications. Check connection.'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [notifications.length]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(false), 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      setError(errorMessage(err, 'Failed to update notification'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(errorMessage(err, 'Failed to mark all as read'));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPLOYMENT_SUCCESS':
        return <Rocket className="w-4 h-4 text-emerald-500" />;
      case 'SYSTEM_ALERT':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'INCIDENT_OPENED':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-op-accent" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-op-border bg-gradient-to-br from-op-surface via-op-surface to-op-raised p-6 lg:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-op-accent/20 bg-op-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-op-accent">
                  <Sparkles className="w-3 h-3" /> Event Feed & Alerts
                </span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-extrabold text-rose-500">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-op-fg flex items-center gap-3">
                <Bell className="w-7 h-7 text-op-accent" /> Notification Center
              </h1>
              <p className="text-sm font-medium mt-1 text-op-muted">
                Kafka event stream alerts, deployment milestones, and governance updates.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-3.5 py-2 rounded-xl border border-op-border bg-op-surface text-op-fg hover:bg-op-raised text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-op-muted" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={refreshing}
                className="px-3.5 py-2 rounded-xl border border-op-border bg-op-surface text-op-fg hover:bg-op-raised text-xs font-semibold transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-op-accent ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchNotifications(true)}
              className="underline hover:no-underline font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Notifications List Card */}
        <div className="rounded-3xl border border-op-border bg-op-surface p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-op-fg">Activity Timeline</h2>
            <span className="text-[11px] font-mono text-op-muted">Topic: deployment-events</span>
          </div>

          {loading && notifications.length === 0 ? (
            <div className="py-16 text-center text-op-muted text-sm flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-op-accent" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-op-muted text-sm border border-dashed border-op-border rounded-2xl">
              <Bell className="w-8 h-8 text-op-muted mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-op-fg">No notifications yet</p>
              <p className="text-xs text-op-muted mt-1">
                Trigger a deployment or pipeline to receive live event updates.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                    n.read
                      ? 'bg-op-raised/40 border-op-border opacity-70'
                      : 'bg-op-surface border-op-accent/30 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-op-raised border border-op-border shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-op-fg leading-snug">{n.message}</span>
                        {!n.read && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-op-accent/10 text-op-accent border border-op-accent/20">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-op-muted block mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.notificationId)}
                      className="px-2.5 py-1 rounded-lg border border-op-border bg-op-surface hover:bg-op-raised text-op-accent text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3" />
                      <span>Read</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
