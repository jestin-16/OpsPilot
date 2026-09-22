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
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-black selection:bg-black selection:text-white antialiased flex flex-col justify-between">
      {/* Floating Modern Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-gray-100/80 bg-white/80 px-6 backdrop-blur-xl sm:px-10 lg:px-16">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group flex items-center gap-3 cursor-pointer"
        >
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-black shadow-sm transition-transform duration-200 group-hover:scale-105">
            <div className="absolute inset-0 translate-x-4 -skew-x-12 bg-red-500"></div>
            <span className="relative z-10 text-base font-bold leading-none text-white">O</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-black">OpsPilot</span>
        </button>

        <Link
          to="/login"
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-black shadow-2xs transition hover:bg-gray-50 hover:border-gray-300"
        >
          Back to Sign In
        </Link>
      </header>

      {/* Subtle Ambient Radial Backlight */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="h-[520px] w-[820px] rounded-full bg-gradient-to-tr from-gray-200/50 via-gray-100/40 to-transparent blur-3xl animate-pulse-slow" />
      </div>

      {/* Main Content Area */}
      <main className="z-10 flex flex-1 items-center justify-center px-4 pt-32 pb-12 sm:px-6">
        <div className="w-full max-w-[440px] animate-fade-in-up">
          <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 p-7 sm:p-9 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(0,0,0,0.07)] backdrop-blur-2xl">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/90 px-3.5 py-1 text-[11px] font-semibold text-gray-700 shadow-2xs backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                Email Verification
              </div>

              <div className="mt-4 flex flex-col items-center">
                <div className="relative mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-md">
                  <div className="absolute inset-0 translate-x-5 -skew-x-12 bg-red-500"></div>
                  <span className="relative z-10 text-lg font-black leading-none text-white">O</span>
                </div>
                {verified ? (
                  <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-500 animate-fade-in-up" />
                ) : (
                  <Mail className="mb-2 h-10 w-10 text-black" />
                )}
                <h1 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
                  {verified ? 'Email verified!' : 'Verify your email'}
                  <span className="text-red-500">.</span>
                </h1>
                <p className="mt-1.5 text-xs text-gray-500">
                  {verified
                    ? 'Your account is confirmed. Redirecting to workspace...'
                    : 'Enter the 6-digit one-time code sent to your inbox'}
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-3.5 text-xs font-semibold text-red-700 shadow-2xs animate-fade-in-up">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span className="flex-1 leading-snug">{error}</span>
              </div>
            )}

            {notice && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-700 shadow-2xs animate-fade-in-up">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="flex-1 leading-snug">{notice}</span>
              </div>
            )}

            {!verified && (
              <form onSubmit={handleVerify} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Email address
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 transition-colors group-focus-within:text-black">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-gray-200/90 bg-gray-50/50 py-3 pl-10 pr-4 text-xs font-medium text-black placeholder-gray-400 shadow-2xs transition-all duration-200 hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block pl-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Verification code
                  </span>
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
                        className="h-13 w-11 rounded-2xl border border-gray-200/90 bg-gray-50/50 text-center text-xl font-black text-black shadow-2xs transition-all duration-200 hover:border-gray-300 focus:border-black focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="group mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.25)] active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  <span>{verifying ? 'Verifying code...' : 'Confirm Verification'}</span>
                  <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </form>
            )}

            {!verified && (
              <div className="mt-5 space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resending || secondsLeft > 0}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-black transition hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
                <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-gray-400">
                  <Clock3 className="h-3 w-3" />
                  {secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : 'You can request a new code'}
                </p>
              </div>
            )}

            <div className="mt-6 text-center text-xs font-medium text-gray-500">
              <Link to="/login" className="font-bold text-black transition-colors hover:underline">
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Footer */}
      <footer className="z-10 px-4 py-6 text-center text-xs text-gray-400">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium text-gray-400">
          <span>End-to-End Encryption</span>
          <span>·</span>
          <span>SOC 2 Type II Certified</span>
          <span>·</span>
          <span>99.99% Platform Uptime</span>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          &copy; {new Date().getFullYear()} OpsPilot Platform. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
