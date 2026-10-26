import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage } from '../services/projectApi';
import { isAxiosError } from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, LoginSchema, SignupSchema } from '../services/api';
import { PASSWORD_REQUIREMENTS, SignupRoleSchema } from '../lib/authValidation';
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
  ArrowUpRight,
  LoaderCircle,
  Check,
} from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { AuthMascot, type MascotCover, type MascotMood } from '../components/AuthMascot';
import '../styles/auth.css';

type Mode = 'login' | 'signup';
type FieldName = 'name' | 'email' | 'password' | 'confirm' | 'role';
type FieldErrors = Partial<Record<FieldName, string>>;

const fieldFromPath = (path: PropertyKey | undefined): FieldName | undefined => {
  if (path === 'confirmPassword') return 'confirm';
  return ['name', 'email', 'password', 'role'].includes(String(path)) ? path as FieldName : undefined;
};

const COPY: Record<Mode, {
  badge: string;
  titleLines: [string, string, string];
  blurb: string;
  features: { tag: string; title: string; caption: string }[];
}> = {
  login: {
    badge: 'Platform Access',
    titleLines: ['Welcome back', 'to your', 'workspace.'],
    blurb: 'Sign in to manage deployments, infrastructure, and service health in your workspace.',
    features: [
      { tag: '01', title: 'Deployment context', caption: 'Every release tied to its service' },
      { tag: '02', title: 'Operational visibility', caption: 'Logs, metrics, and service health' },
    ],
  },
  signup: {
    badge: 'Platform Registration',
    titleLines: ['Bring your team', 'into one', 'workspace.'],
    blurb: 'Create an OpsPilot workspace for deployments, infrastructure, and shared operational visibility.',
    features: [
      { tag: '01', title: 'One shared view', caption: 'Projects, releases, and runtime' },
      { tag: '02', title: 'Clear access', caption: 'Choose a role for your workspace' },
    ],
  },
};

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@opspilot.io' },
  { role: 'Developer', email: 'developer@opspilot.io' },
  { role: 'DevOps', email: 'devops@opspilot.io' },
];

const indexStyle = (i: number) => ({ '--i': i }) as React.CSSProperties;

const Field: React.FC<{ icon: React.ReactNode; index: number; children: React.ReactNode; error?: string; errorId: string; inputId: string; label: string }> = ({
  icon,
  index,
  children,
  error,
  errorId,
  inputId,
  label,
}) => (
  <div className="auth-field-group">
    <label htmlFor={inputId} className="auth-field-label">{label}</label>
    <div style={indexStyle(index)} className={`auth-field${error ? ' auth-field--invalid' : ''}`}>
      <div className="pl-2 text-gray-500">{icon}</div>
      {children}
    </div>
    {error && <p id={errorId} className="auth-field-error" role="status" aria-live="polite">{error}</p>}
  </div>
);

const inputClass =
  'w-full bg-transparent px-3 py-2.5 text-sm font-medium text-black placeholder-gray-500 focus:outline-none';

const RevealButton: React.FC<{ shown: boolean; onToggle: () => void }> = ({ shown, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? 'Hide password' : 'Show password'}
    aria-pressed={shown}
    className="auth-password-toggle"
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
  const [editedFields, setEditedFields] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors>({});

  // Google Login State
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('Developer');
  const roleDialogRef = useRef<HTMLDialogElement>(null);
  const requestRef = useRef(0);
  const pendingRef = useRef(false);

  // A response from a previous mode or an unmounted page must not redirect the user.
  useEffect(() => () => {
    requestRef.current += 1;
    pendingRef.current = false;
  }, [mode]);

  useEffect(() => {
    const dialog = roleDialogRef.current;
    if (showRoleSelection) dialog?.showModal();
    else dialog?.close();
  }, [showRoleSelection]);

  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current === mode) return;
    prevMode.current = mode;
    setError('');
    setFocused(null);
    setEditedFields({});
    setServerFieldErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
    setShowRoleSelection(false);
    setPendingGoogleToken(null);
  }, [mode]);

  const loginPanelRef = useRef<HTMLDivElement>(null);
  const signupPanelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number>();
  useLayoutEffect(() => {
    const el = (mode === 'login' ? loginPanelRef : signupPanelRef).current;
    if (!el) return;
    const update = () => setPanelHeight(el.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errorTick === 0) return;
    const card = cardRef.current;
    const animation = card && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 240, easing: 'ease-out' })
      : null;
    setOops(true);
    const timer = window.setTimeout(() => setOops(false), 1400);
    return () => { window.clearTimeout(timer); animation?.cancel(); };
  }, [errorTick]);

  const fail = (message: string) => {
    setError(message);
    setErrorTick((n) => n + 1);
  };

  const markFieldEdited = (field: FieldName) => {
    setEditedFields((current) => ({ ...current, [field]: true }));
  };

  const clearFieldError = (field: FieldName) => {
    setError('');
    setServerFieldErrors(current => ({ ...current, [field]: undefined, ...(field === 'password' ? { confirm: undefined } : {}) }));
  };

  const startRequest = () => {
    if (pendingRef.current) return null;
    pendingRef.current = true;
    setError('');
    setServerFieldErrors({});
    setLoading(true);
    return ++requestRef.current;
  };

  const finishRequest = (request: number) => {
    if (request !== requestRef.current) return;
    pendingRef.current = false;
    setLoading(false);
  };

  const focusInvalid = (form: HTMLFormElement, field: PropertyKey | undefined) => {
    const input = form.elements.namedItem(String(field));
    if (input instanceof HTMLElement) input.focus();
  };

  const failRequest = (err: unknown, fallback: string) => {
    const message = errorMessage(err, fallback);
    const fields: FieldErrors = {};
    if (isAxiosError<{ fieldErrors?: Record<string, unknown> }>(err)) {
      const backendFields = err.response?.data?.fieldErrors;
      if (backendFields && typeof backendFields === 'object') {
        for (const [path, detail] of Object.entries(backendFields)) {
          const field = fieldFromPath(path);
          if (field && (mode === 'signup' || field === 'email' || field === 'password') && typeof detail === 'string') fields[field] = detail;
        }
      }
      if (err.response?.status === 429) {
        fail('Too many attempts. Please wait a moment and try again.');
        return;
      }
      if (!err.response) {
        fail('Unable to reach the server. Check your connection and try again.');
        return;
      }
    }
    if (mode === 'signup' && /email address is already in use/i.test(message)) fields.email = 'An account with this email already exists. Sign in instead.';
    if (Object.keys(fields).length) {
      setServerFieldErrors(fields);
      setEditedFields(current => ({ ...current, ...Object.fromEntries(Object.keys(fields).map(field => [field, true])) }));
      fail('Please check the highlighted fields.');
      const form = (mode === 'login' ? loginPanelRef : signupPanelRef).current?.querySelector('form');
      const field = (['name', 'email', 'password', 'confirm', 'role'] as const).find(key => fields[key]);
      if (form) focusInvalid(form, field === 'confirm' ? 'confirmPassword' : field);
      return;
    }
    fail(message);
  };

  const closeRoleSelection = () => {
    requestRef.current += 1;
    pendingRef.current = false;
    setLoading(false);
    setShowRoleSelection(false);
    setPendingGoogleToken(null);
    setError('');
  };

  const switchMode = (next: Mode) => {
    if (next !== mode) navigate(next === 'login' ? '/login' : '/signup');
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pendingRef.current) return;
    setError('');

    const validation = LoginSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) {
      setEditedFields({ email: true, password: true });
      focusInvalid(e.currentTarget, validation.error.issues[0]?.path[0]);
      setError('');
      return;
    }

    const request = startRequest();
    if (request === null) return;
    try {
      const res = await api.login(validation.data);
      if (request !== requestRef.current) return;
      login(res);
      navigate('/monitoring');
    } catch (err) {
      if (request === requestRef.current) failRequest(err, 'Invalid email or password');
    } finally {
      finishRequest(request);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pendingRef.current) return;
    setError('');

    const validation = SignupSchema.safeParse({ name: name.trim(), email: email.trim(), password, confirmPassword, role });
    if (!validation.success) {
      setEditedFields({ name: true, email: true, password: true, confirm: true, role: true });
      focusInvalid(e.currentTarget, validation.error.issues[0]?.path[0]);
      setError('');
      return;
    }

    const request = startRequest();
    if (request === null) return;
    try {
      const { name: validName, email: validEmail, role: validRole } = validation.data;
      const res = await api.register({ name: validName, email: validEmail, password, role: validRole });
      if (request !== requestRef.current) return;
      navigate(`/verify-email?email=${encodeURIComponent(res.email)}`);
    } catch (err) {
      if (request === requestRef.current) failRequest(err, 'Registration failed');
    } finally {
      finishRequest(request);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    const request = startRequest();
    if (request === null) return;
    try {
      const res = await api.googleLogin({ idToken: credentialResponse.credential });
      if (request !== requestRef.current) return;
      login(res);
      navigate('/monitoring');
    } catch (err) {
      if (request !== requestRef.current) return;
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 428 || errorMessage(err, '').includes('Role is required')) {
        setPendingGoogleToken(credentialResponse.credential);
        setShowRoleSelection(true);
      } else {
        fail(errorMessage(err, 'Google login failed'));
      }
    } finally {
      finishRequest(request);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleToken) return;
    const validation = SignupRoleSchema.safeParse(selectedRole);
    if (!validation.success) { fail(validation.error.issues[0].message); return; }
    const request = startRequest();
    if (request === null) return;
    try {
      const res = await api.googleLogin({ idToken: pendingGoogleToken, role: validation.data });
      if (request !== requestRef.current) return;
      login(res);
      navigate('/monitoring');
    } catch (err) {
      if (request === requestRef.current) fail(errorMessage(err, 'Registration failed'));
    } finally {
      finishRequest(request);
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
    onBlur: () => {
      setFocused((current) => (current === field ? null : current));
      markFieldEdited(field);
    },
  });

  const validation = mode === 'login'
    ? LoginSchema.safeParse({ email, password })
    : SignupSchema.safeParse({ name, email, password, confirmPassword, role });
  const fieldErrors: FieldErrors = { ...serverFieldErrors };
  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const field = fieldFromPath(issue.path[0]);
      if (field && editedFields[field] && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
  }

  return (
    <div className="auth-root selection:bg-black selection:text-white">
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
            className="auth-brand-home"
            aria-label="OpsPilot home"
          >
            <span className="auth-wordmark">OPS<span>/</span>PILOT</span>
            <span className="auth-wordmark-tag">DEVELOPER PLATFORM</span>
          </button>

          <div className="flex items-center gap-3">
            <Link to="/" className="auth-nav-link" aria-label="Back to platform">
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
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
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
              <span className="auth-badge-dot" />
              <span>{copy.badge}</span>
            </div>

            <h1 className="auth-brand-title">
              <span>{copy.titleLines[0]}</span>
              <span className="auth-brand-title-accent">{copy.titleLines[1]}</span>
              <span>{copy.titleLines[2]}</span>
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
            {mode === 'login' && <div className="auth-demo-access mt-8 pt-5 border-t border-black/10 w-full max-w-md">
              <span className="font-tech-mono text-[10px] font-bold uppercase tracking-wider text-gray-600 block mb-2.5">
                Quick Demo Access:
              </span>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword('password123');
                      setError('');
                      setEditedFields({});
                      setServerFieldErrors({});
                      loginPanelRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
                    }}
                    className="auth-demo-pill"
                  >
                    <span>●</span> {acc.role}
                  </button>
                ))}
              </div>
            </div>}
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
                {error && !showRoleSelection && (
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
                    inert={mode !== 'login'}
                    aria-hidden={mode !== 'login'}
                    className="auth-panel auth-panel--login"
                  >
                    <h2 className="auth-form-title">Sign in to OpsPilot</h2>
                    <p className="auth-form-description">Pick up where you left off.</p>
                    <form onSubmit={handleLogin} noValidate aria-busy={loading} className="space-y-3.5">
                      <Field icon={<Mail className="h-4 w-4" />} index={1} error={mode === 'login' ? fieldErrors.email : undefined} inputId="email-login" label="Work email" errorId="email-login-error">
                        <input
                          id="email-login"
                          name="email"
                          autoComplete="username"
                          autoCapitalize="none"
                          spellCheck={false}
                          inputMode="email"
                          type="email"
                          placeholder="Work Email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                          {...focusProps('email')}
                          className={inputClass}
                          aria-invalid={Boolean(mode === 'login' && fieldErrors.email)}
                          aria-describedby={mode === 'login' && fieldErrors.email ? 'email-login-error' : undefined}
                          required
                        />
                      </Field>

                      <div className="relative">
                        <Field icon={<Lock className="h-4 w-4" />} index={2} error={mode === 'login' ? fieldErrors.password : undefined} inputId="password-login" label="Password" errorId="password-login-error">
                          <input
                            id="password-login"
                            name="password"
                            autoComplete="current-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                            {...focusProps('password')}
                            className={inputClass}
                            aria-invalid={Boolean(mode === 'login' && fieldErrors.password)}
                            aria-describedby={mode === 'login' && fieldErrors.password ? 'password-login-error' : undefined}
                            required
                          />
                          <RevealButton
                            shown={showPassword}
                            onToggle={() => setShowPassword(!showPassword)}
                          />
                        </Field>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn mt-4"
                      >
                        <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                        {loading ? <LoaderCircle className="auth-loading-icon h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                      </button>
                      <p className="auth-inline-switch">
                        New to OpsPilot? <Link to="/signup">Register</Link>
                      </p>
                    </form>
                  </div>

                  {/* Signup Form */}
                  <div
                    ref={signupPanelRef}
                    data-active={mode === 'signup'}
                    inert={mode !== 'signup'}
                    aria-hidden={mode !== 'signup'}
                    className="auth-panel auth-panel--signup"
                  >
                    <h2 className="auth-form-title">Create your account</h2>
                    <p className="auth-form-description">Your workspace starts here.</p>
                    <form onSubmit={handleSignup} noValidate aria-busy={loading} className="space-y-3">
                      <Field icon={<UserIcon className="h-4 w-4" />} index={1} error={fieldErrors.name} inputId="signup-name" label="Full name" errorId="signup-name-error">
                        <input
                          id="signup-name"
                          name="name"
                          autoComplete="name"
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
                          {...focusProps('name')}
                          className={inputClass}
                          aria-invalid={Boolean(fieldErrors.name)}
                          aria-describedby={fieldErrors.name ? 'signup-name-error' : undefined}
                          required
                        />
                      </Field>

                      <Field icon={<Mail className="h-4 w-4" />} index={2} error={mode === 'signup' ? fieldErrors.email : undefined} inputId="email-signup" label="Work email" errorId="email-signup-error">
                        <input
                          id="email-signup"
                          name="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          inputMode="email"
                          type="email"
                          placeholder="Work Email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                          {...focusProps('email')}
                          className={inputClass}
                          aria-invalid={Boolean(mode === 'signup' && fieldErrors.email)}
                          aria-describedby={mode === 'signup' && fieldErrors.email ? 'email-signup-error' : undefined}
                          required
                        />
                      </Field>

                      <div className="relative">
                        <Field icon={<Lock className="h-4 w-4" />} index={3} error={mode === 'signup' ? fieldErrors.password : undefined} inputId="password-signup" label="Password" errorId="password-signup-error">
                          <input
                            id="password-signup"
                            name="password"
                            autoComplete="new-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                            {...focusProps('password')}
                            className={inputClass}
                            aria-invalid={Boolean(mode === 'signup' && fieldErrors.password)}
                            aria-describedby={fieldErrors.password ? 'signup-password-hint password-signup-error' : 'signup-password-hint'}
                            required
                          />
                          <RevealButton
                            shown={showPassword}
                            onToggle={() => setShowPassword(!showPassword)}
                          />
                        </Field>
                      </div>

                      <div className="relative">
                        <ul id="signup-password-hint" className="auth-password-requirements" aria-label="Password requirements">
                          {PASSWORD_REQUIREMENTS.map(({ label, test }) => {
                            const met = test(password);
                            return <li key={label} data-met={met}><Check className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">{met ? 'Met: ' : 'Needed: '}</span>{label}</li>;
                          })}
                        </ul>
                        <Field icon={<Lock className="h-4 w-4" />} index={4} error={fieldErrors.confirm} inputId="signup-confirm" label="Confirm password" errorId="signup-confirm-error">
                          <input
                            id="signup-confirm"
                            name="confirmPassword"
                            autoComplete="new-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm"
                            aria-label="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirm'); }}
                            {...focusProps('confirm')}
                            className={inputClass}
                            aria-invalid={Boolean(fieldErrors.confirm)}
                            aria-describedby={fieldErrors.confirm ? 'signup-confirm-error' : undefined}
                            required
                          />
                          <RevealButton
                            shown={showConfirmPassword}
                            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                          />
                        </Field>
                      </div>

                      <Field icon={<Shield className="h-4 w-4" />} index={5} inputId="signup-role" label="Workspace role" error={fieldErrors.role} errorId="signup-role-error">
                        <select
                          id="signup-role"
                          name="role"
                          aria-label="Workspace role"
                          value={role}
                          onChange={(e) => { setRole(e.target.value); clearFieldError('role'); }}
                          {...focusProps('role')}
                          aria-invalid={Boolean(fieldErrors.role)}
                          aria-describedby={fieldErrors.role ? 'signup-role-error' : undefined}
                          className={inputClass}
                        >
                          <option value="Developer">Role: Developer</option>
                          <option value="DevOps">Role: DevOps</option>
                        </select>
                      </Field>

                      <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn mt-3"
                      >
                        <span>{loading ? 'Creating...' : 'Create Account'}</span>
                        {loading ? <LoaderCircle className="auth-loading-icon h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                      </button>
                      <p className="auth-inline-switch">
                        Already registered? <Link to="/login">Sign in</Link>
                      </p>
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

                <div data-testid="google-login" className="auth-google-login flex justify-center" inert={loading}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => fail('Google Authentication failed')}
                    shape="pill"
                    size="medium"
                    text={mode === 'login' ? 'signin_with' : 'signup_with'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Role Selection Modal for Google Login */}
      {createPortal(
        <dialog ref={roleDialogRef} className="auth-role-dialog" aria-labelledby="role-selection-title" onCancel={closeRoleSelection}>
          <h3 id="role-selection-title" className="font-tech-mono text-sm font-bold uppercase text-black">
            Select Your Role
          </h3>
          <p className="mt-2 text-xs text-gray-600">
            Please choose a workspace role to finalize your Google registration.
          </p>
          {error && showRoleSelection && <p role="alert" className="auth-field-error mt-3">{error}</p>}
          <form onSubmit={handleRoleSubmit} className="mt-4 space-y-4">
            <div className="auth-field">
              <select
                aria-label="Workspace role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={inputClass}
              >
                <option value="Developer">Role: Developer</option>
                <option value="DevOps">Role: DevOps</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="auth-submit-btn cursor-pointer">
              <span>{loading ? 'Saving...' : 'Complete Sign Up'}</span>
            </button>
            <button type="button" onClick={closeRoleSelection} className="auth-dialog-cancel">Cancel</button>
          </form>
        </dialog>,
        document.body
      )}
    </div>
  );
};
