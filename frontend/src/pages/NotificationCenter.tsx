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
        return <Rocket className="w-4 h-4 text-emerald-600" />;
      case 'SYSTEM_ALERT':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#4F46E5]" />;
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-[#4F46E5]" />
              <h1 className="text-2xl font-bold text-[#0F172A]">Notification center</h1>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Kafka event stream alerts, deployment milestones, and governance updates
            </p>
          </div>
          <button
            onClick={fetchNotifications}
            className="px-3.5 py-2 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Refresh notifications</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Notifications List Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-[#0F172A]">Event feed</h2>
            <span className="text-xs font-mono text-[#4F46E5]">Topic: deployment-events</span>
          </div>

          {loading && notifications.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-sm">Fetching notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-[#64748B] text-sm border border-dashed border-[#E2E8F0] rounded-lg">
              No notifications. Trigger a deployment in Projects page to receive pipeline updates.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                    n.read
                      ? 'bg-[#F8FAFC] border-[#E2E8F0] opacity-75'
                      : 'bg-[#FFFFFF] border-[#C7D2FE] shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2 rounded-lg bg-[#EEF2FF] shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0F172A]">{n.message}</span>
                        {!n.read && (
                          <span className="px-2 py-0.5 text-[9px] font-mono font-semibold rounded bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#64748B] block mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.notificationId)}
                      className="px-2.5 py-1 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold rounded-md flex items-center gap-1 shrink-0 cursor-pointer"
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
