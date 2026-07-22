import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

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
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center p-4 selection:bg-[#38BDF8]/30 selection:text-[#38BDF8]">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="text-xs font-medium text-[#CBD5E1] mt-1">
            Sign in to access your unified internal developer platform
          </p>
        </div>

        <Card className="border-[#374151]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <Input
              label="Email address"
              type="email"
              placeholder="alex.mercer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              icon={<Mail className="w-4 h-4 text-[#94A3B8]" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              icon={<Lock className="w-4 h-4 text-[#94A3B8]" />}
            />

            <div className="flex items-center justify-between text-xs font-medium">
              <label className="flex items-center gap-2 cursor-pointer text-[#CBD5E1] hover:text-[#F9FAFB]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#1E293B] border-[#475569] text-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] focus:ring-offset-0 cursor-pointer"
                />
                Remember me
              </label>
              <a
                href="#forgot"
                onClick={(e) => e.preventDefault()}
                className="text-[#38BDF8] hover:underline font-semibold"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#374151] text-center text-xs text-[#CBD5E1]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#38BDF8] font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </Card>

        <p className="text-center text-xs text-[#94A3B8]">
          OpsPilot IDP &copy; {new Date().getFullYear()} • AWS, K8s, Jenkins & Docker Unified
        </p>
      </div>
    </div>
  );
};
