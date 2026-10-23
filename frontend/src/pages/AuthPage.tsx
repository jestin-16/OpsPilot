import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/projectApi';
import { isAxiosError } from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, LoginSchema, SignupSchema } from '../services/api';
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
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { AuthMascot, type MascotCover, type MascotMood } from '../components/AuthMascot';
import '../styles/auth.css';

type Mode = 'login' | 'signup';
type FieldName = 'name' | 'email' | 'password' | 'confirm';

const COPY: Record<Mode, {
  badge: string;
  line1: string;
  italicWord: string;
  prefix: string;
  line2: string;
  blurb: string;
  features: { tag: string; title: string; caption: string }[];
}> = {
  login: {
    badge: 'Platform Access',
    line1: 'SIGN IN',
    italicWord: 'with',
    prefix: '// YOUR',
    line2: 'WORKSPACE',
    blurb: 'Access your autonomous operations command center and govern your infrastructure effortlessly.',
    features: [
      { tag: '01', title: 'Single Sign-On', caption: 'Enterprise Ready JWT' },
      { tag: '02', title: 'Zero Trust', caption: 'RBAC Security Model' },
    ],
  },
  signup: {
    badge: 'Platform Registration',
    line1: 'CREATE',
    italicWord: 'with',
    prefix: '// VERIFIED',
    line2: 'ACCOUNT',
    blurb: 'Deploy, observe, and diagnose with autonomous intelligence. Join the unified operational workspace.',
    features: [
      { tag: '01', title: 'Instant Setup', caption: 'Ready in seconds' },
      { tag: '02', title: 'Team Ready', caption: 'Role-Based Access' },
    ],
  },
};

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@opspilot.io' },
  { role: 'Developer', email: 'developer@opspilot.io' },
  { role: 'DevOps', email: 'devops@opspilot.io' },
];

const indexStyle = (i: number) => ({ '--i': i }) as React.CSSProperties;

const Field: React.FC<{ icon: React.ReactNode; index: number; children: React.ReactNode }> = ({
  icon,
  index,
  children,
}) => (
  <div style={indexStyle(index)} className="auth-field">
    <div className="pl-2 text-gray-500">{icon}</div>
    {children}
  </div>
);

const inputClass =
  'w-full bg-transparent px-3 py-2 text-xs font-tech-mono font-medium text-black placeholder-gray-500 focus:outline-none';

const RevealButton: React.FC<{ shown: boolean; onToggle: () => void }> = ({ shown, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? 'Hide password' : 'Show password'}
    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 transition-all hover:scale-110 hover:text-black cursor-pointer"
  >
    {shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
  </button>
);

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const mode: Mode = location.pathname.startsWith('/signup') ? 'signup' : 'login';
  const copy = COPY[mode];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Developer');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorTick, setErrorTick] = useState(0);
  const [oops, setOops] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<FieldName | null>(null);

  // Google Login State
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('Developer');

  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current === mode) return;
    prevMode.current = mode;
    setError('');
    setFocused(null);
  }, [mode]);

  const loginPanelRef = useRef<HTMLDivElement>(null);
  const signupPanelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number>();
  useLayoutEffect(() => {
    const el = (mode === 'login' ? loginPanelRef : signupPanelRef).current;
    if (!el) return;
    const update = () => setPanelHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errorTick === 0) return;
    const card = cardRef.current;
    if (card) {
      card.classList.remove('auth-shake');
      void card.offsetWidth;
      card.classList.add('auth-shake');
    }
    setOops(true);
    const timer = window.setTimeout(() => setOops(false), 1400);
    return () => window.clearTimeout(timer);
  }, [errorTick]);

  const fail = (message: string) => {
    setError(message);
    setErrorTick((n) => n + 1);
  };

  const switchMode = (next: Mode) => {
    if (next !== mode) navigate(next === 'login' ? '/login' : '/signup');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      fail(validation.error.issues[0]?.message ?? 'Please check your email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email, password });
      login(res);
      navigate('/monitoring');
    } catch (err) {
      fail(errorMessage(err, 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = SignupSchema.safeParse({ name, email, password, confirmPassword, role });
    if (!validation.success) {
      fail(validation.error.issues[0]?.message ?? 'Please check the form and try again');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({ name, email, password, role: validation.data.role });
      navigate(`/verify-email?email=${encodeURIComponent(res.email)}`);
    } catch (err) {
      fail(errorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.googleLogin({ idToken: credentialResponse.credential });
      login(res);
      navigate('/monitoring');
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 428 || errorMessage(err, '').includes('Role is required')) {
        setPendingGoogleToken(credentialResponse.credential);
        setShowRoleSelection(true);
      } else {
        fail(errorMessage(err, 'Google login failed'));
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
    } catch (err) {
      fail(errorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const focusedText = focused === 'name' ? name : focused === 'email' ? email : null;
  const gaze = focusedText === null ? null : Math.min(focusedText.length / 30, 1) * 2 - 1;
  let cover: MascotCover = 'none';
  if (focused === 'password') cover = showPassword ? 'peek' : 'full';
  if (focused === 'confirm') cover = showConfirmPassword ? 'peek' : 'full';
  const mood: MascotMood = oops ? 'oops' : loading ? 'happy' : 'idle';

  const focusProps = (field: FieldName) => ({
    onFocus: () => setFocused(field),
    onBlur: () => setFocused((current) => (current === field ? null : current)),
  });

  return (
    <div className="auth-root selection:bg-[#181417] selection:text-white">
      {/* Subtle organic noise grain */}
      <div className="auth-film-grain" aria-hidden="true" />

      {/* Ambient Golden Underglow */}
      <div className="auth-underglow" aria-hidden="true" />

      {/* Top Header Navigation (Direct Page Header, Not Enclosed in a Card) */}
      <header className="auth-top-nav">
        <div className="auth-nav-container">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-left bg-none border-none p-0 cursor-pointer"
          >
            <span className="font-tech-mono text-sm font-bold tracking-tight text-black">
              ( OPS_PILOT )
            </span>
            <span className="font-tech-mono text-[10px] font-semibold text-gray-700 hidden sm:inline">
              [ v02.4 / AUTH-GATEWAY ]
            </span>
          </button>

          <div className="flex items-center gap-3">
            <Link to="/" className="auth-nav-link">
              <ArrowLeft className="h-3 w-3" />
              <span className="hidden sm:inline">Platform</span>
            </Link>
            <span className="h-3 w-px bg-black/20" />
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="auth-mode-pill"
            >
              <span>{mode === 'login' ? 'Get Started Free' : 'Sign In'}</span>
              <span className="text-[10px] opacity-70">↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Stage */}
      <main className="auth-stage">
        <div className="auth-stage-container">
          {/* Left Column: Editorial Brand & Context */}
          <div className="auth-brand-col">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 backdrop-blur-md px-3.5 py-1 font-tech-mono text-[11px] font-bold uppercase tracking-wider text-gray-800 shadow-2xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
              <span>{copy.badge}</span>
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.92] text-black">
              <span>{copy.line1}</span>
              <br />
              <span className="font-editorial-italic font-normal lowercase tracking-normal text-gray-800 pr-2">
                {copy.italicWord}
              </span>
              <span className="text-amber-600 font-tech-mono">{copy.prefix}</span>
              <br />
              <span>{copy.line2}</span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-700 font-normal">
              {copy.blurb}
            </p>

            {/* Platform Feature Context */}
            <div className="mt-8 flex flex-col sm:flex-row gap-6 w-full max-w-md">
              {copy.features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/5 font-tech-mono text-[10px] font-bold text-gray-700">
                    {f.tag}
                  </span>
                  <div>
                    <span className="font-tech-mono text-xs font-bold text-black block">
                      {f.title}
                    </span>
                    <span className="font-tech-mono text-[11px] text-gray-500">
                      {f.caption}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Demo Credentials */}
            <div className="mt-8 pt-5 border-t border-black/10 w-full max-w-md">
              <span className="font-tech-mono text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-2.5">
                Quick Demo Access:
              </span>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword('password123');
                      if (mode === 'signup') setConfirmPassword('password123');
                    }}
                    className="auth-demo-pill"
                  >
                    <span>●</span> {acc.role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: The Single Interactive Form Card & Mascot */}
          <div className="auth-form-col">
            <div ref={cardRef} className="auth-form-card-wrapper">
              {/* Mascot Peeking Over Form Card */}
              <AuthMascot
                gaze={gaze}
                cover={cover}
                mood={mood}
                hopKey={mode === 'login' ? 0 : 1}
              />

              {/* Form Card */}
              <div className="auth-form-card">
                {error && (
                  <div
                    role="alert"
                    className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div
                  className="auth-panels grid"
                  style={{ height: panelHeight ? `${panelHeight}px` : 'auto' }}
                >
                  {/* Login Form */}
                  <div
                    ref={loginPanelRef}
                    data-active={mode === 'login'}
                    className="auth-panel auth-panel--login"
                  >
                    <form onSubmit={handleLogin} className="space-y-3.5">
                      <Field icon={<Mail className="h-4 w-4" />} index={1}>
                        <input
                          type="email"
                          placeholder="Work Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          {...focusProps('email')}
                          className={inputClass}
                          required
                        />
                      </Field>

                      <div className="relative">
                        <Field icon={<Lock className="h-4 w-4" />} index={2}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            {...focusProps('password')}
                            className={inputClass}
                            required
                          />
                        </Field>
                        <RevealButton
                          shown={showPassword}
                          onToggle={() => setShowPassword(!showPassword)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn mt-4"
                      >
                        <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                      </button>
                    </form>
                  </div>

                  {/* Signup Form */}
                  <div
                    ref={signupPanelRef}
                    data-active={mode === 'signup'}
                    className="auth-panel auth-panel--signup"
                  >
                    <form onSubmit={handleSignup} className="space-y-3">
                      <Field icon={<UserIcon className="h-4 w-4" />} index={1}>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          {...focusProps('name')}
                          className={inputClass}
                          required
                        />
                      </Field>

                      <Field icon={<Mail className="h-4 w-4" />} index={2}>
                        <input
                          type="email"
                          placeholder="Work Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          {...focusProps('email')}
                          className={inputClass}
                          required
                        />
                      </Field>

                      <div className="relative">
                        <Field icon={<Lock className="h-4 w-4" />} index={3}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            {...focusProps('password')}
                            className={inputClass}
                            required
                          />
                        </Field>
                        <RevealButton
                          shown={showPassword}
                          onToggle={() => setShowPassword(!showPassword)}
                        />
                      </div>

                      <div className="relative">
                        <Field icon={<Lock className="h-4 w-4" />} index={4}>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            {...focusProps('confirm')}
                            className={inputClass}
                            required
                          />
                        </Field>
                        <RevealButton
                          shown={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                      </div>

                      <div className="auth-field">
                        <div className="pl-2 text-gray-500">
                          <Shield className="h-4 w-4" />
                        </div>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className={inputClass}
                        >
                          <option value="Developer">Role: Developer</option>
                          <option value="DevOps">Role: DevOps</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn mt-3"
                      >
                        <span>{loading ? 'Creating...' : 'Create Account'}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Google Sign In Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-tech-mono">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div data-testid="google-login" className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => fail('Google Authentication failed')}
                    shape="pill"
                    size="medium"
                    width="100%"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Role Selection Modal for Google Login */}
      {showRoleSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl">
            <h3 className="font-tech-mono text-sm font-bold uppercase text-black">
              Select Your Role
            </h3>
            <p className="mt-2 text-xs text-gray-600">
              Please choose a workspace role to finalize your Google registration.
            </p>
            <form onSubmit={handleRoleSubmit} className="mt-4 space-y-4">
              <div className="auth-field">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={inputClass}
                >
                  <option value="Developer">Role: Developer</option>
                  <option value="DevOps">Role: DevOps</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="auth-submit-btn">
                <span>{loading ? 'Saving...' : 'Complete Sign Up'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
