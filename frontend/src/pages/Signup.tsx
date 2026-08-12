import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Terminal, Lock, Mail, User as UserIcon, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Developer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.register({ name, email, password, role });
      login(res);
      navigate('/monitoring');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-purple-300/30 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-300/30 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-300/20 blur-[90px] animate-float" />

      {/* Glass Container */}
      <div className="w-full max-w-md glass-panel rounded-[2rem] p-10 space-y-8 relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-white text-white shadow-xl shadow-indigo-500/10 mb-2 transform transition-transform hover:scale-105 overflow-hidden border border-slate-100">
            <img src="/opspilot-logo.png" alt="OpsPilot Logo" className="w-full h-full object-cover scale-[1.2]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Join OpsPilot</h1>
          <p className="text-sm font-medium text-slate-500">Create your developer account</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-medium shadow-sm animate-fade-in-up">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <UserIcon className="w-5 h-5" />
              </div>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Jane Developer"
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder-slate-400 shadow-sm"
              />
            </div>
          </div>

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

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
              Platform Role
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Shield className="w-5 h-5" />
              </div>
              <select
                value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all cursor-pointer shadow-sm appearance-none"
              >
                <option value="Developer">Developer</option>
                <option value="DevOps">DevOps Engineer</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 group"
          >
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="pt-6 text-center text-sm font-medium text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
