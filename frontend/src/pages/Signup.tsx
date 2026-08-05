import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Terminal, Lock, Mail, User as UserIcon, Shield, AlertCircle } from 'lucide-react';

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
      const data = await api.register({ name, email, password, role });
      login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060B18] flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#38BDF8] flex items-center justify-center text-[#060B18]">
          <Terminal className="w-6 h-6 font-bold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">OpsPilot</h1>
          <p className="text-xs text-[#94A3B8]">Internal Developer Platform</p>
        </div>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-md bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-8 shadow-none">
        <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">Create Account</h2>
        <p className="text-sm text-[#94A3B8] mb-6">Select your role and register for platform access</p>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Developer"
                className="w-full pl-10 pr-4 py-2.5 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8] placeholder-[#94A3B8]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@opspilot.io"
                className="w-full pl-10 pr-4 py-2.5 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8] placeholder-[#94A3B8]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8] placeholder-[#94A3B8]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
              Platform Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <Shield className="w-4 h-4" />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#060B18] border border-[#1E2D45] rounded-lg text-[#F8FAFC] text-sm focus:outline-none focus:border-[#38BDF8] cursor-pointer"
              >
                <option value="Developer">Developer</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#060B18] font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#1E2D45] text-center text-sm text-[#94A3B8]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#38BDF8] font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
