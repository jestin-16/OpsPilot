import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Server,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Cloud,
  GitBranch,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { LoginBackground3D } from '../components/LoginBackground3D';
import { LoginTiltPanel } from '../components/LoginTiltPanel';
import '../styles/login-3d.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const demoPersonas = [
    {
      name: 'Alex Mercer',
      email: 'alex.mercer@opspilot.internal',
      role: 'DevOps Engineer',
      avatar: 'AM',
      desc: 'Full access to K8s, deployments & AI diagnostics',
    },
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@opspilot.internal',
      role: 'Developer',
      avatar: 'SC',
      desc: 'Repo access, staging deployments & log stream',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus.vance@opspilot.internal',
      role: 'Administrator',
      avatar: 'MV',
      desc: 'Full platform governance, RBAC & cloud API keys',
    },
  ];

  const handleSelectPersona = (persona: (typeof demoPersonas)[0]) => {
    setEmail(persona.email);
    setPassword('demoPass123!');
    setErrors({});
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('opspilot_user', JSON.stringify(persona));
      navigate('/home');
    }, 600);
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid work email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem(
        'opspilot_user',
        JSON.stringify({
          name: email.split('@')[0].replace('.', ' ') || 'Alex Mercer',
          email,
          role: 'DevOps Engineer',
        })
      );
      navigate('/home');
    }, 800);
  };

  return (
    <div className="login-3d-root bg-op-bg text-op-fg font-sans selection:bg-op-accent/30 selection:text-op-accent flex min-h-screen flex-col">
      <LoginBackground3D />

      <header className="login-3d-content flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo size="md" showBadge={false} />
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="hidden items-center gap-2 text-op-muted sm:flex">
            <span className="h-2 w-2 rounded-full bg-op-success shadow-[0_0_12px_var(--color-op-success)]" />
            All systems operational
          </span>
          <Link to="/signup" className="rounded-full border border-op-border bg-op-surface/60 px-4 py-2 text-op-fg transition hover:border-op-accent hover:text-op-accent">
            Create account
          </Link>
        </div>
      </header>

      <main className="login-3d-content mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_440px] lg:gap-20 lg:py-12">
        <section className="hidden max-w-xl lg:block">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-op-accent/30 bg-op-accent/10 px-3 py-1.5 text-xs font-bold text-op-accent">
            <Sparkles className="h-3.5 w-3.5" /> Intelligent infrastructure control
          </div>
          <h1 className="text-5xl font-black leading-[1.04] tracking-tight text-op-fg">
            Your platform,<br />
            <span className="bg-gradient-to-r from-op-accent via-teal-200 to-op-highlight bg-clip-text text-transparent">in command.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-op-muted">
            A calm, connected view of your cloud operations—deployments, observability, and AI diagnostics in one workspace.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/8 bg-op-surface/50 p-4 backdrop-blur-sm">
              <Server className="h-4 w-4 text-op-accent" />
              <p className="mt-5 text-2xl font-bold">12</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-op-subtle">Clusters online</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-op-surface/50 p-4 backdrop-blur-sm">
              <Activity className="h-4 w-4 text-op-highlight" />
              <p className="mt-5 text-2xl font-bold">99.98%</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-op-subtle">Platform health</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-op-surface/50 p-4 backdrop-blur-sm">
              <CheckCircle2 className="h-4 w-4 text-op-success" />
              <p className="mt-5 text-2xl font-bold">38ms</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-op-subtle">P99 latency</p>
            </div>
          </div>
        </section>

        <LoginTiltPanel className="mx-auto lg:mx-0">
          <div className="login-tilt-depth-form relative flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-op-accent">Welcome back</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-op-fg">Sign in to OpsPilot</h2>
                <p className="mt-1 text-sm text-op-muted">Choose a demo workspace or use your credentials.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-op-accent/30 bg-op-accent/10 text-op-accent">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            
            {/* Quick Demo Persona Switcher */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-op-subtle uppercase tracking-wider">
                Explore a demo workspace
              </span>
              <div className="grid grid-cols-3 gap-2">
                {demoPersonas.map((persona) => (
                  <button
                    key={persona.email}
                    type="button"
                    onClick={() => handleSelectPersona(persona)}
                    className="bg-op-raised/70 hover:bg-op-accent/15 border border-op-border hover:border-op-accent/50 p-2.5 rounded-xl flex flex-col items-center gap-1 text-center transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-full bg-op-input text-op-accent font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform border border-op-accent/40">
                      {persona.avatar}
                    </div>
                    <span className="text-[11px] font-bold text-op-fg line-clamp-1">{persona.name.split(' ')[0]}</span>
                    <span className="text-[9px] text-op-subtle font-medium line-clamp-1">{persona.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-op-border w-full" />
              <span className="bg-op-surface/90 px-3 text-[11px] font-semibold text-op-subtle uppercase whitespace-nowrap absolute">
                or continue with email
              </span>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Input
                label="Work Email Address"
                type="email"
                placeholder="alex.mercer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                icon={<Mail className="w-4 h-4 text-op-subtle" />}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                icon={<Lock className="w-4 h-4 text-op-subtle" />}
              />

              <div className="flex items-center justify-between text-xs font-medium">
                <label className="flex items-center gap-2 cursor-pointer text-op-muted hover:text-op-fg select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-op-input border-op-border-strong text-op-accent focus:ring-1 focus:ring-op-accent cursor-pointer"
                  />
                  Remember workspace
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link sent to your registered work email.');
                  }}
                  className="text-op-accent hover:underline font-semibold"
                >
                  Forgot password?
                </a>
              </div>

              <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="mt-2 text-xs py-3">
                Sign In to Platform &rarr;
              </Button>
            </form>

            {/* SSO Shortcut Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => alert('Connecting via GitHub OAuth...')}
                className="flex-1 py-2 px-3 rounded-lg bg-op-raised hover:bg-op-input border border-op-border text-xs text-op-muted hover:text-op-fg flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer"
              >
                <GitBranch className="w-4 h-4" /> GitHub SSO
              </button>
              <button
                type="button"
                onClick={() => alert('Connecting via AWS IAM SSO...')}
                className="flex-1 py-2 px-3 rounded-lg bg-op-raised hover:bg-op-input border border-op-border text-xs text-op-muted hover:text-op-fg flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-op-accent" /> AWS IAM
              </button>
            </div>

            <div className="login-tilt-depth-footer pt-4 border-t border-op-border text-center text-xs text-op-muted">
              Don&apos;t have an OpsPilot workspace yet?{' '}
              <Link to="/signup" className="text-op-accent font-bold hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </LoginTiltPanel>
      </main>

      <footer className="login-3d-content px-5 py-5 text-center text-xs text-op-subtle sm:px-8">
        OpsPilot IDP &copy; {new Date().getFullYear()} <span className="mx-2 text-op-border">•</span> Secure developer infrastructure
      </footer>
    </div>
  );
};
