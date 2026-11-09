import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { api, type AdminOverview, type AuditLog } from '../services/api';
import {
  Users,
  UserCheck,
  FolderGit2,
  Blocks,
  ShieldAlert,
  Clock
} from 'lucide-react';

import { Card } from '../components/Card';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [overviewData, logsData] = await Promise.all([
          api.getAdminOverview(),
          api.getAuditLogs()
        ]);
        setOverview(overviewData);
        setAuditLogs(logsData);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <SidebarLayout>
      <div className="dashboard-overview">
        {/* Header */}
        <div className="dashboard-intro">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="dashboard-eyebrow">Your platform, at a glance</div>
              <h1 className="text-3xl font-black tracking-tight text-op-fg flex items-center gap-3">
                Dashboard overview
              </h1>
              <p className="text-sm font-medium mt-1 text-op-muted">
                Welcome back, {user?.name || 'Administrator'}. Your people, projects, and platform activity in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Highlights Row */}
        <div className="dashboard-metrics dashboard-metrics-five">
          <HighlightCard icon={Users} label="Total Users" value={overview?.userCount.toString() || '...'} loading={loading} />
          <HighlightCard icon={UserCheck} label="Active Users" value={overview?.activeUserCount.toString() || '...'} loading={loading} />
          <HighlightCard icon={FolderGit2} label="Projects" value={overview?.projectCount.toString() || '...'} loading={loading} />
          <HighlightCard icon={Blocks} label="Integrations" value={overview?.integrationCount.toString() || '...'} loading={loading} />
          <HighlightCard icon={ShieldAlert} label="Audit Events" value={overview?.auditEventCount.toString() || '...'} loading={loading} />
        </div>

        {/* Audit Logs Table */}
        <Card className="dashboard-panel dashboard-audit">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Recent platform activity</h2>
              <p>A clear trail of changes across your workspace</p>
            </div>
            <Clock className="w-4 h-4 text-op-muted" />
          </div>
          <div className="op-table overflow-x-auto rounded-xl border border-op-border">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-op-raised border-b border-op-border">
                <tr>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Timestamp</th>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Actor</th>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Action</th>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Resource Type</th>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-op-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400 font-medium">Loading audit logs...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No recent activity.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900 dark:text-white">{log.actorName}</span>
                        {log.actorEmail && <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{log.actorEmail}</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-400 dark:text-gray-500">
                        {log.resourceType}
                      </td>
                      <td className="py-4 px-6 text-gray-400 dark:text-gray-500">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </SidebarLayout>
  );
};

const HighlightCard: React.FC<{ icon: React.ElementType; label: string; value: string; loading: boolean }> = ({ icon: Icon, label, value, loading }) => (
  <Card hoverEffect className="relative overflow-hidden group">
    <div className="dashboard-metric-heading">
      <span className="text-xs text-op-muted">{label}</span>
      <div className="dashboard-metric-icon shrink-0">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-3xl font-medium text-op-fg">
      {loading ? <span className="animate-pulse">...</span> : value}
    </p>
  </Card>
);

export default AdminDashboard;
