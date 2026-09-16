import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, LoginSchema } from '../services/api';
import { Lock, Mail, ArrowRight, AlertCircle, UserCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Google Login State
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('Developer');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Please check your email and password');
      return;
    }

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.googleLogin({ idToken: credentialResponse.credential });
      login(res);
      navigate('/monitoring');
    } catch (err: any) {
      if (err.response?.status === 428 || err.response?.data?.message?.includes('Role is required')) {
        setPendingGoogleToken(credentialResponse.credential);
        setShowRoleSelection(true);
      } else {
        const msg = err.response?.data?.message || err.message || 'Google login failed';
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleToken) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.googleLogin({ idToken: pendingGoogleToken, role: selectedRole });
      login(res);
      navigate('/monitoring');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
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
                autoComplete="current-password"
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white/80 backdrop-blur-sm text-slate-500 rounded">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
            theme="outline"
            size="large"
            width="100%"
          />
        </div>

        <div className="pt-6 text-center text-sm font-medium text-slate-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors">
            Register now
          </Link>
        </div>
      </div>

      {showRoleSelection && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Select Your Role</h3>
            <p className="text-sm text-slate-500 mb-6">Welcome! Please select your role to complete registration.</p>
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              >
                <option value="Developer">Developer</option>
                <option value="DevOps">DevOps</option>
                <option value="Admin">Admin</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleSelection(false);
                    setPendingGoogleToken(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/30"
                >
                  {loading ? 'Creating...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
