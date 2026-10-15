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
  title: string[][];
  blurb: string;
  features: { title: string; caption: string }[];
}> = {
  login: {
    badge: 'Platform Access',
    title: [['Sign', 'in', 'to', 'your'], ['workspace']],
    blurb: 'Access your autonomous operations command center and manage your infrastructure effortlessly.',
    features: [
      { title: 'Single Sign-On', caption: 'Enterprise Ready' },
      { title: 'Zero Trust', caption: 'Security Model' },
    ],
  },
  signup: {
    badge: 'Platform Registration',
    title: [['Create', 'your'], ['account']],
    blurb: 'Deploy, observe, and diagnose with autonomous intelligence. Join the unified operational workspace.',
    features: [
      { title: 'Instant Setup', caption: 'Ready in seconds' },
      { title: 'Team Ready', caption: 'Role-Based Access' },
    ],
  },
};

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@opspilot.io' },
  { role: 'Developer', email: 'developer@opspilot.io' },
  { role: 'DevOps', email: 'devops@opspilot.io' },
];

const SPARKLES = [
  { dx: '-46px', dy: '-22px', color: '#ef4444' },
  { dx: '42px', dy: '-26px', color: '#0a0a0a' },
  { dx: '-30px', dy: '24px', color: '#f59e0b' },
  { dx: '36px', dy: '22px', color: '#ef4444' },
  { dx: '0px', dy: '-32px', color: '#f59e0b' },
  { dx: '58px', dy: '0px', color: '#0a0a0a' },
];

const indexStyle = (i: number) => ({ '--i': i }) as React.CSSProperties;

const Field: React.FC<{ icon: React.ReactNode; index: number; children: React.ReactNode }> = ({
  icon,
  index,
  children,
}) => (
  <div
    style={indexStyle(index)}
    className="auth-field relative flex items-center rounded-2xl border border-gray-200/90 bg-[#FAFAFA] p-1 shadow-sm transition-all duration-300 focus-within:border-black focus-within:ring-4 focus-within:ring-gray-100 focus-within:bg-white"
  >
    <div className="pl-3.5 text-gray-400">{icon}</div>
    {children}
  </div>
);

const inputClass =
  'w-full bg-transparent px-3 py-2.5 text-sm font-medium text-black placeholder-gray-400 focus:outline-none';

const RevealButton: React.FC<{ shown: boolean; onToggle: () => void }> = ({ shown, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? 'Hide password' : 'Show password'}
    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-all hover:scale-110 hover:text-black cursor-pointer"
  >
    {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
);

/** Sign in and sign up on one page; /login and /signup both render this and pick the mode. */
export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const mode: Mode = location.pathname.startsWith('/signup') ? 'signup' : 'login';
  const copy = COPY[mode];

  // Email and password carry over when switching modes.
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

  // Count mode switches (including back/forward) to replay the switch animations.
  const [switches, setSwitches] = useState(0);
  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current === mode) return;
    prevMode.current = mode;
    setSwitches((n) => n + 1);
    setError('');
    setFocused(null);
  }, [mode]);

  // Animate the form area to the active panel's height.
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

  // Errors shake the card and make the mascot wince.
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errorTick === 0) return;
    const card = cardRef.current;
    if (card) {
      card.classList.remove('auth-shake');
      void card.offsetWidth; // restart the animation
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

  // What the mascot does: watch the caret, hide its eyes for passwords, react to results.
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

  let wordIndex = 0;

  return (
    <div className="auth-root min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-black selection:bg-black selection:text-white antialiased flex flex-col">
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
          <div key={mode} className="auth-swap-in flex items-center gap-2.5">
            <span className="hidden text-xs text-gray-500 sm:inline">
              {mode === 'login' ? 'New to OpsPilot?' : 'Have an account?'}
            </span>
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {mode === 'login' ? 'Get Started Free' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative isolate flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-20 lg:px-12">
        {/* Subtle Ambient Radial Backlight */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[520px] w-[820px] rounded-full bg-gradient-to-tr from-gray-200/40 via-gray-100/30 to-transparent blur-3xl animate-pulse-slow" />
        </div>
        {/* Little floating confetti shapes */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden sm:block" aria-hidden>
          <span className="absolute left-[8%] top-[26%] h-3 w-3 rounded-full bg-red-400/70 animate-float" />
          <span className="absolute left-[46%] top-[16%] h-5 w-5 rounded-full border-2 border-black/15 animate-float-reverse" />
          <span className="absolute right-[7%] top-[30%] h-4 w-4 rotate-12 rounded-md bg-amber-300/70 animate-float-slow" />
          <span className="absolute bottom-[14%] left-[16%] h-4 w-4 rotate-45 rounded-sm border-2 border-red-300/80 animate-float-slow" />
          <span className="absolute bottom-[10%] right-[18%] h-2.5 w-2.5 rounded-full bg-black/20 animate-float" />
        </div>

        <div className="z-10 flex w-full max-w-5xl flex-col lg:flex-row items-center gap-12 lg:gap-24">
          {/* Left Side: Typography & Hero Elements (replays on every switch) */}
          <div key={mode} className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition-all duration-300 hover:border-black/20 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              {copy.badge}
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-black sm:text-6xl leading-[1.04]">
              {copy.title.map((line, lineIndex) => (
                <React.Fragment key={lineIndex}>
                  {lineIndex > 0 && (
                    <>
                      {' '}
                      <br className="hidden lg:block" />
                    </>
                  )}
                  {line.map((word, i) => (
                    <React.Fragment key={word}>
                      {i > 0 && ' '}
                      <span className="auth-word" style={indexStyle(wordIndex++)}>
                        {word}
                      </span>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
              <span className="auth-dot text-red-500" style={indexStyle(wordIndex)}>.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-gray-500 font-normal animate-fade-in-up [animation-delay:200ms]">
              {copy.blurb}
            </p>

            <div className="mt-10 hidden lg:grid grid-cols-2 gap-8 text-left animate-fade-in-up [animation-delay:300ms]">
              {copy.features.map((feature) => (
                <div key={feature.title}>
                  <p className="text-xl font-black tracking-tight text-black transition-transform duration-300 hover:scale-105">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400">{feature.caption}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: the card, with the mascot peeking over its top edge */}
          <div className="relative mt-16 w-full max-w-[440px] animate-fade-in-up [animation-delay:400ms] lg:mt-0">
            <AuthMascot gaze={gaze} cover={cover} mood={mood} hopKey={switches} />

            <div
              ref={cardRef}
              className="relative z-10 rounded-3xl border border-gray-200/80 bg-white p-7 sm:p-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] transition-shadow duration-400 hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.06)]"
            >
              {/* Sign in / Sign up switch */}
              <div role="tablist" aria-label="Choose sign in or sign up" className="relative mb-6 grid grid-cols-2 rounded-full bg-gray-100 p-1">
                <span
                  aria-hidden
                  className="auth-toggle-pill absolute inset-y-1 left-1 w-[calc(50%-4px)]"
                  style={{ transform: mode === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
                >
                  <span key={switches} className={`block h-full w-full rounded-full bg-black shadow-md ${switches ? 'auth-toggle-squish' : ''}`} />
                </span>
                {(['login', 'signup'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={mode === tab}
                    onClick={() => switchMode(tab)}
                    className={`relative z-10 rounded-full py-2.5 text-xs font-bold transition-colors duration-300 cursor-pointer ${
                      mode === tab ? 'text-white' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    {tab === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
                {switches > 0 && (
                  <span
                    key={switches}
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 z-20 w-0"
                    style={{ left: mode === 'login' ? '25%' : '75%' }}
                  >
                    {SPARKLES.map((s, i) => (
                      <span
                        key={i}
                        className="auth-sparkle"
                        style={{ '--dx': s.dx, '--dy': s.dy, background: s.color, animationDelay: `${i * 25}ms` } as React.CSSProperties}
                      />
                    ))}
                  </span>
                )}
              </div>

              {/* Error Notification */}
              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-3.5 text-xs font-semibold text-red-700 shadow-2xs animate-fade-in-up"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="flex-1 leading-snug">{error}</span>
                </div>
              )}

              {/* Both forms share one grid cell; the inactive one slides away */}
              <div
                className="auth-panels -m-2 grid overflow-hidden p-2"
                style={panelHeight === undefined ? undefined : { height: panelHeight + 16 }}
              >
                <div
                  ref={loginPanelRef}
                  className="auth-panel auth-panel--login"
                  data-active={mode === 'login'}
                  inert={mode !== 'login'}
                >
                  <div className="auth-field mb-6" style={indexStyle(0)}>
                    <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Demo Accounts</div>
                    <div className="flex flex-wrap gap-2">
                      {DEMO_ACCOUNTS.map((item) => (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => {
                            setEmail(item.email);
                            setPassword('Password123!');
                          }}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200 cursor-pointer border hover:-translate-y-0.5 active:scale-95 ${
                            email === item.email
                              ? 'bg-black text-white border-black shadow-md'
                              : 'bg-white text-gray-600 border-gray-200/80 hover:border-black/30 hover:bg-gray-50 hover:text-black shadow-2xs'
                          }`}
                        >
                          {item.role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <Field icon={<Mail className="h-4 w-4" />} index={1}>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        {...focusProps('email')}
                        placeholder="Work Email"
                        className={inputClass}
                      />
                    </Field>

                    <Field icon={<Lock className="h-4 w-4" />} index={2}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        {...focusProps('password')}
                        placeholder="Password"
                        className={`${inputClass} pr-9`}
                      />
                      <RevealButton shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                    </Field>

                    <button
                      type="submit"
                      disabled={loading}
                      style={indexStyle(3)}
                      className="auth-field group mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
                </div>

                <div
                  ref={signupPanelRef}
                  className="auth-panel auth-panel--signup"
                  data-active={mode === 'signup'}
                  inert={mode !== 'signup'}
                >
                  <form onSubmit={handleSignup} className="space-y-4">
                    <Field icon={<UserIcon className="h-4 w-4" />} index={0}>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        {...focusProps('name')}
                        placeholder="Full Name"
                        className={inputClass}
                      />
                    </Field>

                    <Field icon={<Mail className="h-4 w-4" />} index={1}>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        {...focusProps('email')}
                        placeholder="Work Email"
                        className={inputClass}
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field icon={<Lock className="h-4 w-4" />} index={2}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          {...focusProps('password')}
                          placeholder="Password"
                          className={`${inputClass} pr-9`}
                        />
                        <RevealButton shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                      </Field>

                      <Field icon={<Lock className="h-4 w-4" />} index={3}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          {...focusProps('confirm')}
                          placeholder="Confirm"
                          className={`${inputClass} pr-9`}
                        />
                        <RevealButton shown={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
                      </Field>
                    </div>

                    {confirmPassword.length > 0 && confirmPassword !== password && (
                      <p className="pl-1 text-[11px] text-red-600 font-medium animate-fade-in-up">Passwords do not match.</p>
                    )}

                    <Field icon={<Shield className="h-4 w-4" />} index={4}>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className={`${inputClass} appearance-none cursor-pointer`}
                      >
                        <option value="Developer">Developer (Standard Scoped)</option>
                        <option value="DevOps">DevOps Engineer (Cluster & CI/CD)</option>
                      </select>
                    </Field>

                    <button
                      type="submit"
                      disabled={loading}
                      style={indexStyle(5)}
                      className="auth-field group mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg active:translate-y-0 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                    >
                      <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                      <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </button>
                  </form>
                </div>
              </div>

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
                    onError={() => fail('Google Login Failed')}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="pill"
                  />
                </div>
              </div>

              <div key={mode} className="auth-swap-in mt-6 text-center text-xs font-medium text-gray-500">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="font-bold text-black transition-colors hover:underline cursor-pointer"
                >
                  {mode === 'login' ? 'Register now' : 'Sign in'}
                </button>
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
