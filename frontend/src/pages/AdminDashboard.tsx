import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UsersRound, Settings2, ArrowRight, FolderGit2, Terminal } from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-[1500px] space-y-8 p-8 animate-fade-in-up">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Administration workspace</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Manage identities, permissions, and platform policy from one place.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link to="/users" className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <UsersRound className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
            </div>
            <h2 className="mt-6 text-xl font-black text-slate-900">User management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Create users, assign roles, manage account status, and revoke access.</p>
          </Link>

          <Link to="/admin/projects" className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-600"><FolderGit2 className="h-6 w-6" /></div>
              <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-500" />
            </div>
            <h2 className="mt-6 text-xl font-black text-slate-900">Project and security control</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Review repositories, suspend unsafe projects, quarantine suspicious workloads, or remove them.</p>
          </Link>

          <Link to="/docker" className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50 text-sky-600"><Terminal className="h-6 w-6" /></div>
              <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-500" />
            </div>
            <h2 className="mt-6 text-xl font-black text-slate-900">Infrastructure management</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Start, stop, and restart managed containers without opening operational logs.</p>
          </Link>

          <Link to="/admin" className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-50 text-violet-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500" />
            </div>
            <h2 className="mt-6 text-xl font-black text-slate-900">Platform governance</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Review audit activity and manage platform integrations and settings.</p>
          </Link>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-sm font-semibold text-indigo-800">
          <Settings2 className="h-5 w-5 shrink-0 text-indigo-500" />
          Operational dashboards and runtime logs are assigned to DevOps users.
        </div>
      </div>
    </SidebarLayout>
  );
};
