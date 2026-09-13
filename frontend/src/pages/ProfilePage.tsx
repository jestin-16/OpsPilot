import React, { useEffect, useState } from 'react';
import { UserRound, Save, Loader2 } from 'lucide-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api, type User } from '../services/api';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCurrentUser()
      .then((user) => {
        setProfile(user);
        setName(user.name);
        setEmail(user.email);
      })
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await api.updateCurrentUser({ name, email });
      setProfile(updated);
      localStorage.setItem('opspilot_user', JSON.stringify(updated));
      setMessage('Profile updated.');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
            <UserRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">My Profile</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage your own account details.</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading profile...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <input value={name} onChange={(event) => setName(event.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-500">Role: {profile?.roles.join(', ')}</div>
                <button type="submit" disabled={saving} className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
              {message && <p className="text-sm font-semibold text-emerald-600">{message}</p>}
              {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
