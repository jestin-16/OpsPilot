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
  Clock,
  LayoutDashboard
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
      <div className="p-8 max-w-[1500px] mx-auto space-y-8 animate-fade-in-up">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <LayoutDashboard className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Welcome Back, {user?.name || 'Administrator'}
            </h1>
            <p className="text-sm font-medium mt-2 text-gray-500 dark:text-gray-400">
              Here is the latest overview of the OpsPilot platform.
            </p>
          </div>
        </header>

        {/* Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <HighlightCard icon={Users} label="Total Users" value={overview?.userCount.toString() || '...'} loading={loading} />
          <HighlightCard icon={UserCheck} label="Active Users" value={overview?.activeUserCount.toString() || '...'} loading={loading} />
          <HighlightCard icon={FolderGit2} label="Projects" value={overview?.projectCount.toString() || '...'} loading={loading} />
          <HighlightCard icon={Blocks} label="Integrations" value={overview?.integrationCount.toString() || '...'} loading={loading} />
          <HighlightCard icon={ShieldAlert} label="Audit Events" value={overview?.auditEventCount.toString() || '...'} loading={loading} />
        </div>

        {/* Audit Logs Table */}
        <Card className="p-0 overflow-hidden flex flex-col mt-8 border-none">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Recent Platform Activity
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Timestamp</th>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Actor</th>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Action</th>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Resource Type</th>
                  <th className="py-3 px-6 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
  <Card hoverEffect className="relative overflow-hidden group p-6 border-none bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex justify-between items-start">
      <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <h3 className="font-semibold text-xs mt-5 text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</h3>
    <p className="text-3xl font-bold mt-1.5 text-gray-900 dark:text-white">
      {loading ? <span className="animate-pulse">...</span> : value}
    </p>
  </Card>
);

export default AdminDashboard;
