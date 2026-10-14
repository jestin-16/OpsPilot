import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bot,
  Box,
  Check,
  Cloud,
  Cpu,
  GitBranch,
  Menu,
  MessageSquare,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { HeroConsole } from '../components/HeroConsole';
import { AuthMascot } from '../components/AuthMascot';
import '../styles/landing.css';

const NAV = [
  { label: 'Platform', href: '#platform' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Security', href: '#security' },
  { label: 'Integrations', href: '#integrations' },
];

const HEADLINE = [['Automate', 'Anything'], ["You've", 'Ever', 'Managed.'], ['In', 'Seconds']];

const INTEGRATIONS = [
  { icon: GitBranch, label: 'GitHub' },
  { icon: Cloud, label: 'AWS Cloud' },
  { icon: Box, label: 'Docker' },
  { icon: Cpu, label: 'Kubernetes' },
  { icon: Activity, label: 'Prometheus' },
  { icon: MessageSquare, label: 'Webhooks' },
];

const METRICS = [
  ['6+', 'Native integrations'],
  ['24/7', 'Signal awareness'],
  ['100%', 'Owner context'],
  ['< 1s', 'Live log streaming'],
];

const previewRow = 'rounded-xl border border-gray-100 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.02)]';

const CAPABILITIES = [
  {
    icon: Radar,
    eyebrow: 'Observe',
    title: 'One operational picture',
    description: 'Bring deployments, logs, uptime checks, containers, and cluster health into one shared view.',
    preview: (
      <>
        <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-400">
          <span>LIVE SIGNALS</span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            ALL HEALTHY
          </span>
        </div>
        <div className="space-y-2">
          {[
            ['payment-service', '18ms · 0 err'],
            ['core-engine', '100% up'],
          ].map(([service, stat]) => (
            <div key={service} className={`${previewRow} flex items-center justify-between px-3 py-2 transition-transform duration-300 group-hover:translate-x-1`}>
              <span className="flex items-center gap-2 text-xs font-bold text-black">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {service}
              </span>
              <span className="text-[11px] font-medium text-gray-400">{stat}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    icon: Bot,
    eyebrow: 'Understand',
    title: 'AI-assisted diagnosis',
    description: 'Let OpsPilot correlate changes, signals, and ownership so the next action is immediately clear.',
    preview: (
      <>
        <div className="mb-2.5 flex items-center justify-between gap-2 text-[10px] font-bold tracking-wider">
          <span className="flex items-center gap-1.5 text-black">
            <Sparkles className="h-3 w-3 text-red-500 transition-transform duration-500 group-hover:rotate-[24deg] group-hover:scale-125" />
            AI CORRELATION
          </span>
          <span className="rounded-full bg-black px-2 py-0.5 text-[9px] text-white">98% MATCH</span>
        </div>
        <div className={`${previewRow} p-3 text-[11px] leading-relaxed text-gray-600`}>
          <span className="font-bold text-black">Root cause:</span> Memory pressure traced to commit{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-900">#b7e09c</code>. No user impact.
        </div>
      </>
    ),
  },
  {
    icon: Rocket,
    eyebrow: 'Deliver',
    title: 'Confident releases',
    description: 'Move from repository to runtime with visible deployment history and accountable control.',
    preview: (
      <>
        <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-400">
          <span>RELEASE PIPELINE</span>
          <span className="text-black">PROD v2.8.4</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['Build', '0.5s ✓'],
            ['Tests', '18/18 ✓'],
          ].map(([stage, result], i) => (
            <div
              key={stage}
              style={{ transitionDelay: `${i * 60}ms` }}
              className={`${previewRow} p-2.5 text-center transition-transform duration-300 group-hover:-translate-y-1`}
            >
              <span className="block text-[9px] font-bold uppercase text-gray-400">{stage}</span>
              <span className="text-xs font-bold text-black">{result}</span>
            </div>
          ))}
          <div className="rounded-xl bg-black p-2.5 text-center text-white transition-transform delay-[120ms] duration-300 group-hover:-translate-y-1">
            <span className="block text-[9px] font-bold uppercase text-gray-400">Deploy</span>
            <span className="flex items-center justify-center gap-1 text-xs font-bold">
              Live <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            </span>
          </div>
        </div>
      </>
    ),
  },
];

const WORKFLOW = [
  ['01', 'Connect the work', 'Register a repository, assign ownership, and bring your service signals into the unified workspace.'],
  ['02', 'Ship with context', 'Trigger deployments with the project, environment, version, and operator transparently attached.'],
  ['03', 'Resolve the right thing', 'Use AI summaries and live telemetry to focus the team on high-leverage remediations.'],
];

const indexStyle = (i: number) => ({ '--i': i }) as React.CSSProperties;

/** Calls back once when the element first scrolls into view. */
function useInView<T extends Element>(onEnter?: () => void) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const onEnterRef = useRef(onEnter);
  useEffect(() => {
    onEnterRef.current = onEnter;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        onEnterRef.current?.();
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}

const Reveal: React.FC<{
  index?: number;
  className?: string;
  onReveal?: () => void;
  children: React.ReactNode;
}> = ({ index = 0, className = '', onReveal, children }) => {
  const [ref, inView] = useInView<HTMLDivElement>(onReveal);
  return (
    <div ref={ref} data-reveal style={indexStyle(index)} className={`${className} ${inView ? 'is-revealed' : ''}`}>
      {children}
    </div>
  );
};

/** Counts the number inside a label like "100%" or "< 1s" up from zero once visible. */
const CountUp: React.FC<{ value: string }> = ({ value }) => {
  const match = /^(\D*)(\d+)(.*)$/.exec(value);
  const hasNumber = match !== null;
  const target = match ? Number(match[2]) : 0;
  const [shown, setShown] = useState(0);
  const [ref, inView] = useInView<HTMLSpanElement>();

  useEffect(() => {
    if (!inView || !hasNumber) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1300, 1);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, hasNumber, target]);

  if (!match) return <span>{value}</span>;
  return (
    <span ref={ref} className="tabular-nums">
      {match[1]}
      {shown}
      {match[3]}
    </span>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; dot?: boolean }> = ({ children, dot }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition-all duration-300 hover:border-black/20">
    {dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
    {children}
  </div>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mascotHop, setMascotHop] = useState(0);
  const [ctaHover, setCtaHover] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  let wordIndex = 0;

  return (
    <div className="landing-root min-h-screen overflow-x-hidden bg-[#FAFAFA] font-sans text-black selection:bg-black selection:text-white antialiased">
      {/* Floating Modern Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b px-6 backdrop-blur-xl transition-all duration-300 sm:px-10 lg:px-16 ${
          scrolled
            ? 'h-16 border-gray-200/80 bg-white/85 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]'
            : 'h-20 border-transparent bg-white/60'
        }`}
      >
        <button type="button" onClick={() => go('/')} className="group flex items-center gap-3 cursor-pointer">
          <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-black shadow-sm transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">
            <div className="absolute inset-0 translate-x-4 -skew-x-12 bg-red-500 transition-transform duration-300 group-hover:translate-x-3"></div>
            <span className="relative z-10 text-base font-bold leading-none text-white">O</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-black">OpsPilot</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-black"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go('/login')}
            className="hidden px-4 py-2 text-sm font-semibold text-gray-700 transition hover:text-black sm:block cursor-pointer"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => go('/signup')}
            className="hidden rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md active:translate-y-0 sm:block cursor-pointer"
          >
            Get Started Free
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-gray-200 bg-white p-2 text-black md:hidden cursor-pointer"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-x-4 top-20 z-50 rounded-3xl border border-gray-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl animate-fade-in-up md:hidden">
          <div className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 transition hover:bg-gray-50 hover:text-black"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => go('/signup')}
                className="w-full rounded-full bg-black py-3.5 text-center text-sm font-bold text-white shadow-md"
              >
                Get Started Free
              </button>
              <button
                type="button"
                onClick={() => go('/login')}
                className="mt-2 w-full rounded-full border border-gray-200 py-3 text-center text-sm font-bold text-black"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative isolate flex flex-col items-center overflow-hidden px-6 pt-32 pb-16 sm:pt-40 sm:pb-24 lg:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-pattern" />
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-start justify-center pt-40">
          <div className="h-[520px] w-[820px] rounded-full bg-gradient-to-tr from-red-100/50 via-gray-100/40 to-transparent blur-3xl animate-pulse-slow" />
        </div>

        <div className="z-10 flex w-full max-w-5xl flex-col items-center text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/90 px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            Introducing OpsPilot 2.0<span className="hidden sm:inline"> · The Autonomous Ops Platform</span>
          </div>

          <h1 className="mt-7 text-[2.75rem] font-black leading-[1.02] tracking-tight text-black sm:text-6xl md:text-7xl lg:text-[5rem]">
            {HEADLINE.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {lineIndex > 0 && (
                  <>
                    {' '}
                    <br className="hidden sm:block" />
                  </>
                )}
                {line.map((word, i) => (
                  <React.Fragment key={word}>
                    {i > 0 && ' '}
                    <span className="landing-word" style={indexStyle(wordIndex++)}>
                      {word}
                    </span>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
            <span className="landing-dot text-red-500" style={indexStyle(wordIndex)}>.</span>
          </h1>

          <p className="animate-fade-in-up [animation-delay:500ms] mt-7 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
            The intelligent operational workspace that brings all your deployments, infrastructure, and workflows into
            one unified, AI-driven command center.
          </p>

          <div className="animate-fade-in-up [animation-delay:600ms] mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => go('/signup')}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-black px-8 text-base font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-gray-800 hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.25)] active:translate-y-0 sm:w-auto cursor-pointer"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
            <button
              type="button"
              onClick={() => go('/login')}
              className="flex h-14 w-full items-center justify-center rounded-full border border-gray-200 bg-white px-8 text-base font-bold text-black shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-black hover:shadow-md active:translate-y-0 sm:w-auto cursor-pointer"
            >
              View Live Demo
            </button>
          </div>

          <div className="animate-fade-in-up [animation-delay:750ms] mt-14 w-full max-w-2xl">
            <HeroConsole onSubmit={() => go('/signup')} />
          </div>
        </div>

        {/* Integration marquee */}
        <div id="integrations" className="animate-fade-in-up [animation-delay:900ms] mt-20 w-full max-w-4xl">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Engineered to integrate seamlessly with your stack
          </p>
          <div className="landing-marquee overflow-hidden">
            <div className="landing-marquee-track">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  aria-hidden={copy === 1}
                  className={`flex shrink-0 items-center gap-12 pr-12 text-gray-500 ${copy === 1 ? 'landing-marquee-dup' : ''}`}
                >
                  {INTEGRATIONS.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="group flex items-center gap-2.5 whitespace-nowrap text-sm font-bold tracking-tight transition-all duration-300 hover:-translate-y-0.5 hover:text-black"
                    >
                      <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110" />
                      {label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* METRICS COUNTER BAR */}
      <div className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
          {METRICS.map(([value, label], i) => (
            <Reveal key={label} index={i} className="group px-6 py-9 text-center transition-colors duration-300 hover:bg-gray-50/70">
              <p className="text-3xl font-black tracking-tight text-black transition-transform duration-300 group-hover:scale-110 sm:text-4xl">
                <CountUp value={value} />
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors group-hover:text-gray-600">{label}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <main className="bg-[#FAFAFA] text-black">
        {/* THE OPSPILOT OPERATING MODEL */}
        <section id="platform" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
          <Reveal className="max-w-3xl">
            <Eyebrow dot>The OpsPilot Operating Model</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-black sm:text-5xl lg:text-6xl">
              A developer platform that <br className="hidden sm:inline" />
              <span className="text-gray-400">thinks in systems.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
              Keep the delivery workflow and the runtime reality seamlessly connected. Every signal has a project, every
              project has an owner, and every incident has an actionable starting point.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, eyebrow, title, description, preview }, i) => (
              <Reveal key={title} index={i + 1} className="h-full">
                <article className="group flex h-full flex-col rounded-3xl border border-gray-200/80 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out hover:-translate-y-2 hover:border-gray-300 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="landing-card-icon flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-black shadow-xs group-hover:bg-black group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 transition-colors group-hover:text-red-500">
                      {eyebrow}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-tight text-black">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-gray-500">{description}</p>
                  <div className="mt-auto pt-6">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-xs transition-colors group-hover:bg-gray-50">
                      {preview}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="border-t border-gray-100 bg-white py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-12">
            <Reveal>
              <Eyebrow>A Shorter Path To Action</Eyebrow>
              <h2 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight text-black sm:text-5xl">
                From repository to <br className="hidden sm:inline" />
                reliable runtime<span className="text-red-500">.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-gray-500">
                Make delivery visible to everyone who depends on it. OpsPilot turns handoffs into a collaborative workflow
                the whole team can inspect in real-time.
              </p>
              <button
                type="button"
                onClick={() => go('/signup')}
                className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-lg cursor-pointer"
              >
                Create your workspace
                <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </Reveal>

            <div className="relative pl-9">
              {/* A timeline rail beside the steps, with a signal travelling down it */}
              <div className="pointer-events-none absolute top-12 bottom-12 left-[11px] w-0.5 rounded-full bg-gray-200" aria-hidden>
                <span className="landing-rail-dot absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_0_5px_rgba(239,68,68,0.18)]" />
              </div>
              <div className="grid gap-4">
                {WORKFLOW.map(([number, title, description], i) => (
                  <Reveal key={number} index={i + 1}>
                    <div className="group relative flex gap-5 rounded-2xl border border-gray-100 bg-[#FAFAFA] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:bg-white hover:shadow-lg">
                      <span
                        aria-hidden
                        className="absolute top-1/2 -left-[31px] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-[3px] border-white bg-gray-300 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:scale-125 group-hover:bg-red-500"
                      />
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-sm font-black text-white shadow-2xs transition-all duration-300 group-hover:rotate-[-6deg] group-hover:scale-110 group-hover:bg-red-500">
                        {number}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-black">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CONTROL & SECURITY SECTION */}
        <section id="security" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
          <Reveal>
            <div className="grid gap-12 rounded-3xl border border-gray-200/80 bg-white p-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.06)] sm:p-12 lg:grid-cols-[1.05fr_.95fr] lg:p-16">
              <div>
                <Eyebrow>
                  <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
                  Control without friction
                </Eyebrow>
                <h2 className="mt-5 text-3xl font-black leading-[1.1] tracking-tight text-black sm:text-4xl lg:text-5xl">
                  Built for accountable operations<span className="text-red-500">.</span>
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-500">
                  Give engineers useful autonomy while keeping access, ownership, and deployment history visible. The
                  platform scales the team’s judgment instead of hiding it.
                </p>
                <div className="mt-8 grid grid-cols-1 gap-3 text-sm font-semibold text-black sm:grid-cols-2">
                  {['Role-aware access', 'Audit-ready changes', 'Project ownership', 'Cloud-ready runtime'].map((item) => (
                    <span key={item} className="group flex items-center gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white transition-all duration-300 group-hover:scale-110 group-hover:bg-red-500">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid content-center gap-3.5">
                <ControlCard icon={GitBranch} title="Delivery context" text="Commits, versions, environments, and operators stay attached to the release." />
                <ControlCard icon={Cloud} title="Infrastructure visibility" text="Monitor Docker, Kubernetes, cloud targets, and service health from one place." />
                <ControlCard icon={ShieldCheck} title="Protected by design" text="JWT sessions, role checks, and ownership rules support safer daily operations." />
              </div>
            </div>
          </Reveal>
        </section>

        {/* CTA BANNER, with the OpsPilot mascot peeking over the edge */}
        <section className="px-6 pb-24 pt-8 sm:px-8 lg:px-12 lg:pb-32">
          <Reveal onReveal={() => setMascotHop((n) => n + 1)} className="relative mx-auto max-w-7xl">
            <AuthMascot gaze={null} cover="none" mood={ctaHover ? 'happy' : 'idle'} hopKey={mascotHop} />
            <div className="relative z-10 overflow-hidden rounded-3xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/80 px-8 py-16 text-center shadow-sm transition-shadow duration-500 hover:shadow-md sm:px-16 sm:py-20">
              <div className="landing-cta-grid pointer-events-none absolute inset-0" aria-hidden />
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-red-200/30 blur-3xl" aria-hidden />
              <div className="relative">
                <Eyebrow>Make the next incident smaller</Eyebrow>
                <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                  Give your team a better operational starting point<span className="text-red-500">.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500">
                  Connect your first project and see what changes when delivery, infrastructure, and intelligence share
                  the same workspace.
                </p>
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  onMouseEnter={() => setCtaHover(true)}
                  onMouseLeave={() => setCtaHover(false)}
                  onFocus={() => setCtaHover(true)}
                  onBlur={() => setCtaHover(false)}
                  className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-black px-8 py-4 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-gray-800 hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.25)] active:translate-y-0 cursor-pointer"
                >
                  Start with OpsPilot
                  <ArrowRight className="h-4 w-4 text-red-500 transition-transform duration-300 group-hover:translate-x-1.5" />
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Aesthetic Global-Trending Minimal White Footer */}
      <footer className="border-t border-gray-100 bg-white text-black">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 sm:pt-20 sm:pb-16 lg:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-12 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 flex flex-col justify-between md:col-span-4 lg:col-span-5">
              <div>
                <button type="button" onClick={() => go('/')} className="group flex items-center gap-3 text-left cursor-pointer">
                  <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-black shadow-sm transition-transform group-hover:scale-105">
                    <div className="absolute inset-0 translate-x-4 -skew-x-12 bg-red-500"></div>
                    <span className="relative z-10 text-base font-bold leading-none text-white">O</span>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-black">OpsPilot</span>
                </button>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
                  The intelligent operational workspace. Unifying deployments, infrastructure, and observability into one
                  command center.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50/80 px-3.5 py-1.5 text-xs font-medium text-gray-600">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span>Systems operational</span>
                </div>
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">Product</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#platform" className="text-gray-500 transition-colors duration-150 hover:text-black">Features</a></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black cursor-pointer">Deployments</button></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black cursor-pointer">Docker &amp; K8s</button></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black cursor-pointer">Observability</button></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black cursor-pointer">CI/CD Engine</button></li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-3 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">Platform</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#workflow" className="text-gray-500 transition-colors duration-150 hover:text-black">Workflows</a></li>
                <li><a href="#security" className="text-gray-500 transition-colors duration-150 hover:text-black">Security &amp; RBAC</a></li>
                <li><a href="#integrations" className="text-gray-500 transition-colors duration-150 hover:text-black">Integrations</a></li>
                <li><button type="button" onClick={() => go('/login')} className="text-gray-500 transition-colors duration-150 hover:text-black cursor-pointer">Audit Logging</button></li>
                <li><a href="https://github.com/opspilot" target="_blank" rel="noreferrer" className="text-gray-500 transition-colors duration-150 hover:text-black">Documentation</a></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-3 lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">Connect</h3>
              <p className="mt-4 text-sm text-gray-500">Ready to transform your delivery workflows?</p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  className="rounded-full bg-black px-5 py-2 text-xs font-bold text-white transition hover:bg-gray-800 hover:shadow-md cursor-pointer"
                >
                  Get Started
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-black transition hover:border-black cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-gray-400 sm:flex-row">
            <span>&copy; 2026 OpsPilot, Inc. Built for dependable delivery.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-medium text-gray-500">
              <a href="#privacy" className="transition-colors hover:text-black">Privacy Policy</a>
              <a href="#terms" className="transition-colors hover:text-black">Terms of Service</a>
              <a href="#security" className="transition-colors hover:text-black">Security</a>
              <a href="https://github.com/opspilot" target="_blank" rel="noreferrer" className="transition-colors hover:text-black">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ControlCard: React.FC<{ icon: React.ElementType; title: string; text: string }> = ({ icon: Icon, title, text }) => (
  <div className="group flex gap-4 rounded-2xl border border-gray-100 bg-[#FAFAFA] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:bg-white hover:shadow-md">
    <span className="landing-card-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white text-black shadow-2xs group-hover:bg-black group-hover:text-white">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-sm font-bold text-black">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
    </div>
  </div>
);
