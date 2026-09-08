import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit3, Mail, Power, RefreshCw, Search, ShieldCheck, Trash2, TriangleAlert, UserPlus, UsersRound, X } from 'lucide-react';
import { axiosInstance } from '../services/api';
import { SidebarLayout } from '../components/SidebarLayout';

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  isActive?: boolean;
}

interface UserForm {
  name: string;
  email: string;
  role: string;
}

const emptyForm: UserForm = { name: '', email: '', role: 'DEVELOPER' };
const roleLabel = (role: string) => role.replace(/^ROLE_/, '').replace(/_/g, ' ');
const roleStyle = (role: string) => {
  const normalized = role.toUpperCase();
  if (normalized.includes('ADMIN')) return 'border-violet-200 bg-violet-50 text-violet-700';
  if (normalized.includes('DEVOPS')) return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-indigo-200 bg-indigo-50 text-indigo-700';
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'DEVELOPER' });

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get<User[]>('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (requestError: any) {
      console.error('Failed to fetch users', requestError);
      setError(requestError.response?.data?.message || `Unable to load users (${requestError.response?.status || 'network error'})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const visibleUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.roles.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const activeUsers = users.filter((user) => user.isActive !== false).length;

  const openEditor = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.roles[0] || 'DEVELOPER' });
    setError('');
  };

  const closeEditor = () => {
    if (!saving) {
      setEditingUser(null);
      setForm(emptyForm);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setError('');
    try {
      await axiosInstance.put(`/users/${editingUser.id}`, { name: form.name, email: form.email, roles: [form.role] });
      setNotice(`${form.name} was updated successfully.`);
      setEditingUser(null);
      setForm(emptyForm);
      await fetchUsers();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to save user changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/users/${userToDelete.id}`);
      setNotice(`${userToDelete.name} was removed.`);
      setUserToDelete(null);
      await fetchUsers();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await axiosInstance.post('/users', { ...newUser, roles: [newUser.role] }); setNotice(`${newUser.name} was added to the workspace.`); setCreatingUser(false); setNewUser({ name: '', email: '', password: '', role: 'DEVELOPER' }); await fetchUsers(); }
    catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to create user.'); }
    finally { setSaving(false); }
  };
  const toggleUserStatus = async (user: User) => {
    try { await axiosInstance.patch(`/users/${user.id}/status`, { active: user.isActive === false }); setNotice(`${user.name} is now ${user.isActive === false ? 'active' : 'disabled'}.`); await fetchUsers(); }
    catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to update user status.'); }
  };

  if (loading) return <SidebarLayout><div className="p-8 text-sm font-medium text-slate-500">Loading users...</div></SidebarLayout>;

  return (
    <SidebarLayout>
      <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-6 p-5 md:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50/60 px-6 py-7 shadow-sm md:px-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600"><span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-100"><ShieldCheck className="h-4 w-4" /></span> Access governance</div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">User management</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Review platform identities, manage permissions, and keep your workspace access secure.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-full border border-white bg-white/80 px-3.5 py-2 text-slate-600 shadow-sm">{users.length} identities</span><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-emerald-700">{activeUsers} active</span><button onClick={() => setCreatingUser(true)} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-2 text-white shadow-sm transition hover:bg-indigo-700"><UserPlus className="h-3.5 w-3.5" />Add user</button></div>
          </div>
        </header>

        {notice && <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3.5 text-emerald-900 shadow-sm" role="status"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></span><div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Changes saved</p><p className="mt-0.5 text-sm font-medium text-emerald-800">{notice}</p></div></div><button onClick={() => setNotice('')} aria-label="Dismiss success message" className="rounded-lg p-1.5 text-emerald-700/60 transition hover:bg-emerald-100 hover:text-emerald-800"><X className="h-4 w-4" /></button></div>}
        {error && <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white px-4 py-3.5 text-rose-900 shadow-sm" role="alert"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600"><AlertCircle className="h-4 w-4" /></span><div><p className="text-xs font-black uppercase tracking-wider text-rose-700">Unable to complete action</p><p className="mt-0.5 text-sm font-medium text-rose-800">{error}</p></div></div><button onClick={() => setError('')} aria-label="Dismiss error message" className="rounded-lg p-1.5 text-rose-700/60 transition hover:bg-rose-100 hover:text-rose-800"><X className="h-4 w-4" /></button></div>}

        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur" aria-label="Platform users">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div><h2 className="text-base font-black text-slate-800">Workspace directory</h2><p className="mt-1 text-xs text-slate-500">{visibleUsers.length} {visibleUsers.length === 1 ? 'person' : 'people'} shown</p></div>
            <div className="flex items-center gap-2"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people or roles" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 sm:w-60" /></label><button type="button" onClick={() => { setLoading(true); fetchUsers(); }} title="Refresh directory" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><RefreshCw className="h-4 w-4" /></button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-left">
              <colgroup><col className="w-[27%]" /><col className="w-[31%]" /><col className="w-[18%]" /><col className="w-[14%]" /><col className="w-[10%]" /></colgroup>
              <thead className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-6 py-4">Identity</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((user) => <tr key={user.id} className="group transition-colors hover:bg-indigo-50/45">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-black text-indigo-700 ring-1 ring-indigo-100">{user.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-800">{user.name}</div><div className="mt-0.5 font-mono text-[10px] font-medium text-slate-400">ID-{String(user.id).padStart(4, '0')}</div></div></div></td>
                  <td className="truncate px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${roleStyle(user.roles[0] || '')}`}>{roleLabel(user.roles[0] || 'UNASSIGNED')}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${user.isActive === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${user.isActive === false ? 'bg-slate-400' : 'bg-emerald-500'}`} />{user.isActive === false ? 'Inactive' : 'Active'}</span></td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEditor(user)} title={`Edit ${user.name}`} aria-label={`Edit ${user.name}`} className="rounded-lg border border-transparent p-2 text-slate-400 transition-all hover:border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700"><Edit3 className="h-4 w-4" /></button><button onClick={() => toggleUserStatus(user)} title={user.isActive === false ? `Enable ${user.name}` : `Disable ${user.name}`} aria-label={user.isActive === false ? `Enable ${user.name}` : `Disable ${user.name}`} className="rounded-lg border border-transparent p-2 text-slate-400 transition-all hover:border-amber-100 hover:bg-amber-100 hover:text-amber-700"><Power className="h-4 w-4" /></button><button onClick={() => handleDelete(user)} title={`Delete ${user.name}`} aria-label={`Delete ${user.name}`} className="rounded-lg border border-transparent p-2 text-slate-400 transition-all hover:border-rose-100 hover:bg-rose-100 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          {!error && users.length === 0 && <div className="px-6 py-14 text-center"><UsersRound className="mx-auto mb-3 h-9 w-9 text-slate-300" /><p className="text-sm font-bold text-slate-600">No users found</p><p className="mt-1 text-xs text-slate-400">New workspace members will appear here.</p></div>}
          {!error && users.length > 0 && visibleUsers.length === 0 && <div className="px-6 py-14 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="text-sm font-bold text-slate-600">No matching users</p><button type="button" onClick={() => setSearch('')} className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">Clear search</button></div>}
        </section>
      </div>

      {editingUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="edit-user-title"><form onSubmit={handleSave} className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 pb-14 pt-6 text-white"><div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" /><div className="relative flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Identity record</p><h2 id="edit-user-title" className="mt-2 text-2xl font-black tracking-tight">Edit user</h2><p className="mt-1 text-sm text-indigo-100">Update workspace access details.</p></div><button type="button" onClick={closeEditor} aria-label="Close edit dialog" className="rounded-xl border border-white/15 bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button></div></div>
        <div className="relative -mt-8 px-6 pb-6"><div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-900/5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-black text-indigo-700">{editingUser.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800">{editingUser.name}</p><p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500"><Mail className="h-3.5 w-3.5 text-indigo-400" />{editingUser.email}</p></div></div>
          <div className="grid gap-4"><label className="grid gap-2 text-xs font-black text-slate-600">Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" /></label><label className="grid gap-2 text-xs font-black text-slate-600">Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" /></label><label className="grid gap-2 text-xs font-black text-slate-600">Platform role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"><option value="ADMIN">Administrator</option><option value="DEVELOPER">Developer</option><option value="DEVOPS">DevOps Engineer</option></select></label></div>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:justify-end"><button type="button" onClick={closeEditor} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-indigo-500/35 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving changes...' : 'Save changes'}</button></div>
      </form></div>}

      {creatingUser && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="create-user-title"><form onSubmit={createUser} className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Workspace access</p><h2 id="create-user-title" className="mt-1 text-xl font-black">Add a user</h2></div><button type="button" onClick={() => setCreatingUser(false)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5" /></button></div></div><div className="grid gap-4 p-6"><label className="grid gap-2 text-xs font-black text-slate-600">Full name<input required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" /></label><label className="grid gap-2 text-xs font-black text-slate-600">Email address<input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" /></label><label className="grid gap-2 text-xs font-black text-slate-600">Temporary password<input required minLength={8} type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" /></label><label className="grid gap-2 text-xs font-black text-slate-600">Role<select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"><option value="DEVELOPER">Developer</option><option value="DEVOPS">DevOps Engineer</option><option value="ADMIN">Administrator</option></select></label></div><div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" onClick={() => setCreatingUser(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Cancel</button><button disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Adding...' : 'Add user'}</button></div></form></div>}

      {userToDelete && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title"><div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"><div className="h-1.5 bg-gradient-to-r from-rose-500 via-rose-500 to-orange-400" /><div className="p-6"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600"><TriangleAlert className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">Permanent action</p><h2 id="delete-user-title" className="mt-1 text-xl font-black text-slate-900">Remove {userToDelete.name}?</h2><p className="mt-2 text-sm leading-6 text-slate-500">This removes their platform access and cannot be undone. You can cancel if this was selected by mistake.</p></div></div><div className="mt-6 rounded-xl border border-rose-100 bg-rose-50/70 px-3.5 py-3 text-xs font-semibold text-rose-700">All permissions and directory access for this identity will be revoked.</div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setUserToDelete(null)} disabled={deleting} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60">Keep user</button><button type="button" onClick={confirmDelete} disabled={deleting} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{deleting ? 'Removing...' : 'Remove user'}</button></div></div></div></div>}
    </SidebarLayout>
  );
};
