import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
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

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
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
          name: email.split('@')[0] || 'Alex Mercer',
          email,
          role: 'DevOps Engineer',
        })
      );
      navigate('/home');
    }, 1000);
  };

  return (
    <div className="login-3d-root flex items-center justify-center p-4 md:p-8">
      <LoginBackground3D />

      <div className="login-3d-content w-full max-w-lg flex flex-col items-center gap-6">
        <LoginTiltPanel>
          <div className="login-tilt-depth-logo flex flex-col items-center gap-2 text-center mb-6 [transform-style:preserve-3d]">
            <Logo size="lg" />
            <p className="text-xs font-medium text-op-muted mt-1 max-w-sm">
              Sign in to access your unified internal developer platform
            </p>
          </div>

          <div className="login-tilt-depth-form relative [transform-style:preserve-3d]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <Input
                label="Email address"
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
                <label className="flex items-center gap-2 cursor-pointer text-op-muted hover:text-op-fg">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-op-input border-op-border-strong text-op-accent focus:ring-1 focus:ring-op-accent focus:ring-offset-0 cursor-pointer"
                  />
                  Remember me
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-op-accent hover:underline font-semibold"
                >
                  Forgot password?
                </a>
              </div>

              <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
                Sign in
              </Button>
            </form>

            <div className="login-tilt-depth-footer mt-6 pt-5 border-t border-op-border text-center text-xs text-op-muted [transform-style:preserve-3d]">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-op-accent font-bold hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </LoginTiltPanel>

        <p className="text-center text-xs text-op-subtle">
          OpsPilot IDP &copy; {new Date().getFullYear()} • AWS, K8s, Jenkins & Docker Unified
        </p>
      </div>
    </div>
  );
};
