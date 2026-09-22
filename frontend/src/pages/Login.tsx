import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, LoginSchema } from '../services/api';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
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
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-black selection:bg-black selection:text-white antialiased flex flex-col justify-between">
      {/* Floating Modern Header Matching Landing Page */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-xl sm:px-10 lg:px-16">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group flex items-center gap-3 cursor-pointer"
        >
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-black shadow-sm transition-transform duration-200 group-hover:scale-105">
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
              className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800 hover:shadow-md cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Subtle Ambient Radial Backlight */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[520px] w-[820px] rounded-full bg-gradient-to-tr from-gray-200/50 via-gray-100/40 to-transparent blur-3xl animate-pulse-slow" />
      </div>

      {/* Floating Pill Badges with Smooth Asynchronous Float */}
      <div className="pointer-events-none absolute inset-0 -z-10 mx-auto hidden max-w-6xl lg:block">
        <div className="absolute top-[24%] left-[6%] flex flex-col items-center animate-float-slow">
          <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
            Workflows &amp; SSO
          </div>
          <div className="mt-2 h-16 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>
        </div>
        <div className="absolute top-[20%] right-[7%] flex flex-col items-center animate-float-reverse [animation-delay:1.5s]">
          <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
            AI Diagnostic Ready
          </div>
          <div className="mt-2 h-20 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>
        </div>
        <div className="absolute bottom-[18%] left-[8%] flex flex-col items-center animate-float-slow [animation-delay:3s]">
          <div className="mb-2 h-16 w-px bg-gradient-to-t from-gray-300 to-transparent"></div>
          <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
            Telemetry &amp; Logs
          </div>
        </div>
        <div className="absolute bottom-[16%] right-[8%] flex flex-col items-center animate-float-reverse [animation-delay:4.5s]">
          <div className="mb-2 h-20 w-px bg-gradient-to-t from-gray-300 to-transparent"></div>
          <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
            Zero Trust Security
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="z-10 flex flex-1 items-center justify-center px-4 pt-32 pb-12 sm:px-6">
        <div className="w-full max-w-[440px] animate-fade-in-up">
          {/* Card Container */}
          <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 p-7 sm:p-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(0,0,0,0.07)] backdrop-blur-2xl">
            {/* Brand Eyebrow & Headline */}
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/90 px-3.5 py-1 text-[11px] font-semibold text-gray-700 shadow-2xs backdrop-blur-md transition-all duration-300 hover:border-black/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                OpsPilot 2.0 · Platform Access
              </div>

              <div className="mt-4 flex flex-col items-center">
                <div className="relative mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-md transition-transform duration-300 hover:scale-105">
                  <div className="absolute inset-0 translate-x-5 -skew-x-12 bg-red-500"></div>
                  <span className="relative z-10 text-lg font-black leading-none text-white">O</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
                  Sign in to workspace<span className="text-red-500">.</span>
                </h1>
                <p className="mt-1.5 text-xs text-gray-500">
                  Access your autonomous operations command center
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-3.5 text-xs font-semibold text-red-700 shadow-2xs animate-fade-in-up">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="flex-1 leading-snug">{error}</span>
              </div>
            )}

            {/* Quick Demo Accounts Pill Selector */}
            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5">
              <div className="mb-2.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-black" />
                  Quick Demo Accounts
                </span>
                <span className="text-[10px] font-medium text-gray-400">Instant autofill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'Admin', email: 'admin@opspilot.io', desc: 'Full Cluster' },
                  { role: 'Developer', email: 'developer@opspilot.io', desc: 'App Scoped' },
                  { role: 'DevOps', email: 'devops@opspilot.io', desc: 'CI/CD Pipelines' },
                ].map((item) => {
                  const isCurrent = email === item.email;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setDemoAccount(item.email)}
                      className={`group flex flex-col items-center justify-center rounded-xl border py-2 px-1.5 transition-all duration-200 cursor-pointer ${
                        isCurrent
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200/90 hover:border-black/30 hover:bg-gray-50 hover:text-black shadow-2xs'
                      }`}
                    >
                      <span className="text-xs font-bold">{item.role}</span>
                      <span
                        className={`text-[9px] tracking-tight ${
                          isCurrent ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      >
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Work Email
                </label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-black">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@opspilot.io"
                    className="w-full rounded-2xl border border-gray-200/90 bg-gray-50/50 py-3 pl-10 pr-4 text-xs font-medium text-black placeholder-gray-400 shadow-2xs transition-all duration-200 hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between pl-0.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-black">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-gray-200/90 bg-gray-50/50 py-3 pl-10 pr-4 text-xs font-medium text-black placeholder-gray-400 shadow-2xs transition-all duration-200 hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 sm:text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.25)] active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200/80"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                theme="outline"
                size="large"
                width="100%"
              />
            </div>

            {/* Card Footer */}
            <div className="mt-5 text-center text-xs font-medium text-gray-500">
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
      </main>

      {/* Trust & Enterprise Status Footer */}
      <footer className="z-10 px-4 py-6 text-center text-xs text-gray-400">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium text-gray-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-gray-500" /> End-to-End Encryption
          </span>
          <span>·</span>
          <span>SOC 2 Type II Certified</span>
          <span>·</span>
          <span>99.99% Guaranteed Uptime</span>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          &copy; {new Date().getFullYear()} OpsPilot Platform. All rights reserved.
        </p>
      </footer>

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
                  <option value="DevOps">DevOps (Cluster &amp; CI/CD Access)</option>
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

