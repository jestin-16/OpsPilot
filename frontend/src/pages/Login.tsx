import React, { useState, useRef } from 'react';
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
  Eye,
  EyeOff,
  Sparkles,
  Activity,
  Check,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);
  const [googleTheme, setGoogleTheme] = useState<'outline' | 'filled_black'>('outline');

  // Interactive 3D Card Tilt & Spotlight
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, isHovering: false });

  // Google Login State
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('Developer');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y, isHovering: true });

    // Subtle micro-tilt (max ~2.5 deg)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -2.5;
    const tiltY = ((x - centerX) / centerX) * 2.5;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleCardMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, isHovering: false }));
    setTilt({ x: 0, y: 0 });
  };

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

      {/* Subtle Blueprint Dot Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-grid-pattern opacity-70" />

      {/* Subtle Ambient Radial Backlight */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[540px] w-[860px] rounded-full bg-gradient-to-tr from-gray-200/50 via-gray-100/40 to-transparent blur-3xl animate-pulse-slow" />
        <div className="absolute h-[320px] w-[320px] rounded-full bg-red-500/5 blur-3xl animate-pulse-slow [animation-delay:2s]" />
      </div>

      {/* Floating Pill Badges with Smooth Asynchronous Float & Micro-Interactions */}
      <div className="pointer-events-none absolute inset-0 -z-10 mx-auto hidden max-w-6xl lg:block">
        {/* Badge 1: Workflows & SSO */}
        <div className="absolute top-[22%] left-[6%] flex flex-col items-center animate-float-slow group/pill">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/95 px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Workflows &amp; SSO
            <span className="text-[10px] font-mono text-gray-400 group-hover/pill:text-gray-700 transition-colors">
              99.99%
            </span>
          </div>
          <div className="mt-2 h-16 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>
        </div>

        {/* Badge 2: AI Copilot Ready */}
        <div className="absolute top-[18%] right-[7%] flex flex-col items-center animate-float-reverse [animation-delay:1.5s] group/pill">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/95 px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md cursor-default">
            <Sparkles className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            AI Copilot Ready
            <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-bold text-white transition-transform group-hover/pill:scale-105">
              v2.0
            </span>
          </div>
          <div className="mt-2 h-20 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>
        </div>

        {/* Badge 3: Telemetry & Logs */}
        <div className="absolute bottom-[18%] left-[8%] flex flex-col items-center animate-float-slow [animation-delay:3s] group/pill">
          <div className="mb-2 h-16 w-px bg-gradient-to-t from-gray-300 to-transparent"></div>
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/95 px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md cursor-default">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            Telemetry &amp; Logs
            <span className="text-[10px] font-mono text-gray-400 group-hover/pill:text-gray-700 transition-colors">
              0.4ms
            </span>
          </div>
        </div>

        {/* Badge 4: Zero Trust Security */}
        <div className="absolute bottom-[16%] right-[8%] flex flex-col items-center animate-float-reverse [animation-delay:4.5s] group/pill">
          <div className="mb-2 h-20 w-px bg-gradient-to-t from-gray-300 to-transparent"></div>
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/95 px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-[0_4px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-black/30 hover:text-black hover:shadow-md cursor-default">
            <ShieldCheck className="h-3.5 w-3.5 text-black" />
            Zero Trust Security
            <span className="text-[10px] font-mono text-gray-400 group-hover/pill:text-gray-700 transition-colors">
              mTLS
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="z-10 flex flex-1 items-center justify-center px-4 pt-32 pb-12 sm:px-6">
        <div className="w-full max-w-[440px] animate-fade-in-up">
          {/* Interactive Card Container with 3D Tilt & Cursor Spotlight */}
          <div
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: mousePos.isHovering ? 'transform 0.15s ease-out' : 'transform 0.5s ease-out',
            }}
            className="group relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 p-7 sm:p-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(0,0,0,0.07)] backdrop-blur-2xl transition-all duration-300 hover:shadow-[0_12px_36px_-6px_rgba(0,0,0,0.07),0_24px_56px_-12px_rgba(0,0,0,0.08)]"
          >
            {/* Interactive Cursor Spotlight */}
            <div
              className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: mousePos.isHovering
                  ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 0, 0, 0.035), transparent 75%)`
                  : 'none',
              }}
            />

            {/* Subtle Animated Top Border Shimmer Beam */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
              <div className="h-full w-48 bg-gradient-to-r from-transparent via-red-500/80 to-transparent animate-shimmer-sweep" />
            </div>

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
                <div className="relative mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-md transition-transform duration-300 group-hover:scale-105">
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
            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 transition-colors">
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
                      onClick={() => setDemoAccount(item.role, item.email)}
                      className={`group relative flex flex-col items-center justify-center rounded-xl border py-2 px-1.5 transition-all duration-200 cursor-pointer ${
                        isCurrent
                          ? 'bg-black text-white border-black shadow-xs scale-[1.02]'
                          : 'bg-white text-gray-700 border-gray-200/90 hover:border-black/30 hover:bg-gray-50 hover:text-black shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold">{item.role}</span>
                        {isCurrent && <Check className="h-3 w-3 text-red-500" />}
                      </div>
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
              {activeDemoRole && (
                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-emerald-600 animate-fade-in-up">
                  <Check className="h-3 w-3" />
                  <span>Profile selected: {activeDemoRole} account loaded</span>
                </div>
              )}
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (activeDemoRole) setActiveDemoRole(null);
                    }}
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
                <div className="relative group/input">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within/input:text-black">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (activeDemoRole) setActiveDemoRole(null);
                    }}
                    autoComplete="current-password"
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

              {/* Submit Button with Hover Lift and Arrow Glide */}
              <button
                type="submit"
                disabled={loading}
                className="group/btn mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.3)] active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                    <span className="hidden font-mono text-[10px] text-gray-400 sm:inline-block">↵</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200/80"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-red-500"></span>
                  Single Sign-On (SSO)
                  <span className="h-1 w-1 rounded-full bg-red-500"></span>
                </span>
              </div>
            </div>

            {/* Google Login Styled with OpsPilot Pill Design */}
            <div className="flex w-full flex-col items-center">
              <div className="mb-2 flex w-full max-w-[360px] items-center justify-between px-1 text-[10px] font-semibold text-gray-400">
                <span>Google Workspace</span>
                <div className="flex items-center gap-0.5 rounded-full border border-gray-200/80 bg-gray-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setGoogleTheme('outline')}
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold transition-all cursor-pointer ${
                      googleTheme === 'outline'
                        ? 'bg-white text-black shadow-2xs'
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    Outline
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleTheme('filled_black')}
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold transition-all cursor-pointer ${
                      googleTheme === 'filled_black'
                        ? 'bg-black text-white shadow-2xs'
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    Stealth
                  </button>
                </div>
              </div>

              <div className="group/google relative flex w-full max-w-[360px] items-center justify-center overflow-hidden rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme={googleTheme}
                  size="large"
                  text="continue_with"
                  shape="pill"
                  width="360"
                  logo_alignment="center"
                />
              </div>
              <p className="mt-2 text-center text-[10px] font-medium text-gray-400">
                Automatic workspace provisioning via Google Cloud Identity
              </p>
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

