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
  Box,
  Cloud,
  GitBranch,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

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
    <div className="min-h-screen bg-op-bg text-op-fg flex flex-col justify-between font-sans selection:bg-op-accent/30 selection:text-op-accent relative overflow-hidden">
      {/* Ambient DevOps Background Glow Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#363d4d12_1px,transparent_1px),linear-gradient(to_bottom,#363d4d12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header Bar */}
      <header className="px-6 py-4 relative z-10 flex items-center justify-between border-b border-op-border/50 backdrop-blur-md bg-op-surface/50">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-op-raised text-op-success border border-op-success/30">
            <span className="w-2 h-2 rounded-full bg-op-success animate-pulse" />
            Control Plane Online
          </span>
          <Link
            to="/signup"
            className="text-xs font-bold text-op-accent hover:text-op-accent-hover transition-colors"
          >
            Create Account &rarr;
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: DevOps Cloud Control HUD (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 pr-0 lg:pr-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-op-accent/15 text-op-accent border border-op-accent/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI-Assisted Internal Developer Platform
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-op-fg tracking-tight leading-tight">
            Unify Your Cloud DevOps & <span className="text-transparent bg-clip-text bg-gradient-to-r from-op-accent via-teal-300 to-op-highlight">Kubernetes Operations</span>
          </h1>

          <p className="text-sm sm:text-base text-op-muted leading-relaxed max-w-2xl">
            OpsPilot orchestrates your microservices across AWS, Kubernetes, Docker, Jenkins, and Prometheus into a single intelligent workspace with real-time telemetry and AI incident response.
          </p>

          {/* Interactive Live Control HUD Preview Card */}
          <div className="bg-gradient-to-b from-op-surface/90 to-op-raised/90 border border-op-border-strong rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-op-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-op-border text-xs font-mono">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-op-accent" />
                <span className="font-bold text-op-fg">cluster-us-east.opspilot.internal</span>
              </div>
              <span className="text-op-success font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 99.98% SLA
              </span>
            </div>

            {/* Microservice Live Status Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-op-bg/80 p-3 rounded-xl border border-op-border/70 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-op-subtle flex items-center gap-1">
                  <Box className="w-3 h-3 text-op-accent" /> Docker
                </span>
                <span className="text-xs font-mono font-bold text-op-fg">42 Containers</span>
                <span className="text-[10px] text-op-success font-semibold">Active & Healthy</span>
              </div>

              <div className="bg-op-bg/80 p-3 rounded-xl border border-op-border/70 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-op-subtle flex items-center gap-1">
                  <Server className="w-3 h-3 text-op-accent" /> Kubernetes
                </span>
                <span className="text-xs font-mono font-bold text-op-fg">3 Node Pods</span>
                <span className="text-[10px] text-op-success font-semibold">Ready</span>
              </div>

              <div className="bg-op-bg/80 p-3 rounded-xl border border-op-border/70 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-op-subtle flex items-center gap-1">
                  <Activity className="w-3 h-3 text-op-highlight" /> Prometheus
                </span>
                <span className="text-xs font-mono font-bold text-op-fg">38ms Latency</span>
                <span className="text-[10px] text-op-muted font-semibold">p99 Target Met</span>
              </div>

              <div className="bg-op-bg/80 p-3 rounded-xl border border-op-border/70 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-op-subtle flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-op-highlight" /> AI Brain
                </span>
                <span className="text-xs font-mono font-bold text-op-fg">Root-Cause</span>
                <span className="text-[10px] text-op-highlight font-semibold">Phase 2 Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: DevOps Authentication Form Panel (5 cols) */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-op-surface/95 border border-op-border-strong rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col gap-6 relative">
            
            <div>
              <h2 className="text-xl font-bold text-op-fg tracking-tight">Platform Sign In</h2>
              <p className="text-xs text-op-muted mt-1">
                Access your OpsPilot internal developer workspace
              </p>
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-op-subtle uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-op-accent" /> Quick Single-Click Demo Personas:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {demoPersonas.map((persona) => (
                  <button
                    key={persona.email}
                    type="button"
                    onClick={() => handleSelectPersona(persona)}
                    className="bg-op-raised hover:bg-op-accent/20 border border-op-border hover:border-op-accent/50 p-2 rounded-xl flex flex-col items-center gap-1 text-center transition-all cursor-pointer group"
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
              <span className="bg-op-surface px-3 text-[11px] font-semibold text-op-subtle uppercase whitespace-nowrap absolute">
                or sign in with email
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

            <div className="pt-4 border-t border-op-border text-center text-xs text-op-muted">
              Don&apos;t have an OpsPilot workspace yet?{' '}
              <Link to="/signup" className="text-op-accent font-bold hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="px-6 py-4 relative z-10 border-t border-op-border/50 text-center text-xs text-op-subtle bg-op-surface/30">
        OpsPilot IDP &copy; {new Date().getFullYear()} • Cloud-Native AWS, K8s, Docker, Jenkins & Prometheus Orchestration
      </footer>
    </div>
  );
};
