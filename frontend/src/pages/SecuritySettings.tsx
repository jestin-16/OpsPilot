import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { isAdmin } from '../utils/roles';
import { Shield, Key, Users, Check, ShieldAlert, Clock, Mail } from 'lucide-react';
import { useConfirm } from '../components/ConfirmProvider';

export const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const { confirm } = useConfirm();

  const isUserAdmin = isAdmin(user?.roles);

  const fetchUsers = async () => {
    if (!isUserAdmin) return;
    try {
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isUserAdmin]);

  const handleToggleStatus = async (id: number, active: boolean) => {
    try {
      await api.setUserStatus(id, active);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (id: number, roles: string[]) => {
    try {
      await api.updateUserRoles(id, roles);
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-op-accent" /> Security & Access Management
          </h1>
          <p className="text-slate-500 mt-2">Manage authentication methods, RBAC policies, and user accounts.</p>
        </div>

        {/* Security Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Authentication</h3>
                <p className="text-sm text-slate-500">Active strategies</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> JWT Bearer Tokens</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Google OAuth SSO</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Email OTP Verification</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-op-accent/20 text-op-accent rounded-lg flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">RBAC Roles</h3>
                <p className="text-sm text-slate-500">System permissions</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center justify-between">
                <span>Administrator</span> <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded">Full</span>
              </li>
              <li className="flex items-center justify-between">
                <span>DevOps Engineer</span> <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Elevated</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Developer</span> <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Standard</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">User Management</h3>
                <p className="text-sm text-slate-500">Access control</p>
              </div>
            </div>
            {isUserAdmin ? (
              <p className="text-sm text-slate-600 leading-relaxed">
                You have Administrative privileges. You can manage roles and revoke active sessions below.
              </p>
            ) : (
              <p className="text-sm text-rose-500 leading-relaxed font-medium bg-rose-50 p-3 rounded-lg border border-rose-100">
                You do not have permission to modify roles or manage users. Contact an Administrator.
              </p>
            )}
          </div>
        </div>

        {/* User Management Section */}
        {isUserAdmin && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Directory & Access Control</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-bold">User</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Roles</th>
                    <th className="p-4 font-bold">Created Date</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-op-accent/20 flex items-center justify-center text-op-accent-hover font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{u.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3"/> {u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r: string) => (
                            <span key={r} className="px-2 py-0.5 bg-op-accent/10 border border-op-accent/20 text-op-accent-hover rounded text-xs font-medium">
                              {r.replace('ROLE_', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-600 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <select 
                          className="text-sm bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-op-accent"
                          value={u.roles.includes('ROLE_ADMIN') ? 'ADMIN' : (u.roles.includes('ROLE_DEVOPS') ? 'DEVOPS' : 'DEVELOPER')}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            if (await confirm(`Change role for ${u.name} to ${newRole}?`, { confirmText: 'Change Role' })) {
                              handleRoleChange(u.id, [newRole]);
                            }
                          }}
                        >
                          <option value="DEVELOPER">Developer</option>
                          <option value="DEVOPS">DevOps</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          onClick={async () => {
                            if (await confirm(`Toggle access for ${u.name}?`, { isDestructive: u.isActive, confirmText: u.isActive ? 'Revoke Access' : 'Restore Access' })) {
                              handleToggleStatus(u.id, !u.isActive);
                            }
                          }}
                          className={`ml-2 px-3 py-1 text-xs font-bold rounded ${u.isActive ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                        >
                          {u.isActive ? 'Revoke Access' : 'Restore Access'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
