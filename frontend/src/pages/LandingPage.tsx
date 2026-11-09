import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  ChevronDown,
  Cloud,
  Cpu,
  ExternalLink,
  GitBranch,
  GitCommit,
  Layers,
  Lock,
  Menu,
  MessageSquare,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { LandingHero } from '../components/LandingHero';
import { AuthMascot } from '../components/AuthMascot';
import { OpsPilotLogo } from '../components/OpsPilotLogo';
import '../styles/landing.css';

const NAV_ITEMS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Observability', href: '#observability' },
  { label: 'FAQ', href: '#faq' },
];

const INTEGRATIONS = [
  { icon: GitBranch, label: 'GitHub CI/CD' },
  { icon: Cloud, label: 'AWS & EKS' },
  { icon: Box, label: 'Docker Engines' },
  { icon: Cpu, label: 'Kubernetes Clusters' },
  { icon: Activity, label: 'Prometheus Telemetry' },
  { icon: Terminal, label: 'Grafana Loki' },
  { icon: MessageSquare, label: 'Slack Webhooks' },
  { icon: Server, label: 'Google Cloud GKE' },
  { icon: Layers, label: 'ArgoCD GitOps' },
];

const METRICS = [
  { value: '99.99%', label: 'Deployment Reliability' },
  { value: '< 450ms', label: 'Telemetry Ingestion' },
  { value: '100%', label: 'Commit & Owner Context' },
  { value: '10x', label: 'Faster Incident MTTR' },
];

const FAQ_ITEMS = [
  {
    question: 'How does OpsPilot connect to our existing Kubernetes clusters?',
    answer:
      'OpsPilot connects securely via standard kubeconfig credentials or in-cluster ServiceAccounts with read-only metrics and pod telemetry access. It does not require modifying existing CRDs or altering cluster networking.',
  },
  {
    question: 'Can OpsPilot be deployed entirely on-premise or in an isolated VPC?',
    answer:
      'Yes. OpsPilot is engineered as a self-contained containerized stack with Docker Compose and Helm charts. It functions flawlessly in air-gapped VPCs without requiring outbound external telemetry.',
  },
  {
    question: 'How do Docker hosts stream logs and health metrics to OpsPilot?',
    answer:
      'OpsPilot provides a lightweight, single-binary agent or Docker push ingest path that batches container stdout/stderr streams and Prometheus cgroup metrics with a per-source secret token.',
  },
  {
    question: 'Does OpsPilot replace GitHub Actions or CI runners?',
    answer:
      'OpsPilot complements your CI runners. It ingests workflow dispatch webhooks, maps artifacts and commit metadata to target cluster environments, and provides continuous runtime observability.',
  },
];

/** Scroll reveal hook using IntersectionObserver */
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
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      onEnterRef.current?.();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        onEnterRef.current?.();
        observer.disconnect();
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
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
  const style = { '--i': index } as React.CSSProperties;
  return (
    <div ref={ref} data-reveal style={style} className={`${className} ${inView ? 'is-revealed' : ''}`}>
      {children}
    </div>
  );
};

/** Number count up animation */
const CountUp: React.FC<{ value: string }> = ({ value }) => {
  const match = /^(\D*)(\d+)(\D*)$/.exec(value);
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
    const duration = 900;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Apple-style smooth cubic out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(target * easeOut));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, hasNumber, target]);

  if (!match) return <span>{value}</span>;
  return (
    <span ref={ref} className="font-tech-mono tabular-nums">
      {match[1]}{shown}{match[3]}
    </span>
  );
};

/** Interactive Spotlight Card with cursor tracking */
const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${className}`}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mascotHop, setMascotHop] = useState(0);
  const [ctaHover, setCtaHover] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const navRef = useRef<HTMLElement>(null);

  // Monitor scroll for nav elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div
      className="landing-root min-h-screen selection:bg-neutral-900 selection:text-white"
    >
      {/* =========================================================================
          SITE NAVIGATION
         ========================================================================= */}
      <header ref={navRef} className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="landing-nav-inner">
          {/* Logo brand */}
          <button
            type="button"
            onClick={() => go('/')}
            className="flex items-center group cursor-pointer border-0 bg-transparent p-0"
            aria-label="OpsPilot Home"
          >
            <OpsPilotLogo size={36} showWordmark={true} variant="forest" />
          </button>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-9" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[0.92rem] font-medium text-[#171918] transition-colors duration-150 hover:text-[#183B32] flex items-center"
              >
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          {/* Nav actions */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => go('/login')}
              className="hidden sm:inline-flex text-[0.92rem] font-medium text-[#171918] hover:text-[#183B32] px-2 py-1 transition-colors cursor-pointer bg-transparent border-0"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => go('/dashboard')}
              className="inline-flex items-center gap-2 rounded-full bg-[#183B32] hover:bg-[#122C25] px-5 py-2.5 text-[0.88rem] font-medium text-white shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <span>Launch Console</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8EAE7] text-[#171918]"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden absolute top-[4.5rem] inset-x-4 bg-white/95 backdrop-blur-xl border border-neutral-200/80 rounded-2xl p-4 shadow-xl flex flex-col gap-2 z-50">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="font-tech-mono text-sm py-2 px-3 text-neutral-800 hover:bg-neutral-100 rounded-lg"
              >
                {item.label}
              </a>
            ))}
            <div className="h-px bg-neutral-100 my-1" />
            <button
              type="button"
              onClick={() => go('/dashboard')}
              className="btn-primary-glow w-full justify-center"
            >
              Launch Console
            </button>
            <button
              type="button"
              onClick={() => go('/login')}
              className="btn-secondary-frosted w-full justify-center"
            >
              Sign In
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          HERO SECTION
         ========================================================================= */}
      <LandingHero />

      {/* =========================================================================
          KEY OPERATIONAL METRICS RIBBON
         ========================================================================= */}
      <section className="border-y border-neutral-200/80 bg-white py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100">
            {METRICS.map(({ value, label }, i) => (
              <Reveal key={label} index={i} className="pt-4 lg:pt-0 lg:px-6 text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-neutral-950 font-tech-mono">
                  <CountUp value={value} />
                </p>
                <p className="mt-2 font-tech-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          NATIVE INTEGRATIONS CONTINUOUS MARQUEE
         ========================================================================= */}
      <section className="py-12 bg-white border-b border-neutral-200/80">
        <div className="mx-auto max-w-7xl px-5 mb-6 text-center">
          <p className="font-tech-mono text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
            Works out of the box with your production stack
          </p>
        </div>
        <div className="landing-marquee">
          <div className="landing-marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-12 pr-12">
                {INTEGRATIONS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 font-tech-mono text-xs font-semibold text-neutral-700 bg-white border border-neutral-200/80 rounded-xl px-4 py-2.5 shadow-2xs hover:border-neutral-400 hover:text-neutral-950 transition-all cursor-default"
                  >
                    <Icon className="h-4 w-4 text-neutral-500" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CAPABILITY BENTO GRID (MINIMALIST & AESTHETIC)
         ========================================================================= */}
      <section id="platform" className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <Reveal className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 font-tech-mono text-xs font-semibold text-neutral-700 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-neutral-500" />
              Core Superpowers
            </div>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950">
              An internal platform <br />
              <span className="text-neutral-500 font-normal">engineered for runtime reality.</span>
            </h2>
            <p className="mt-4 text-base text-neutral-600 leading-relaxed">
              Every deployment has a project. Every project has an accountable owner. Every anomaly traces directly to the commit, pipeline stage, or container that produced it.
            </p>
          </Reveal>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Wide (2 columns) */}
            <SpotlightCard className="md:col-span-2 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <span className="font-tech-mono text-xs font-bold text-neutral-400">01 / TRACEABILITY</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-950">
                  Full-Lineage Deployment Pipeline
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-lg">
                  Every rollout records repository SHAs, author identity, Docker build digests, and test coverage before rolling into staging or production.
                </p>
              </div>

              {/* Inset mini preview */}
              <div className="mt-8 p-4 rounded-xl border border-neutral-200/90 bg-white font-tech-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-[0.7rem]">
                  <span>PIPELINE #8491</span>
                  <span className="text-emerald-600 font-semibold">PASSED (28.4s)</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-800 font-medium">
                  <GitCommit className="h-3.5 w-3.5 text-neutral-500" />
                  <span>main @ 8f3a2c1 · jestin: "feat(checkout): zero downtime migration"</span>
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Card 2: Cluster Topology */}
            <SpotlightCard className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <span className="font-tech-mono text-xs font-bold text-neutral-400">02 / RUNTIME</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-950">
                  Cluster &amp; Pod Health
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Real-time node topology, cgroup memory limits, CPU pressure, and restart backoff alerts.
                </p>
              </div>

              <div className="mt-8 p-4 rounded-xl border border-neutral-200/90 bg-white font-tech-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center text-[0.7rem]">
                  <span className="text-neutral-500">2 NODES · 8 PODS</span>
                  <span className="text-emerald-600 font-semibold">100% HEALTHY</span>
                </div>
                <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[82%]" />
                </div>
              </div>
            </SpotlightCard>

            {/* Bento Card 3: Sub-Second Telemetry */}
            <SpotlightCard className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <span className="font-tech-mono text-xs font-bold text-neutral-400">03 / LOGS</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-950">
                  Sub-Second Loki Logs
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                  Instant real-time log tailing across all container pods with instant regex query filtering.
                </p>
              </div>

              <div className="mt-8 p-3 rounded-xl border border-neutral-200/90 bg-white text-neutral-900 font-tech-mono text-[0.68rem] leading-tight space-y-1">
                <div>&gt; tail -f /var/log/pods/*.log</div>
                <div className="text-neutral-600">200 OK GET /api/v1/health 4ms</div>
                <div className="text-emerald-700">● Live log streaming connected</div>
              </div>
            </SpotlightCard>

            {/* Bento Card 4: Wide (2 columns) */}
            <SpotlightCard className="md:col-span-2 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="font-tech-mono text-xs font-bold text-neutral-400">04 / GOVERNANCE</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-950">
                  Zero-Trust Access &amp; Audit Trail
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-lg">
                  Platform RBAC with verified JWT signatures. Every environment secret rotation, deployment rollback, or config mutation is securely preserved.
                </p>
              </div>

              <div className="mt-8 p-4 rounded-xl border border-neutral-200/90 bg-white font-tech-mono text-xs flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-neutral-600" />
                  <span className="text-neutral-800">RBAC Verified: ADMIN · OPERATOR · VIEWER</span>
                </div>
                <span className="text-emerald-600 font-semibold text-[0.7rem] bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                  AUDIT LOG IMMUTABLE
                </span>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* =========================================================================
          OPERATIONAL ARCHITECTURE FLOW ("HOW IT WORKS")
         ========================================================================= */}
      <section id="architecture" className="py-24 sm:py-32 bg-white border-y border-neutral-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 font-tech-mono text-xs font-semibold text-neutral-700">
                Continuous Flow
              </div>
              <h2 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 leading-[1.1]">
                Unified architecture <br />
                <span className="text-neutral-500 font-normal">from repository to cluster.</span>
              </h2>
              <p className="mt-6 text-base text-neutral-600 leading-relaxed">
                Traditional setups require 5 tabs: GitHub for PRs, Jenkins or CircleCI for builds, Lens or kubectl for pods, Datadog or Loki for logs, and PagerDuty for alerts. OpsPilot brings all 5 into one unified plane.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  className="btn-primary-glow"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="btn-secondary-frosted"
                >
                  Sign In
                </button>
              </div>
            </Reveal>

            {/* Step rail list */}
            <div className="relative pl-8">
              {/* Vertical connecting rail with animated pulse */}
              <div className="absolute top-6 bottom-6 left-3 w-0.5 bg-neutral-200 rounded-full" aria-hidden="true">
                <span className="arch-rail-dot left-1/2 -translate-x-1/2" />
              </div>

              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Connect Repositories & Services',
                    desc: 'Register GitHub repositories, configure microservice owners, and attach environment configuration directly.',
                  },
                  {
                    step: '02',
                    title: 'Trace Multi-Stage Deployments',
                    desc: 'Build images with Docker digests, run automated verification suites, and track commit authors automatically.',
                  },
                  {
                    step: '03',
                    title: 'Zero-Downtime Rollout to Kubernetes',
                    desc: 'Shift traffic with canary engines, verify pod liveness checks, and safeguard against service degradation.',
                  },
                  {
                    step: '04',
                    title: 'Sub-Second Telemetry & Incident Audit',
                    desc: 'Trace unexpected error spikes directly back to the commit and pipeline that caused them in under 2 clicks.',
                  },
                ].map(({ step, title, desc }, i) => (
                  <Reveal key={step} index={i + 1}>
                    <div className="relative group p-6 rounded-2xl border border-neutral-200/90 bg-white hover:border-neutral-400 transition-all duration-200 shadow-2xs">
                      <span className="absolute -left-[27px] top-7 h-3 w-3 rounded-full border-2 border-white bg-neutral-900 group-hover:scale-125 transition-transform" />
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="font-tech-mono text-xs font-black text-neutral-400">
                          {step}
                        </span>
                        <h3 className="text-base font-bold text-neutral-900">{title}</h3>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed pl-7">{desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE FAQ ACCORDION
         ========================================================================= */}
      <section id="faq" className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 font-tech-mono text-xs font-semibold text-neutral-700 shadow-2xs">
              Answers &amp; Technical Details
            </div>
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950">
              Frequently Asked Questions
            </h2>
          </Reveal>

          <div className="space-y-4">
            {FAQ_ITEMS.map(({ question, answer }, idx) => {
              const isOpen = openFaq === idx;
              return (
                <Reveal key={idx} index={idx}>
                  <div className="faq-accordion-item">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-tech-mono text-sm sm:text-base font-bold text-neutral-900 hover:text-neutral-700 transition cursor-pointer"
                    >
                      <span>{question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 text-neutral-500 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div className={`faq-accordion-content ${isOpen ? 'is-open' : ''}`}>
                      <div className="overflow-hidden px-5 pb-5 text-sm leading-relaxed text-neutral-600 font-sans border-t border-neutral-100 pt-3">
                        {answer}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CTA BANNER WITH OPSPILOT MASCOT
         ========================================================================= */}
      <section className="py-20 sm:py-28 bg-white border-t border-neutral-200/80">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <Reveal onReveal={() => setMascotHop((n) => n + 1)} className="relative">
            {/* Interactive mascot with cursor tracking and hover mood */}
            <AuthMascot gaze={null} cover="none" mood={ctaHover ? 'happy' : 'idle'} hopKey={mascotHop} />

            <div className="relative z-10 rounded-3xl border border-neutral-200/90 bg-white p-8 sm:p-14 text-center text-neutral-950 shadow-sm overflow-hidden">
              <div className="relative max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 font-tech-mono text-xs font-semibold text-neutral-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Free 14-Day Full Access
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                  Take command of your developer platform today.
                </h2>

                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
                  Connect your first GitHub repository and discover what happens when deployments, clusters, and logs share one unified command plane.
                </p>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => go('/signup')}
                    onMouseEnter={() => setCtaHover(true)}
                    onMouseLeave={() => setCtaHover(false)}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 font-tech-mono text-xs font-bold text-white hover:bg-neutral-800 transition-all transform hover:-translate-y-0.5 shadow-md cursor-pointer"
                  >
                    <span>Create Free Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go('/login')}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3.5 font-tech-mono text-xs font-bold text-neutral-900 hover:bg-neutral-50 transition cursor-pointer"
                  >
                    <span>Sign In</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================================================================
          MINIMALIST LUXURY FOOTER
         ========================================================================= */}
      <footer className="border-t border-neutral-200/80 bg-white py-16 text-neutral-600 font-tech-mono text-xs">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Brand Col */}
            <div className="col-span-2 md:col-span-4 space-y-4">
              <div className="flex items-center gap-2">
                <OpsPilotLogo size={28} showWordmark={true} />
              </div>
              <p className="text-neutral-500 text-xs font-sans max-w-xs leading-relaxed">
                The internal developer platform engineered for high-velocity teams. Connecting deployments, Kubernetes runtimes, and live telemetry.
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 font-tech-mono text-[0.68rem] font-semibold text-neutral-700 shadow-2xs">
                <span className="pulse-beacon h-2 w-2 text-emerald-500">
                  <span className="pulse-beacon-ping" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>ALL SYSTEMS OPERATIONAL</span>
              </div>
            </div>

            {/* Col 1 */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <p className="font-bold uppercase tracking-wider text-neutral-900 text-[0.7rem]">Platform</p>
              <ul className="space-y-2 text-neutral-600">
                <li><a href="#platform" className="hover:text-neutral-950 transition-colors">Capabilities</a></li>
                <li><a href="#architecture" className="hover:text-neutral-950 transition-colors">Architecture</a></li>
                <li><a href="#faq" className="hover:text-neutral-950 transition-colors">FAQ</a></li>
                <li><button type="button" onClick={() => go('/dashboard')} className="hover:text-neutral-950 transition-colors cursor-pointer">Console</button></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div className="col-span-1 md:col-span-3 space-y-3">
              <p className="font-bold uppercase tracking-wider text-neutral-900 text-[0.7rem]">Observability</p>
              <ul className="space-y-2 text-neutral-600">
                <li><span className="text-neutral-500">Grafana Loki Tail</span></li>
                <li><span className="text-neutral-500">Prometheus Scrapes</span></li>
                <li><span className="text-neutral-500">Docker Sources</span></li>
                <li>
                  <a
                    href="https://opspilot.jestin16.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-neutral-950 transition-colors"
                  >
                    <span>Production URL</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="col-span-2 md:col-span-3 space-y-3">
              <p className="font-bold uppercase tracking-wider text-neutral-900 text-[0.7rem]">Get Started</p>
              <p className="text-neutral-500 text-xs font-sans">Ready to unify your developer workflow?</p>
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  className="rounded-lg bg-neutral-900 px-4 py-2 font-bold text-white hover:bg-neutral-800 transition cursor-pointer"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 font-bold text-neutral-900 hover:bg-neutral-50 transition cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-[0.7rem]">
            <span>&copy; {new Date().getFullYear()} OpsPilot. Built for dependable delivery.</span>
            <div className="flex items-center gap-6">
              <a href="#platform" className="hover:text-neutral-900 transition-colors">Platform</a>
              <a href="#architecture" className="hover:text-neutral-900 transition-colors">Architecture</a>
              <a href="#faq" className="hover:text-neutral-900 transition-colors">FAQ</a>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-neutral-900 transition-colors cursor-pointer"
              >
                Back to top ↑
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
