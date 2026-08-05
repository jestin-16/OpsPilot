import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type NotificationItem } from '../services/api';
import { Bell, Check, RefreshCw, AlertCircle, Rocket, ShieldAlert } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      await fetchNotifications();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DEPLOYMENT_SUCCESS':
        return <Rocket className="w-4 h-4 text-emerald-400" />;
      case 'SYSTEM_ALERT':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-[#38BDF8]" />;
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E2D45] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-[#38BDF8]" />
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Notification center</h1>
            </div>
            <p className="text-sm text-[#94A3B8] mt-1">
              Kafka event stream alerts, deployment milestones, and governance updates
            </p>
          </div>
          <button
            onClick={fetchNotifications}
            className="px-3.5 py-2 bg-[#0F1B2E] border border-[#1E2D45] hover:bg-[#1E2D45] text-[#F8FAFC] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Refresh notifications</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Notifications List Card */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-[#F8FAFC]">Event feed</h2>
            <span className="text-xs font-mono text-[#38BDF8]">Topic: deployment-events</span>
          </div>

          {loading && notifications.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">Fetching notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm border border-dashed border-[#1E2D45] rounded-lg">
              No notifications. Trigger a deployment in Projects page to receive pipeline updates.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                    n.read
                      ? 'bg-[#060B18]/60 border-[#1E2D45] opacity-75'
                      : 'bg-[#0F1B2E] border-[#38BDF8]/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-[#1E2D45] shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F8FAFC]">{n.message}</span>
                        {!n.read && (
                          <span className="px-2 py-0.5 text-[9px] font-mono font-semibold rounded bg-[#38BDF8]/20 text-[#38BDF8]">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#94A3B8] block mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.notificationId)}
                      className="px-2.5 py-1 bg-[#1E2D45] hover:bg-[#1E2D45]/80 text-[#38BDF8] text-xs font-semibold rounded-md flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark read</span>
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
