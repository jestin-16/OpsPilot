import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Terminal, Lock, Mail, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      login(res);
      navigate('/monitoring');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-300/30 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-300/30 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-300/20 blur-[90px] animate-float" />

      {/* Glass Container */}
      <div className="w-full max-w-md glass-panel rounded-[2rem] p-10 space-y-8 relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-white text-white shadow-xl shadow-indigo-500/10 mb-2 transform transition-transform hover:scale-105 overflow-hidden border border-slate-100">
            <img src="/opspilot-logo.png" alt="OpsPilot Logo" className="w-full h-full object-cover scale-[1.2]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">OpsPilot</h1>
          <p className="text-sm font-medium text-slate-500">Sign in to your developer platform</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-medium shadow-sm animate-fade-in-up">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Account Selector */}
        <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl space-y-3">
          <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span>Quick Demo Accounts</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Admin', 'Developer', 'DevOps'].map((role) => (
              <button
                key={role} type="button"
                onClick={() => setDemoAccount(`${role.toLowerCase()}@opspilot.io`)}
                className="px-2 py-2 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md text-slate-700 hover:text-indigo-600 text-[11px] font-bold rounded-xl transition-all"
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
              Work Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@opspilot.io"
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder-slate-400 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder-slate-400 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 group"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="pt-6 text-center text-sm font-medium text-slate-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};
