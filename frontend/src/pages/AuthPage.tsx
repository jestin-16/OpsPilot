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
  ArrowUpRight,
} from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { AuthMascot, type MascotCover, type MascotMood } from '../components/AuthMascot';
import '../styles/auth.css';

type Mode = 'login' | 'signup';
type FieldName = 'name' | 'email' | 'password' | 'confirm';

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

const Field: React.FC<{ icon: React.ReactNode; index: number; children: React.ReactNode; error?: string; errorId: string }> = ({
  icon,
  index,
  children,
  error,
  errorId,
}) => (
  <div className="auth-field-group">
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
  const [editedFields, setEditedFields] = useState<Partial<Record<FieldName, boolean>>>({});

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
    setEditedFields({});
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

  const markFieldEdited = (field: FieldName) => {
    setEditedFields((current) => ({ ...current, [field]: true }));
    setError('');
  };

  const switchMode = (next: Mode) => {
    if (next !== mode) navigate(next === 'login' ? '/login' : '/signup');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      setEditedFields({ email: true, password: true });
      setError('');
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
      setEditedFields({ name: true, email: true, password: true, confirm: true });
      setError('');
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
    onBlur: () => {
      setFocused((current) => (current === field ? null : current));
      markFieldEdited(field);
    },
  });

  const getFieldError = (field: FieldName): string | undefined => {
    if (!editedFields[field]) return undefined;
    if (field === 'confirm') {
      if (!confirmPassword) return 'Please confirm your password';
      return confirmPassword !== password ? 'Passwords do not match' : undefined;
    }

    if (mode === 'login') {
      const validation = LoginSchema.safeParse({
        email: field === 'email' ? email : 'validation@opspilot.io',
        password: field === 'password' ? password : 'ValidPass123!',
      });
      return validation.success ? undefined : validation.error.issues[0]?.message;
    }

    const candidatePassword = field === 'password' ? password : 'ValidPass123!';
    const validation = SignupSchema.safeParse({
      name: field === 'name' ? name : 'OpsPilot User',
      email: field === 'email' ? email : 'validation@opspilot.io',
      password: candidatePassword,
      confirmPassword: candidatePassword,
      role,
    });
    return validation.success ? undefined : validation.error.issues[0]?.message;
  };

  const fieldErrors = {
    name: mode === 'signup' ? getFieldError('name') : undefined,
    email: getFieldError('email'),
    password: getFieldError('password'),
    confirm: mode === 'signup' ? getFieldError('confirm') : undefined,
  };

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
                      <Field icon={<Mail className="h-4 w-4" />} index={1} error={mode === 'login' ? fieldErrors.email : undefined} errorId="email-login-error">
                        <input
                          id="email-login"
                          type="email"
                          placeholder="Work Email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); markFieldEdited('email'); }}
                          {...focusProps('email')}
                          className={inputClass}
                          aria-invalid={Boolean(mode === 'login' && fieldErrors.email)}
                          aria-describedby={mode === 'login' && fieldErrors.email ? 'email-login-error' : undefined}
                          required
                        />
                      </Field>

                      <div className="relative">
                        <Field icon={<Lock className="h-4 w-4" />} index={2} error={mode === 'login' ? fieldErrors.password : undefined} errorId="password-login-error">
                          <input
                            id="password-login"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); markFieldEdited('password'); }}
                            {...focusProps('password')}
                            className={inputClass}
                            aria-invalid={Boolean(mode === 'login' && fieldErrors.password)}
                            aria-describedby={mode === 'login' && fieldErrors.password ? 'password-login-error' : undefined}
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
                        <ArrowRight className="h-3.5 w-3.5" />
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
                    className="auth-panel auth-panel--signup"
                  >
                    <form onSubmit={handleSignup} className="space-y-3">
                      <Field icon={<UserIcon className="h-4 w-4" />} index={1} error={fieldErrors.name} errorId="signup-name-error">
                        <input
                          id="signup-name"
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => { setName(e.target.value); markFieldEdited('name'); }}
                          {...focusProps('name')}
                          className={inputClass}
                          aria-invalid={Boolean(fieldErrors.name)}
                          aria-describedby={fieldErrors.name ? 'signup-name-error' : undefined}
                          required
                        />
                      </Field>

                      <Field icon={<Mail className="h-4 w-4" />} index={2} error={mode === 'signup' ? fieldErrors.email : undefined} errorId="email-signup-error">
                        <input
                          id="email-signup"
                          type="email"
                          placeholder="Work Email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); markFieldEdited('email'); }}
                          {...focusProps('email')}
                          className={inputClass}
                          aria-invalid={Boolean(mode === 'signup' && fieldErrors.email)}
                          aria-describedby={mode === 'signup' && fieldErrors.email ? 'email-signup-error' : undefined}
                          required
                        />
                      </Field>

                      <div className="relative">
                        <Field icon={<Lock className="h-4 w-4" />} index={3} error={mode === 'signup' ? fieldErrors.password : undefined} errorId="password-signup-error">
                          <input
                            id="password-signup"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); markFieldEdited('password'); }}
                            {...focusProps('password')}
                            className={inputClass}
                            aria-invalid={Boolean(mode === 'signup' && fieldErrors.password)}
                            aria-describedby={mode === 'signup' && fieldErrors.password ? 'password-signup-error' : undefined}
                            required
                          />
                        </Field>
                        <RevealButton
                          shown={showPassword}
                          onToggle={() => setShowPassword(!showPassword)}
                        />
                      </div>

                      <div className="relative">
                        <Field icon={<Lock className="h-4 w-4" />} index={4} error={fieldErrors.confirm} errorId="signup-confirm-error">
                          <input
                            id="signup-confirm"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm"
                            aria-label="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); markFieldEdited('confirm'); }}
                            {...focusProps('confirm')}
                            className={inputClass}
                            aria-invalid={Boolean(fieldErrors.confirm)}
                            aria-describedby={fieldErrors.confirm ? 'signup-confirm-error' : undefined}
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
                        <ArrowRight className="h-3.5 w-3.5" />
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
