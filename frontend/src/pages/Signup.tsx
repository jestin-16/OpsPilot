import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
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
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="text-xs font-medium text-op-muted mt-1">
            Create an account to manage deployments, K8s, and pipelines
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Full name"
              type="text"
              placeholder="Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              icon={<User className="w-4 h-4 text-op-subtle" />}
            />

            <Input
              label="Email address"
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
                  <div className="flex justify-between items-center text-xs text-op-muted">
                    <span>Password strength:</span>
                    <span className="font-bold">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-op-input h-2 rounded-full overflow-hidden border border-op-border-strong">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              icon={<Lock className="w-4 h-4 text-op-subtle" />}
            />

            <div className="w-full flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-op-muted tracking-wide">
                Primary Role (RBAC)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-op-subtle">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  className="w-full bg-op-input text-op-fg text-sm font-medium rounded-lg border border-op-border-strong pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-op-accent/40 focus:border-op-accent cursor-pointer appearance-none"
                >
                  <option value="Developer">Developer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading} className="mt-2">
              Create account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-op-border text-center text-xs text-op-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-op-accent font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </Card>

        <p className="text-center text-xs text-op-subtle">
          OpsPilot IDP &copy; {new Date().getFullYear()} • Standardized Cloud Operations
        </p>
      </div>
    </div>
  );
};
