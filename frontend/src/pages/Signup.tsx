import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Server,
  Code,
  Sliders,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Developer' | 'DevOps Engineer' | 'Administrator'>('DevOps Engineer');

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return { label: '', score: 0, color: 'bg-transparent' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: 'Weak', score: 33, color: 'bg-op-danger' };
    if (score <= 3) return { label: 'Medium', score: 66, color: 'bg-op-warn' };
    return { label: 'Strong', score: 100, color: 'bg-op-success' };
  }, [password]);

  const rolesConfig = [
    {
      id: 'Developer',
      title: 'Developer',
      icon: Code,
      desc: 'Source control, branch builds, staging deployments & log stream',
    },
    {
      id: 'DevOps Engineer',
      title: 'DevOps Engineer',
      icon: Server,
      desc: 'Full K8s pod management, production pipelines & AI diagnostics',
    },
    {
      id: 'Administrator',
      title: 'Administrator',
      icon: Sliders,
      desc: 'Platform governance, team RBAC, cloud keys & security audit',
    },
  ] as const;

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
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
          name: name.trim(),
          email: email.trim(),
          role,
        })
      );
      navigate('/home');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-op-bg text-op-fg flex flex-col justify-between font-sans selection:bg-op-accent/30 selection:text-op-accent relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#363d4d12_1px,transparent_1px),linear-gradient(to_bottom,#363d4d12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-4 relative z-10 flex items-center justify-between border-b border-op-border/50 backdrop-blur-md bg-op-surface/50">
        <Logo size="md" />
        <Link
          to="/login"
          className="text-xs font-bold text-op-accent hover:text-op-accent-hover transition-colors"
        >
          Already registered? Sign In &rarr;
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10 my-auto">
        <div className="bg-op-surface/95 border border-op-border-strong rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col gap-6">
          
          <div className="flex flex-col gap-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-op-accent/15 text-op-accent border border-op-accent/30 w-fit flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> OpsPilot IDP Workspace Setup
            </span>
            <h1 className="text-2xl font-extrabold text-op-fg tracking-tight mt-1">Create Your Account</h1>
            <p className="text-xs text-op-muted">
              Join your team to manage microservices, Kubernetes clusters, and deployment pipelines.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Full Name"
              type="text"
              placeholder="Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              icon={<User className="w-4 h-4 text-op-subtle" />}
            />

            <Input
              label="Work Email Address"
              type="email"
              placeholder="alex.mercer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<Mail className="w-4 h-4 text-op-subtle" />}
            />

            <div className="flex flex-col gap-1.5 text-left">
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                icon={<Lock className="w-4 h-4 text-op-subtle" />}
              />

              {password && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px] text-op-muted">
                    <span>Password strength:</span>
                    <span className="font-bold">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-op-input h-1.5 rounded-full overflow-hidden border border-op-border-strong">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              icon={<Lock className="w-4 h-4 text-op-subtle" />}
            />

            {/* Interactive Role Cards Selection */}
            <div className="flex flex-col gap-2 pt-1">
              <label className="text-xs font-semibold text-op-muted tracking-wide flex items-center justify-between">
                <span>Select Primary Platform Role (RBAC)</span>
                <ShieldCheck className="w-3.5 h-3.5 text-op-accent" />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {rolesConfig.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-op-raised border-op-accent text-op-fg shadow-md'
                          : 'bg-op-input/50 border-op-border text-op-muted hover:border-op-border-strong'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-op-accent' : 'text-op-subtle'}`} />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-op-accent" />}
                      </div>
                      <span className="text-xs font-bold">{r.title}</span>
                      <span className="text-[10px] text-op-subtle line-clamp-2 leading-tight">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="mt-3 text-xs py-3">
              Create OpsPilot Account &rarr;
            </Button>
          </form>

          <div className="pt-4 border-t border-op-border text-center text-xs text-op-muted">
            Already registered?{' '}
            <Link to="/login" className="text-op-accent font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 relative z-10 border-t border-op-border/50 text-center text-xs text-op-subtle bg-op-surface/30">
        OpsPilot IDP &copy; {new Date().getFullYear()} • Enterprise Role-Based Access Control
      </footer>
    </div>
  );
};
