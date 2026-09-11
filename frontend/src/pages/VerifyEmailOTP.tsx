import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Mail, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const getErrorMessage = (error: any) => error.response?.data?.message || 'We could not verify that code. Please try again.';

export const VerifyEmailOTP: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((current) => current.map((item, position) => position === index ? digit : item));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!pasted.length) return;
    setDigits((current) => current.map((_, index) => pasted[index] || ''));
    inputs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const otp = digits.join('');
    if (!email.trim()) {
      setError('Enter the email address used for registration.');
      return;
    }
    if (otp.length !== 6) {
      setError('Enter all 6 digits of the verification code.');
      return;
    }
    setVerifying(true);
    try {
      await api.verifyOtp({ email: email.trim(), otp });
      setVerified(true);
      window.setTimeout(() => navigate('/login?verified=true'), 1200);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter the email address used for registration.');
      return;
    }
    setResending(true);
    try {
      const response = await api.resendOtp(email.trim());
      setNotice(response.message);
      setDigits(['', '', '', '', '', '']);
      setSecondsLeft(60);
      inputs.current[0]?.focus();
    } catch (requestError: any) {
      setError(getErrorMessage(requestError));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 p-4 font-sans">
      <div className="absolute right-[-10%] top-[-20%] h-[70%] w-[70%] rounded-full bg-indigo-300/30 blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] h-[60%] w-[60%] rounded-full bg-cyan-300/30 blur-[120px]" />
      <div className="glass-panel relative z-10 w-full max-w-md space-y-7 rounded-[2rem] p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg">
            <img src="/opspilot-logo.png" alt="OpsPilot Logo" className="h-full w-full scale-[1.2] object-cover" />
          </div>
          {verified ? <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" /> : <Mail className="mx-auto h-9 w-9 text-indigo-500" />}
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-800">{verified ? 'Email verified' : 'Verify your email'}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">{verified ? 'Your account is ready. Redirecting you to sign in.' : 'We sent a 6-digit verification code to your email address.'}</p>
        </div>

        {error && <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-600" role="alert"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm font-medium text-emerald-700" role="status">{notice}</div>}

        {!verified && (
          <form onSubmit={handleVerify} className="space-y-6">
            <label className="block space-y-2">
              <span className="pl-1 text-xs font-bold uppercase tracking-widest text-slate-500">Email address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/60 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </label>
            <div className="space-y-2">
              <span className="block pl-1 text-xs font-bold uppercase tracking-widest text-slate-500">Verification code</span>
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { inputs.current[index] = element; }}
                    value={digit}
                    onChange={(event) => updateDigit(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Verification digit ${index + 1}`}
                    className="h-14 w-12 rounded-xl border border-slate-200 bg-white/70 text-center text-xl font-black text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                ))}
              </div>
            </div>
            <button type="submit" disabled={verifying} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50">
              <span>{verifying ? 'Verifying...' : 'Verify email'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {!verified && (
          <div className="space-y-3 text-center">
            <button type="button" onClick={() => void handleResend()} disabled={resending || secondsLeft > 0} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:text-slate-400">
              {resending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              {secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : 'You can request a new code'}
            </p>
          </div>
        )}
        <div className="text-center text-sm font-medium text-slate-500"><Link to="/login" className="font-bold text-indigo-600 hover:underline">Back to sign in</Link></div>
      </div>
    </div>
  );
};
