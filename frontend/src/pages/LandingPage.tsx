import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Box,
  ChevronDown,
  Cloud,
  Cpu,
  ExternalLink,
  GitBranch,
  Menu,
  MessageSquare,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AuthMascot } from '../components/AuthMascot';
import '../styles/landing.css';

const Infrastructure3DCore = React.lazy(() =>
  import('../components/Infrastructure3DCore').then((module) => ({ default: module.Infrastructure3DCore })),
);

const NAV_ITEMS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Observability', href: '#observability' },
  { label: 'Infrastructure', href: '#infrastructure' },
  { label: 'Deployments', href: '#deployments' },
  { label: 'Product', href: '#product-preview' },
];

const INTEGRATIONS = [
  { icon: GitBranch, label: 'GitHub CI/CD' },
  { icon: Cloud, label: 'AWS Cloud' },
  { icon: Box, label: 'Docker Engines' },
  { icon: Cpu, label: 'Kubernetes Clusters' },
  { icon: Activity, label: 'Prometheus & Loki' },
  { icon: MessageSquare, label: 'Slack & Webhooks' },
];

const METRICS = [
  ['6+', 'Native Integrations'],
  ['24/7', 'Realtime Telemetry'],
  ['100%', 'Commit & Owner Context'],
  ['< 1s', 'Live Log Streaming'],
];

const CAPABILITIES = [
  {
    id: 'deployments',
    number: '01',
    category: 'DELIVERY / CI-CD',
    title: 'Ship with context',
    description: 'Track every release from commit to rollout, with clear ownership and fast rollback paths.',
    panelTitle: 'PIPELINE EXECUTION',
    panelMeta: '#8491 · PRODUCTION',
    rows: [
      ['SOURCE', 'main · 8f3a2c1'],
      ['BUILD', 'Passed · 12.2s'],
      ['ROLLOUT', 'Canary · 100%'],
    ],
  },
  {
    id: 'infrastructure',
    number: '02',
    category: 'RUNTIME / KUBERNETES',
    title: 'See what is running',
    description: 'Understand cluster, node, and container health without switching between tools.',
    panelTitle: 'CLUSTER TOPOLOGY',
    panelMeta: '2 NODES · 8 PODS',
    rows: [
      ['NODE / US-EAST-1A', 'Ready · 14% CPU'],
      ['NODE / US-EAST-1B', 'Ready · 22% CPU'],
      ['WORKLOADS', '8 healthy · 0 pending'],
    ],
  },
  {
    id: 'observability',
    number: '03',
    category: 'SIGNALS / LOKI + PROMETHEUS',
    title: 'Follow every signal',
    description: 'Connect live logs, metrics, and incidents to the change and service behind them.',
    panelTitle: 'LIVE SIGNAL STREAM',
    panelMeta: 'LOKI / DEFAULT',
    rows: [
      ['14:02:18 · INFO', 'GET /api/health · 12ms'],
      ['14:02:19 · INFO', 'Webhook received'],
      ['14:02:21 · WARN', 'Memory usage at 74%'],
    ],
  },
  {
    id: 'governance',
    number: '04',
    category: 'GOVERNANCE / RBAC',
    title: 'Operate with confidence',
    description: 'Keep access clear and operator actions accountable with roles and audit history.',
    panelTitle: 'AUDIT EVENT',
    panelMeta: 'VERIFIED SESSION',
    rows: [
      ['ACTION', 'USER_LOGIN · SUCCESS'],
      ['ACTOR', 'admin@opspilot.io'],
      ['ACCESS', 'ADMIN · JWT verified'],
    ],
  },
];

const indexStyle = (i: number) => ({ '--i': i }) as React.CSSProperties;

/** Hook calling back once when the element scrolls into viewport */
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
      { threshold: 0, rootMargin: '0px 0px 48px 0px' },
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

const CountUp: React.FC<{ value: string }> = ({ value }) => {
  // Only count up plain figures like "6+" or "100%"; ratios such as "24/7" render as-is.
  const match = /^(\s*)(\d+)([+%]?)$/.exec(value);
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
      const progress = Math.min((now - start) / 800, 1);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, hasNumber, target]);

  if (!match) return <span>{value}</span>;
  return (
    <span ref={ref} className="landing-count font-tech-mono tabular-nums">
      <span className="sr-only">{value}</span>
      <span className="landing-count-reserve" aria-hidden="true">{value}</span>
      <span className="landing-count-value" aria-hidden="true">{match[1]}{shown}{match[3]}</span>
    </span>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; dot?: boolean }> = ({ children, dot }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-3.5 py-1.5 font-tech-mono text-xs font-bold uppercase tracking-wider text-black shadow-2xs transition-all duration-300 hover:border-black/30">
    {dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black shadow-[0_0_6px_rgba(0,0,0,0.5)]" />}
    {children}
  </div>
);

export const LandingPage: React.FC = () => {
  const [activeCapability, setActiveCapability] = useState(0);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mascotHop, setMascotHop] = useState(0);
  const [ctaHover, setCtaHover] = useState(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const navRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuToggleRef.current?.focus();
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1161px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const activateNavTarget = (href: string) => {
    const capabilityIndex = CAPABILITIES.findIndex(({ id }) => href === `#${id}`);
    if (capabilityIndex >= 0) setActiveCapability(capabilityIndex);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mousePosRef.current = { x, y };
  };

  return (
    <div
      className="landing-root min-h-screen bg-white font-sans antialiased text-black selection:bg-black selection:text-white"
    >
      {/* =========================================================================
          SITE TOP NAVIGATION (CLEAN & INTEGRATED, NOT TRAPPED IN A CARD)
         ========================================================================= */}
      <header ref={navRef} className="landing-top-nav">
        <div className="landing-nav-container">
          <button
            type="button"
            onClick={() => go('/')}
            className="hero-wordmark-brand group"
            aria-label="OpsPilot Home"
          >
            <span className="hero-wordmark-title">OPS<span className="hero-wordmark-divider">/</span>PILOT</span>
            <span className="hero-wordmark-tag">DEVELOPER PLATFORM</span>
          </button>

          <nav className="hero-nav-links" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="hero-nav-link"
                onClick={() => activateNavTarget(item.href)}
              >
                <span>{item.label}</span>
                <ArrowUpRight className="h-3 w-3 opacity-50" aria-hidden="true" />
              </a>
            ))}
          </nav>

          <div className="hero-nav-actions">
            <button
              type="button"
              onClick={() => go('/login')}
              className="hero-nav-link hero-nav-sign-in"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => go('/dashboard')}
              className="hero-nav-cta hero-nav-dashboard"
            >
              <span>Open Dashboard</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              ref={menuToggleRef}
              onClick={() => setMenuOpen((open) => !open)}
              className="hero-mobile-toggle"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        <nav id="landing-mobile-menu" aria-label="Mobile navigation" className={`hero-mobile-drawer${menuOpen ? ' is-open' : ''}`} inert={!menuOpen}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => {
                activateNavTarget(item.href);
                setMenuOpen(false);
              }}
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => go('/dashboard')}
            className="mobile-cta"
          >
            Open Dashboard
          </button>
          <button
            type="button"
            onClick={() => go('/login')}
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* =========================================================================
          HERO SECTION — DIRECT IMMERSIVE PRESENTATION (NO FLOATING CARD WRAPPER)
         ========================================================================= */}
      <section
        className="landing-hero-direct"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mousePosRef.current = { x: 0, y: 0 }; }}
      >
        {/* Subtle noise grain */}
        <div className="landing-film-grain" aria-hidden="true" />

        {/* Ambient Amber Platinum Studio Glow */}
        <div className="hero-ambient-glow" aria-hidden="true" />

        {/* Hero Content Stage: Clean 2-Column Responsive Split */}
        <div className="hero-stage-container">
          <div className="hero-split-grid">
            {/* Single clear platform message */}
            <div className="hero-editorial-column">
              <h1 className="hero-single-headline">
                <span>OpsPilot connects</span>
                <span>code, deployments,</span>
                <span className="hero-single-headline-accent">and runtime signals.</span>
              </h1>
              <p className="hero-support-copy">
                See the infrastructure health, logs, and metrics behind every release.
              </p>
              <a href="#platform" className="hero-primary-cta">
                <span>Explore platform</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
            {/* Right Column: Dedicated Interactive 3D Infrastructure Hologram */}
            <div className="hero-mesh-stage">
              <React.Suspense fallback={<div className="hero-orb-loading" aria-hidden="true" />}>
                <Infrastructure3DCore activeState={0} mousePosRef={mousePosRef} />
              </React.Suspense>
            </div>
          </div>

          {/* Center Bottom Scroll Indicator */}
          <a
            href="#platform"
            className="hero-scroll-cue"
            aria-label="Scroll to platform overview"
          >
            <div className="hero-scroll-arrow">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </a>
        </div>
      </section>

      {/* =========================================================================
          VERIFIED NATIVE INTEGRATIONS MARQUEE (STUDIO STYLE)
         ========================================================================= */}
      <div id="integrations" className="landing-trust-strip border-y border-black/10 bg-white py-9">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <p className="mb-6 text-center font-tech-mono text-xs font-bold uppercase tracking-[0.2em] text-black">
            Engineered to unify your existing infrastructure stack
          </p>
          <div className="landing-marquee overflow-hidden">
            <div className="landing-marquee-track">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  aria-hidden={copy === 1}
                  className="flex shrink-0 items-center gap-14 pr-14 text-black"
                >
                  {INTEGRATIONS.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="group flex items-center gap-3 whitespace-nowrap font-tech-mono text-xs font-bold tracking-tight text-black transition-all duration-300 hover:opacity-70"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 bg-white text-black transition-colors group-hover:border-black group-hover:bg-black group-hover:text-white shadow-2xs">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KEY OPERATIONAL METRICS COUNTER (STUDIO STYLE)
         ========================================================================= */}
      <div className="landing-metrics border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-black/10">
          {METRICS.map(([value, label], i) => (
            <Reveal
              key={label}
              index={i}
              className="group px-6 py-10 text-center transition-colors duration-300 hover:bg-black/[0.02]"
            >
              <p className="font-tech-mono text-3xl font-black tracking-tight text-black sm:text-4xl">
                <CountUp value={value} />
              </p>
              <p className="mt-2 font-tech-mono text-[11px] font-bold uppercase tracking-wider text-black transition-colors">
                {label}
              </p>
            </Reveal>
          ))}
        </div>
      </div>

      <main className="studio-section bg-white text-black">
        {/* =========================================================================
            CONNECTED PLATFORM CAPABILITY MAP
           ========================================================================= */}
        <section id="platform" className="landing-capabilities mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
          <Reveal className="capabilities-intro max-w-3xl">
            <Eyebrow dot>The OpsPilot Platform Core</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-black sm:text-5xl lg:text-6xl">
              An internal developer platform <br className="hidden sm:inline" />
              <span className="text-black font-editorial-italic font-normal">built for runtime reality.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-black sm:text-lg">
              Every deployment has a project. Every project has an accountable owner. Every anomaly traces directly to the
              commit, pipeline stage, or container that produced it.
            </p>
          </Reveal>

          <div className="capability-map mt-16 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal index={1} className="capability-list-wrap">
              <div className="capability-list" role="group" aria-label="Platform capabilities">
                {CAPABILITIES.map((capability, index) => (
                  <button
                    key={capability.number}
                    id={capability.id}
                    type="button"
                    aria-pressed={activeCapability === index}
                    aria-controls="capability-preview"
                    className={`capability-item${activeCapability === index ? ' is-active' : ''}`}
                    onClick={() => setActiveCapability(index)}
                  >
                    <span className="capability-number">{capability.number}</span>
                    <span className="capability-copy">
                      <span className="capability-category">{capability.category}</span>
                      <span className="capability-title">{capability.title}</span>
                      <span className="capability-description">{capability.description}</span>
                    </span>
                    <ArrowUpRight className="capability-arrow" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </Reveal>

            <Reveal index={2}>
              <div id="capability-preview" className="capability-preview" role="region" aria-live="polite" aria-labelledby={CAPABILITIES[activeCapability].id}>
                <div className="capability-preview-topline">
                  <span className="capability-preview-brand"><span className="capability-live-dot" /> OPSPILOT / CONTROL PLANE</span>
                  <span className="capability-preview-index">{CAPABILITIES[activeCapability].number} / 04</span>
                </div>
                <div key={activeCapability} className="capability-preview-content">
                  <div className="capability-preview-heading">
                    <div>
                      <span className="capability-preview-label">{CAPABILITIES[activeCapability].category}</span>
                      <h3>{CAPABILITIES[activeCapability].panelTitle}</h3>
                    </div>
                    <span className="capability-preview-meta">{CAPABILITIES[activeCapability].panelMeta}</span>
                  </div>
                  <div className="capability-preview-rows">
                    {CAPABILITIES[activeCapability].rows.map(([label, value], index) => (
                      <div className="capability-preview-row" key={label}>
                        <span className="capability-row-index">0{index + 1}</span>
                        <span className="capability-row-label">{label}</span>
                        <span className="capability-row-value">{value}</span>
                        <span className="capability-row-status" aria-label="Healthy">OK</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="capability-preview-footer">
                  <span>PROJECT / CHECKOUT-SERVICE</span>
                  <span>ALL SYSTEMS NOMINAL <span className="capability-live-dot" /></span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* =========================================================================
            PLATFORM OVERVIEW (EDITORIAL STORY, NO DASHBOARD SCREENSHOT)
           ========================================================================= */}
        <section id="product-preview" className="landing-product-story relative isolate overflow-hidden bg-white px-6 py-24 sm:px-8 sm:py-32 lg:px-12 text-black">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-3.5 py-1.5 font-tech-mono text-[11px] font-bold uppercase tracking-wider text-black">
                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                One connected platform
              </div>
              <h2 className="mt-6 max-w-xl text-4xl font-black leading-[1.06] tracking-tight text-black sm:text-5xl lg:text-6xl">
                Clarity from commit <span className="font-editorial-italic font-normal text-black">to runtime.</span>
              </h2>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-black sm:text-lg">
                OpsPilot brings delivery, infrastructure, and operational signals together, so your team can move from a change to its impact with less guesswork.
              </p>
              <button
                type="button"
                onClick={() => go('/signup')}
                className="mt-8 px-6 py-3.5 inline-flex items-center gap-2 rounded-full border border-black bg-black font-tech-mono text-xs font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 cursor-pointer"
              >
                Explore the platform <ArrowRight className="h-4 w-4" />
              </button>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: GitBranch, number: '01', title: 'Ship with context', detail: 'Keep every release tied to its repository, commit, owner, and rollout.' },
                { icon: Cpu, number: '02', title: 'See what is running', detail: 'Understand clusters, containers, and services without changing tools.' },
                { icon: Activity, number: '03', title: 'Follow every signal', detail: 'Connect logs, metrics, and incidents to the change that caused them.' },
                { icon: ShieldCheck, number: '04', title: 'Operate with confidence', detail: 'Give each team clear access and keep an accountable audit trail.' },
              ].map(({ icon: Icon, number, title, detail }, index) => (
                <Reveal key={number} index={index + 1}>
                  <article className="story-card h-full rounded-2xl p-6 transition duration-300 sm:p-7 bg-white border border-black/10 text-black">
                    <div className="flex items-center justify-between">
                      <Icon className="story-card-icon h-5 w-5 text-black" aria-hidden="true" />
                      <span className="font-tech-mono text-[10px] font-bold tracking-[0.18em] text-black">{number}</span>
                    </div>
                    <h3 className="mt-8 text-lg font-bold text-black">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-black">{detail}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            OPERATIONAL WORKFLOW TIMELINE (STUDIO STYLE)
           ========================================================================= */}
        <section id="workflow" className="landing-workflow border-t border-black/10 bg-white py-24 sm:py-32 text-black">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-12">
            <Reveal>
              <Eyebrow>Shorter Path To Resolution</Eyebrow>
              <h2 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight text-black sm:text-5xl">
                From repository commit to <br className="hidden sm:inline" />
                reliable runtime<span className="text-black">.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-black">
                Stop jumping across disconnected terminals, consoles, and cloud dashboards. OpsPilot connects delivery context
                to runtime diagnostics in a unified workflow.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  className="px-6 py-3.5 inline-flex items-center gap-2 rounded-full border border-black bg-black font-tech-mono text-xs font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 cursor-pointer"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="px-5 py-3 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white font-tech-mono text-xs font-bold text-black transition-all duration-300 hover:border-black hover:bg-black hover:text-white cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </Reveal>

            <div className="relative pl-9">
              {/* Timeline Signal Rail with travelling pulse */}
              <div className="pointer-events-none absolute top-10 bottom-10 left-[11px] w-0.5 rounded-full bg-black/15" aria-hidden="true">
                <span className="workflow-rail-dot absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.3)]" />
              </div>

              <div className="grid gap-4">
                {[
                  [
                    '01',
                    'Connect the Repository & Owner',
                    'Register GitHub repositories, configure environments, and link developer teams directly to microservices.',
                  ],
                  [
                    '02',
                    'Ship with Full Pipeline Traceability',
                    'Trigger automated deployments with commit hashes, test results, and container images attached to the release.',
                  ],
                  [
                    '03',
                    'Observe and Remediate Instantly',
                    'Stream live logs, inspect cluster pods, and trigger rollbacks without hunting for logs in disparate systems.',
                  ],
                ].map(([number, title, description], i) => (
                  <Reveal key={number} index={i + 1}>
                    <div className="workflow-step group relative flex gap-5 rounded-2xl p-6 bg-white border border-black/10 text-black">
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 -left-[31px] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-[3px] border-white bg-black transition-all duration-300 group-hover:scale-125 group-hover:bg-black"
                      />
                      <span className="workflow-step-number flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-tech-mono text-sm font-black bg-white text-black border border-black/20">
                        {number}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-black">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-black">{description}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            CTA BANNER WITH OPSPILOT MASCOT (STUDIO GLASS PANEL)
           ========================================================================= */}
        <section className="landing-final-cta bg-white px-6 pb-24 pt-12 sm:px-8 lg:px-12 lg:pb-32 text-black">
          <Reveal onReveal={() => setMascotHop((n) => n + 1)} className="relative mx-auto max-w-7xl">
            <AuthMascot gaze={null} cover="none" mood={ctaHover ? 'happy' : 'idle'} hopKey={mascotHop} />
            <div className="cta-panel relative z-10 overflow-hidden px-8 py-16 text-center sm:px-16 sm:py-20 bg-white border border-black/12 shadow-sm text-black">
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-3.5 py-1.5 font-tech-mono text-[11px] font-bold uppercase tracking-wider text-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-black" />
                  Start in Minutes
                </div>
                <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-[1.15] tracking-tight text-black sm:text-4xl lg:text-5xl">
                  Take command of your developer platform today<span className="text-black">.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-black">
                  Connect your first project and discover what happens when deployments, clusters, and logs share one unified
                  workspace.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => go('/signup')}
                    onMouseEnter={() => setCtaHover(true)}
                    onMouseLeave={() => setCtaHover(false)}
                    className="px-8 py-4 inline-flex items-center gap-2 rounded-full border border-black bg-black font-tech-mono text-xs font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 cursor-pointer"
                  >
                    <span>Create Free Workspace</span>
                    <ArrowRight className="h-4 w-4 text-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go('/login')}
                    className="px-7 py-3.5 inline-flex items-center gap-2 rounded-full border border-black/20 bg-white font-tech-mono text-xs font-bold text-black transition-all duration-300 hover:border-black hover:bg-black hover:text-white cursor-pointer"
                  >
                    <span>Sign In</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* =========================================================================
          MINIMALIST LUXURY FOOTER (MATCHING CINEMATIC AESTHETIC)
         ========================================================================= */}
      <footer className="border-t border-black/10 bg-white text-black">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 sm:pt-20 sm:pb-16 lg:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-12 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 flex flex-col justify-between md:col-span-4 lg:col-span-5">
              <div>
                <button
                  type="button"
                  onClick={() => go('/')}
                  className="group flex items-center gap-3 text-left cursor-pointer"
                >
                  <span className="font-tech-mono text-lg font-bold tracking-tight text-black">
                    ( OPS_PILOT )
                  </span>
                </button>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-black">
                  The internal developer platform engineered for high-velocity teams. Unifying deployments, infrastructure,
                  and live observability into a single command plane.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-3.5 py-1.5 font-tech-mono text-xs font-semibold text-black shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-black" />
                  </span>
                  <span>ALL SYSTEMS OPERATIONAL</span>
                </div>
              </div>
            </div>

            {/* Navigation Columns */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h3 className="font-tech-mono text-xs font-bold uppercase tracking-wider text-black">
                Capabilities
              </h3>
              <ul className="mt-4 space-y-3 font-tech-mono text-xs text-black">
                <li><a href="#deployments" className="hover:opacity-70 transition-opacity">Deployments</a></li>
                <li><a href="#infrastructure" className="hover:opacity-70 transition-opacity">Kubernetes</a></li>
                <li><a href="#observability" className="hover:opacity-70 transition-opacity">Loki &amp; Logs</a></li>
                <li><a href="#product-preview" className="hover:opacity-70 transition-opacity">Audit Trails</a></li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-3 lg:col-span-2">
              <h3 className="font-tech-mono text-xs font-bold uppercase tracking-wider text-black">
                Platform
              </h3>
              <ul className="mt-4 space-y-3 font-tech-mono text-xs text-black">
                <li><a href="#platform" className="hover:opacity-70 transition-opacity">Architecture</a></li>
                <li><a href="#workflow" className="hover:opacity-70 transition-opacity">Workflows</a></li>
                <li><a href="#integrations" className="hover:opacity-70 transition-opacity">Integrations</a></li>
                <li>
                  <a
                    href="https://opspilot.jestin16.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    <span>Production</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-3 lg:col-span-3">
              <h3 className="font-tech-mono text-xs font-bold uppercase tracking-wider text-black">
                Access
              </h3>
              <p className="mt-4 text-xs leading-relaxed text-black">
                Ready to explore the internal developer platform?
              </p>
              <div className="mt-4 flex items-center gap-3 font-tech-mono text-xs">
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  className="rounded-full border border-black bg-black px-5 py-2 font-bold text-white transition hover:bg-neutral-800 cursor-pointer"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="rounded-full border border-black/20 bg-white px-5 py-2 font-bold text-black transition hover:border-black hover:bg-black hover:text-white cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal Line */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-8 font-tech-mono text-xs text-black sm:flex-row">
            <span>&copy; 2026 OpsPilot. Built for dependable delivery.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-black">
              <a href="#platform" className="hover:opacity-70 transition-opacity">Platform</a>
              <a href="#workflow" className="hover:opacity-70 transition-opacity">Workflow</a>
              <a href="#integrations" className="hover:opacity-70 transition-opacity">Integrations</a>
              <a href="https://opspilot.jestin16.dev" target="_blank" rel="noreferrer" className="hover:opacity-70 transition-opacity">Live App</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
