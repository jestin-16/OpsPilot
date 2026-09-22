import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, SignupSchema } from '../services/api';
import {
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('Developer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = SignupSchema.safeParse({ name, email, password, confirmPassword, role });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Please check the form and try again');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({ name, email, password, role });
      navigate(`/verify-email?email=${encodeURIComponent(res.email)}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-black selection:bg-black selection:text-white antialiased flex flex-col justify-between">
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
            <span className="hidden text-xs text-gray-500 sm:inline">Have an account?</span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Subtle Blueprint Dot Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-grid-pattern opacity-70" />

      {/* Subtle Ambient Radial Backlight */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[540px] w-[860px] rounded-full bg-gradient-to-tr from-gray-200/50 via-gray-100/40 to-transparent blur-3xl animate-pulse-slow" />
        <div className="absolute h-[320px] w-[320px] rounded-full bg-red-500/5 blur-3xl animate-pulse-slow [animation-delay:2s]" />
      </div>

      {/* Floating Pill Badges */}
      <div className="pointer-events-none absolute inset-0 -z-10 mx-auto hidden max-w-6xl lg:block">
        <div className="absolute top-[22%] left-[6%] flex flex-col items-center animate-float-slow">
          <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
            Developer First
          </div>
          <div className="mt-2 h-16 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>
        </div>
        <div className="absolute top-[18%] right-[7%] flex flex-col items-center animate-float-reverse [animation-delay:1.5s]">
          <div className="pointer-events-auto cursor-default rounded-full border border-gray-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md">
            Role-Based Access
          </div>
          <div className="mt-2 h-20 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="z-10 flex flex-1 items-center justify-center px-4 pt-32 pb-12 sm:px-6">
        <div className="w-full max-w-[460px] animate-fade-in-up">
          <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 p-7 sm:p-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(0,0,0,0.07)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.07),0_24px_56px_-12px_rgba(0,0,0,0.08)]">
            {/* Subtle Animated Top Border Shimmer Beam */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
              <div className="h-full w-48 bg-gradient-to-r from-transparent via-red-500/80 to-transparent animate-shimmer-sweep" />
            </div>

            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/90 px-3.5 py-1 text-[11px] font-semibold text-gray-700 shadow-2xs backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                OpsPilot 2.0 · Platform Registration
              </div>

              <div className="mt-4 flex flex-col items-center">
                <div className="relative mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-md transition-transform duration-300 group-hover:scale-105">
                  <div className="absolute inset-0 translate-x-5 -skew-x-12 bg-red-500"></div>
                  <span className="relative z-10 text-lg font-black leading-none text-white">O</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
                  Create your account<span className="text-red-500">.</span>
                </h1>
                <p className="mt-1.5 text-xs text-gray-500">
                  Deploy, observe, and diagnose with autonomous intelligence
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Full Name
                </label>
                <div className="relative group/input">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within/input:text-black">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Developer"
                    className="w-full rounded-2xl border border-gray-200/90 bg-gray-50/50 py-3 pl-10 pr-4 text-xs font-medium text-black placeholder-gray-400 shadow-2xs transition-all duration-200 hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Work Email
                </label>
                <div className="relative group/input">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within/input:text-black">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Password
                  </label>
                  <div className="relative group/input">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within/input:text-black">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-gray-200/90 bg-gray-50/50 py-3 pl-10 pr-10 text-xs font-medium text-black placeholder-gray-400 shadow-2xs transition-all duration-200 hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-black cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Confirm Password
                  </label>
                  <div className="relative group/input">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within/input:text-black">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-gray-200/90 bg-gray-50/50 py-3 pl-10 pr-10 text-xs font-medium text-black placeholder-gray-400 shadow-2xs transition-all duration-200 hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-black cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="pl-1 text-[11px] text-red-600 font-medium">Passwords do not match.</p>
              )}

              <div className="space-y-1.5">
                <label className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Platform Role
                </label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-black">
                    <Shield className="h-4 w-4" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200/90 bg-gray-50/50 py-3 pl-10 pr-4 text-xs font-medium text-black transition-all duration-200 hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 sm:text-sm appearance-none cursor-pointer"
                  >
                    <option value="Developer">Developer (Standard Scoped)</option>
                    <option value="DevOps">DevOps Engineer (Cluster &amp; CI/CD)</option>
                    <option value="Admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.25)] active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </form>

            <div className="mt-5 text-center text-xs font-medium text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-black transition-colors hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Footer */}
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
    </div>
  );
};

