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
              Platform Registration
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-black sm:text-6xl leading-[1.04] animate-fade-in-up [animation-delay:100ms]">
              Create your <br className="hidden lg:block" />
              account<span className="text-red-500">.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-gray-500 font-normal animate-fade-in-up [animation-delay:200ms]">
              Deploy, observe, and diagnose with autonomous intelligence. Join the unified operational workspace.
            </p>
            
            {/* Quick Feature highlights matching landing page metrics style */}
            <div className="mt-10 hidden lg:grid grid-cols-2 gap-8 text-left animate-fade-in-up [animation-delay:300ms]">
              <div>
                <p className="text-xl font-black tracking-tight text-black transition-transform duration-300 hover:scale-105">Instant Setup</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Ready in seconds</p>
              </div>
              <div>
                <p className="text-xl font-black tracking-tight text-black transition-transform duration-300 hover:scale-105">Team Ready</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Role-Based Access</p>
              </div>
            </div>
          </div>

          {/* Right Side: Registration Form Box (Clean, Landing Page aesthetic) */}
          <div className="w-full max-w-[440px] animate-fade-in-up [animation-delay:400ms]">
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-7 sm:p-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] transition-all duration-400 hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.06)]">
              
              {/* Error Notification */}
              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-3.5 text-xs font-semibold text-red-700 shadow-2xs animate-fade-in-up">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="flex-1 leading-snug">{error}</span>
                </div>
              )}

              {/* Form matching Landing page inputs */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative flex items-center rounded-2xl border border-gray-200/90 bg-[#FAFAFA] p-1 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 focus-within:bg-white">
                  <div className="pl-3.5 text-gray-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-black placeholder-gray-400 focus:outline-none"
                  />
                </div>

                <div className="relative flex items-center rounded-2xl border border-gray-200/90 bg-[#FAFAFA] p-1 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 focus-within:bg-white">
                  <div className="pl-3.5 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Work Email"
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-black placeholder-gray-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="relative flex items-center rounded-2xl border border-gray-200/90 bg-[#FAFAFA] p-1 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 focus-within:bg-white">
                    <div className="pl-3.5 text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-transparent pl-3 pr-9 py-2.5 text-sm font-medium text-black placeholder-gray-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-black cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="relative flex items-center rounded-2xl border border-gray-200/90 bg-[#FAFAFA] p-1 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 focus-within:bg-white">
                    <div className="pl-3.5 text-gray-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full bg-transparent pl-3 pr-9 py-2.5 text-sm font-medium text-black placeholder-gray-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-black cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {confirmPassword.length > 0 && confirmPassword !== password && (
                  <p className="pl-1 text-[11px] text-red-600 font-medium animate-fade-in-up">Passwords do not match.</p>
                )}

                <div className="relative flex items-center rounded-2xl border border-gray-200/90 bg-[#FAFAFA] p-1 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 focus-within:bg-white">
                  <div className="pl-3.5 text-gray-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-black focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="Developer">Developer (Standard Scoped)</option>
                    <option value="DevOps">DevOps Engineer (Cluster & CI/CD)</option>
                    <option value="Admin">Administrator (Full Access)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
                </button>
              </form>

              <div className="mt-6 text-center text-xs font-medium text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-black transition-colors hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
