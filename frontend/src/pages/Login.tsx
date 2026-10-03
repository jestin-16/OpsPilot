import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, LoginSchema } from '../services/api';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);

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

  const setDemoAccount = (roleName: string, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setActiveDemoRole(roleName);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-black selection:bg-black selection:text-white antialiased flex flex-col">
      {/* Floating Modern Header Matching Landing Page */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-xl sm:px-10 lg:px-16 transition-all">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group flex items-center gap-3 cursor-pointer"
        >
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-black shadow-sm transition-transform duration-300 group-hover:scale-105">
            <div className="absolute inset-0 translate-x-4 -skew-x-12 bg-red-500"></div>
            <span className="relative z-10 text-base font-bold leading-none text-white">O</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-black">OpsPilot</span>
        </button>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hidden items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-black sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <span className="hidden h-4 w-px bg-gray-200 sm:block"></span>
          <div className="flex items-center gap-2.5">
            <span className="hidden text-xs text-gray-500 sm:inline">New to OpsPilot?</span>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area matching Landing Page Hero */}
      <main className="relative isolate flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-20 lg:px-12">
        {/* Subtle Ambient Radial Backlight */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[520px] w-[820px] rounded-full bg-gradient-to-tr from-gray-200/40 via-gray-100/30 to-transparent blur-3xl animate-pulse-slow" />
        </div>

        <div className="z-10 flex w-full max-w-5xl flex-col lg:flex-row items-center gap-12 lg:gap-24">
          {/* Left Side: Typography & Hero Elements */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition-all duration-300 hover:border-black/20 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              Platform Access
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-black sm:text-6xl leading-[1.04] animate-fade-in-up [animation-delay:100ms]">
              Sign in to your <br className="hidden lg:block" />
              workspace<span className="text-red-500">.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-gray-500 font-normal animate-fade-in-up [animation-delay:200ms]">
              Access your autonomous operations command center and manage your infrastructure effortlessly.
            </p>
            
            {/* Quick Feature highlights matching landing page metrics style */}
            <div className="mt-10 hidden lg:grid grid-cols-2 gap-8 text-left animate-fade-in-up [animation-delay:300ms]">
              <div>
                <p className="text-xl font-black tracking-tight text-black transition-transform duration-300 hover:scale-105">Single Sign-On</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Enterprise Ready</p>
              </div>
              <div>
                <p className="text-xl font-black tracking-tight text-black transition-transform duration-300 hover:scale-105">Zero Trust</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Security Model</p>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form Box (Clean, Landing Page aesthetic) */}
          <div className="w-full max-w-[420px] animate-fade-in-up [animation-delay:400ms]">
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-7 sm:p-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] transition-all duration-400 hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.06)]">
              
              {/* Error Notification */}
              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-3.5 text-xs font-semibold text-red-700 shadow-2xs animate-fade-in-up">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="flex-1 leading-snug">{error}</span>
                </div>
              )}

              {/* Quick Demo Accounts Pill Selector */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Demo Accounts</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { role: 'Admin', email: 'admin@opspilot.io' },
                    { role: 'Developer', email: 'developer@opspilot.io' },
                    { role: 'DevOps', email: 'devops@opspilot.io' },
                  ].map((item) => {
                    const isCurrent = email === item.email;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setDemoAccount(item.role, item.email)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 cursor-pointer border ${
                          isCurrent
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-white text-gray-600 border-gray-200/80 hover:border-black/30 hover:bg-gray-50 hover:text-black shadow-2xs'
                        }`}
                      >
                        {item.role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Form matching Landing page inputs */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative flex items-center rounded-2xl border border-gray-200/90 bg-[#FAFAFA] p-1 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 focus-within:bg-white">
                  <div className="pl-3.5 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (activeDemoRole) setActiveDemoRole(null);
                    }}
                    placeholder="Work Email"
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-black placeholder-gray-400 focus:outline-none"
                  />
                </div>

                <div className="relative flex items-center rounded-2xl border border-gray-200/90 bg-[#FAFAFA] p-1 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 focus-within:bg-white">
                  <div className="pl-3.5 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (activeDemoRole) setActiveDemoRole(null);
                    }}
                    placeholder="Password"
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-black placeholder-gray-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    'Authenticating...'
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Or continue with
                </div>
              </div>

              <div className="flex w-full justify-center">
                <div className="overflow-hidden rounded-full transition-transform hover:scale-[1.02]">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Login Failed')}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="pill"
                  />
                </div>
              </div>

              <div className="mt-6 text-center text-xs font-medium text-gray-500">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-bold text-black transition-colors hover:underline"
                >
                  Register now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Role Selection Modal */}
      {showRoleSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md animate-fade-in-up">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200/90 bg-white p-7 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-black">
                <div className="absolute inset-0 translate-x-3.5 -skew-x-12 bg-red-500"></div>
                <span className="relative z-10 text-xs font-bold text-white">O</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-black">Select Your Role</h3>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Welcome! Please select your workspace role to finalize your single sign-on profile.
            </p>
            <form onSubmit={handleRoleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Platform Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200/90 bg-gray-50/60 p-3.5 text-sm font-semibold text-black transition-all hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100"
                >
                  <option value="Developer">Developer (Standard Scoped Access)</option>
                  <option value="DevOps">DevOps (Cluster & CI/CD Access)</option>
                  <option value="Admin">Admin (Full Control)</option>
                </select>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleSelection(false);
                    setPendingGoogleToken(null);
                  }}
                  className="flex-1 rounded-full border border-gray-200 bg-white py-2.5 text-xs font-bold text-black transition hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full bg-black py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
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
