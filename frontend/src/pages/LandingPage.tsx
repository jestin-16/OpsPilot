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
  Rocket,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { AuthMascot } from '../components/AuthMascot';
import { Infrastructure3DCore } from '../components/Infrastructure3DCore';
import '../styles/landing.css';

const NAV_ITEMS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Observability', href: '#observability' },
  { label: 'Infrastructure', href: '#infrastructure' },
  { label: 'Deployments', href: '#deployments' },
  { label: 'Product', href: '#product-preview' },
];

const HERO_STATES = [
  {
    key: 'A',
    index: '001 / 004',
    name: 'INFRASTRUCTURE PATHWAYS',
    titleLine1: 'WHERE CODE',
    titleLine2: 'MERGES',
    italicWord: 'with',
    prefix: '// YOUR',
    titleLine3: 'INFRASTRUCTURE',
    description:
      'Your infrastructure. Your deployments. Your operational visibility — unified into a single high-velocity command plane.',
    cta: 'EXPLORE PLATFORM',
    image: '/ops-infrastructure-conduits.jpg',
  },
  {
    key: 'B',
    index: '002 / 004',
    name: 'TELEMETRY APERTURE',
    titleLine1: 'BUILD. OBSERVE.',
    titleLine2: 'CONVERGE',
    italicWord: 'into',
    prefix: '// REALTIME',
    titleLine3: 'OPERATIONS',
    description:
      'From deployment anomalies to live container logs, trace every signal directly to owner and commit context in milliseconds.',
    cta: 'VIEW OBSERVABILITY',
    image: '/ops-core-aperture.jpg',
  },
  {
    key: 'C',
    index: '003 / 004',
    name: 'DELIVERY MESH',
    titleLine1: 'SHIP WITH',
    titleLine2: 'ABSOLUTE',
    italicWord: 'proven',
    prefix: '// VERIFIED',
    titleLine3: 'CONFIDENCE',
    description:
      'Automated canary releases, rollback triggers, and multi-cloud Kubernetes deployments with accountable governance.',
    cta: 'INSPECT RUNTIMES',
    image: '/ops-infrastructure-conduits.jpg',
  },
  {
    key: 'D',
    index: '004 / 004',
    name: 'ZERO-TRUST CONTROL',
    titleLine1: 'OPERATE AT',
    titleLine2: 'ENTERPRISE',
    italicWord: 'without',
    prefix: '// UNIFIED',
    titleLine3: 'FRICTION',
    description:
      'Role-based access control, cryptographic JWT session boundaries, and audit-ready event logging across all clusters.',
    cta: 'OPEN DASHBOARD',
    image: '/ops-core-aperture.jpg',
  },
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
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
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1200, 1);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, hasNumber, target]);

  if (!match) return <span>{value}</span>;
  return (
    <span ref={ref} className="font-tech-mono tabular-nums">
      {match[1]}
      {shown}
      {match[3]}
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
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHeroState, setActiveHeroState] = useState(0);
  const [mascotHop, setMascotHop] = useState(0);
  const [ctaHover, setCtaHover] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const currentHero = HERO_STATES[activeHeroState];

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <div
      className="landing-root min-h-screen bg-white font-sans antialiased text-black selection:bg-black selection:text-white"
    >
      {/* =========================================================================
          SITE TOP NAVIGATION (CLEAN & INTEGRATED, NOT TRAPPED IN A CARD)
         ========================================================================= */}
      <header className="landing-top-nav">
        <div className="landing-nav-container">
          <button
            type="button"
            onClick={() => go('/')}
            className="hero-wordmark-brand group"
            aria-label="OpsPilot Home"
          >
            <span className="hero-wordmark-title">( OPS_PILOT )</span>
            <span className="hero-wordmark-tag">[ OpsPilot v02.4 / DEV-PLATFORM ]</span>
          </button>

          <nav className="hero-nav-links" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} className="hero-nav-link">
                <span>{item.label}</span>
                <span className="text-[0.6rem] opacity-60">↗</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => go('/login')}
              className="hero-nav-link hidden sm:inline-flex cursor-pointer"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => go('/dashboard')}
              className="hero-nav-cta hidden sm:inline-flex"
            >
              <span>Open Dashboard</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="hero-mobile-toggle md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {menuOpen && (
          <div className="hero-mobile-drawer md:hidden">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label} ↗
              </a>
            ))}
            <button
              type="button"
              onClick={() => go('/dashboard')}
              className="mobile-cta"
            >
              Open Dashboard ↗
            </button>
            <button
              type="button"
              onClick={() => go('/login')}
            >
              Sign In
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          HERO SECTION — DIRECT IMMERSIVE PRESENTATION (NO FLOATING CARD WRAPPER)
         ========================================================================= */}
      <section
        className="landing-hero-direct"
        onMouseMove={handleMouseMove}
      >
        {/* Subtle noise grain */}
        <div className="landing-film-grain" aria-hidden="true" />

        {/* Ambient Amber Platinum Studio Glow */}
        <div className="hero-ambient-glow" aria-hidden="true" />

        {/* Hero Content Stage: Clean 2-Column Responsive Split */}
        <div className="hero-stage-container">
          <div className="hero-split-grid">
            {/* Left Column: Editorial Headline & Synchronized State Controls */}
            <div className="hero-editorial-column">
              {/* Micro Technical Index Badge */}
              <div className="hero-tag-topleft">
                <span>[ OPS_INDEX // {currentHero.key} ]</span>
                <span>SYSTEMS CONVERGENCE</span>
              </div>

              {/* Kicker */}
              <p className="hero-editorial-kicker">
                <span className="hero-kicker-dot" />
                INTERNAL DEVELOPER PLATFORM · {currentHero.name}
              </p>

              {/* Headline */}
              <h1 className="hero-headline-title">
                <span className="hero-headline-word" style={indexStyle(0)}>
                  {currentHero.titleLine1}
                </span>
                <br />
                <span className="hero-headline-word" style={indexStyle(1)}>
                  {currentHero.titleLine2}
                </span>
                <br />
                <span className="hero-headline-italic" style={indexStyle(2)}>
                  {currentHero.italicWord}
                </span>
                <span className="hero-headline-word" style={indexStyle(3)}>
                  <span className="hero-headline-slash">{currentHero.prefix}</span>
                </span>
                <br />
                <span className="hero-headline-word" style={indexStyle(4)}>
                  {currentHero.titleLine3}
                </span>
              </h1>

              {/* Editorial Description */}
              <p className="hero-editorial-desc">
                {currentHero.description}
              </p>

              {/* Interactive State Switcher Tabs */}
              <div className="hero-state-bar">
                <div className="hero-state-toggle-group">
                  {HERO_STATES.map((state, i) => (
                    <button
                      key={state.key}
                      type="button"
                      onClick={() => setActiveHeroState(i)}
                      className={`hero-state-tab ${activeHeroState === i ? 'is-active' : ''}`}
                      aria-label={`Switch to state ${state.key}`}
                    >
                      ( {state.key} )
                    </button>
                  ))}
                </div>
                <span className="hero-state-index">[ {currentHero.index} ]</span>
              </div>

              {/* Action Buttons & Telemetry Indicator */}
              <div className="hero-action-row">
                <button
                  type="button"
                  onClick={() => go('/dashboard')}
                  className="hero-primary-cta"
                >
                  <span>{currentHero.cta}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
                <div className="hero-telemetry-badge">
                  <span className="hero-badge-pulse" />
                  <span>ALL SYSTEMS SYNCED</span>
                </div>
              </div>
            </div>

            {/* Right Column: Dedicated Interactive 3D Infrastructure Hologram */}
            <div className="hero-mesh-stage">
              <Infrastructure3DCore
                activeState={activeHeroState}
                mousePos={mousePos}
              />
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
            FOUR EDITORIAL CAPABILITY AREAS (STUDIO GLASS SLATES)
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

          {/* 4 Feature Areas Layout */}
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {/* 1. Deployment Management */}
            <Reveal index={1}>
              <article id="deployments" className="editorial-card flex h-full flex-col p-8 sm:p-10 bg-white border border-black/10 text-black">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/15 bg-white text-black shadow-xs">
                    <Rocket className="h-5 w-5 text-black" />
                  </span>
                  <span className="editorial-tag-chip">[ 01 // CI/CD ]</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-black">
                  Deployment Management
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black">
                  Trigger, monitor, and govern releases from GitHub repositories to production clusters. Trace exact commit
                  hashes, version tags, build duration, and trigger one-click instant rollbacks when health indicators degrade.
                </p>

                {/* Technical Interactive Visual */}
                <div className="mt-8 landing-preview-panel rounded-2xl p-4.5 font-tech-mono bg-white border border-black/10">
                  <div className="flex items-center justify-between text-[11px] text-black mb-3">
                    <span className="font-semibold tracking-wide">PIPELINE EXECUTION #8491</span>
                    <span className="font-bold text-black flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
                      CANARY ROLLOUT 100%
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white border border-black/10 p-2.5 shadow-2xs">
                      <span className="text-[9px] uppercase text-black block font-semibold">Lint</span>
                      <span className="font-bold text-black">0.4s ✓</span>
                    </div>
                    <div className="rounded-lg bg-white border border-black/10 p-2.5 shadow-2xs">
                      <span className="text-[9px] uppercase text-black block font-semibold">Test</span>
                      <span className="font-bold text-black">1.8s ✓</span>
                    </div>
                    <div className="rounded-lg bg-white border border-black/10 p-2.5 shadow-2xs">
                      <span className="text-[9px] uppercase text-black block font-semibold">Build</span>
                      <span className="font-bold text-black">12.2s ✓</span>
                    </div>
                    <div className="rounded-lg border border-black bg-black text-white p-2.5">
                      <span className="text-[9px] uppercase text-white/80 block font-semibold">Deploy</span>
                      <span className="font-bold text-white">Live ●</span>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>

            {/* 2. Infrastructure Visibility */}
            <Reveal index={2}>
              <article id="infrastructure" className="editorial-card flex h-full flex-col p-8 sm:p-10 bg-white border border-black/10 text-black">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/15 bg-white text-black shadow-xs">
                    <Cpu className="h-5 w-5 text-black" />
                  </span>
                  <span className="editorial-tag-chip">[ 02 // K8S & DOCKER ]</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-black">
                  Infrastructure Visibility
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black">
                  Inspect Kubernetes clusters, worker nodes, namespaces, and Docker daemon state in real-time. Verify container
                  uptime, CPU/memory limits, restarting pods, and ingress routing without switching context.
                </p>

                {/* Technical Cluster Status Preview */}
                <div className="mt-8 landing-preview-panel rounded-2xl p-4.5 font-tech-mono bg-white border border-black/10">
                  <div className="flex items-center justify-between text-[11px] text-black mb-3">
                    <span className="font-semibold tracking-wide">KUBERNETES TOPOLOGY</span>
                    <span className="text-black font-bold">2 NODES · 8 PODS</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-white border border-black/10 px-3.5 py-2.5 text-xs shadow-2xs">
                      <span className="flex items-center gap-2 font-bold text-black">
                        <span className="h-2 w-2 rounded-full bg-black" />
                        ip-10-0-1-92.ec2.internal
                      </span>
                      <span className="text-[11px] text-black font-semibold">Ready · 14% CPU</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white border border-black/10 px-3.5 py-2.5 text-xs shadow-2xs">
                      <span className="flex items-center gap-2 font-bold text-black">
                        <span className="h-2 w-2 rounded-full bg-black" />
                        ip-10-0-2-14.ec2.internal
                      </span>
                      <span className="text-[11px] text-black font-semibold">Ready · 22% CPU</span>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>

            {/* 3. Logs and Monitoring */}
            <Reveal index={3}>
              <article id="observability" className="editorial-card flex h-full flex-col p-8 sm:p-10 bg-white border border-black/10 text-black">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/15 bg-white text-black shadow-xs">
                    <Terminal className="h-5 w-5 text-black" />
                  </span>
                  <span className="editorial-tag-chip">[ 03 // LOKI & PROMETHEUS ]</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-black">
                  Logs &amp; Monitoring
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black">
                  Stream high-frequency stdout and stderr logs via Loki with sub-second latency. Search across projects with level
                  filters, inspect Prometheus uptime probes, and correlate spike trends during active incidents.
                </p>

                {/* Live Log Stream Preview */}
                <div className="mt-8 rounded-2xl border border-black/10 bg-white p-4.5 font-tech-mono text-[11px] text-black shadow-sm">
                  <div className="mb-2.5 flex items-center justify-between border-b border-black/10 pb-2 text-[10px] text-black">
                    <span className="flex items-center gap-1.5 text-black font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
                      LIVE BUFFER STREAMING
                    </span>
                    <span className="text-black font-semibold">LOKI // DEFAULT</span>
                  </div>
                  <div className="space-y-1.5 text-black">
                    <p><span className="text-black/60">14:02:18</span> <span className="font-bold text-black">INFO</span> [core-service] HTTP 200 GET /api/v1/health (12ms)</p>
                    <p><span className="text-black/60">14:02:19</span> <span className="font-bold text-black">INFO</span> [ci-cd] Webhook received from github.com/opspilot</p>
                    <p><span className="text-black/60">14:02:21</span> <span className="font-bold text-black">WARN</span> [k8s-agent] Memory usage reached 74% limit</p>
                  </div>
                </div>
              </article>
            </Reveal>

            {/* 4. Operational Insights & Governance */}
            <Reveal index={4}>
              <article className="editorial-card flex h-full flex-col p-8 sm:p-10 bg-white border border-black/10 text-black">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/15 bg-white text-black shadow-xs">
                    <ShieldCheck className="h-5 w-5 text-black" />
                  </span>
                  <span className="editorial-tag-chip">[ 04 // AUDIT & RBAC ]</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-black">
                  Operational Insights
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black">
                  Maintain complete auditability with tracked operator actions, login sessions, project deletions, and RBAC role
                  enforcements (DEVELOPER, DEVOPS, ADMIN). Surface actionable diagnosis without hallucinated metrics.
                </p>

                {/* Audit Event Preview */}
                <div className="mt-8 landing-preview-panel rounded-2xl p-4.5 font-tech-mono bg-white border border-black/10">
                  <div className="flex items-center justify-between text-[11px] text-black mb-3">
                    <span className="font-semibold tracking-wide">SECURITY &amp; AUDIT LOG</span>
                    <span className="text-black font-bold">ROLE: ADMIN</span>
                  </div>
                  <div className="rounded-lg bg-white border border-black/10 p-3.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-black mb-1">
                      <span>USER_LOGIN // SUCCESS</span>
                      <span className="text-[10px] text-black bg-black/5 border border-black/15 px-2 py-0.5 rounded-full font-bold">VERIFIED JWT</span>
                    </div>
                    <p className="text-[11px] text-black leading-normal">
                      admin@opspilot.io authenticated with multi-role permissions. Audit event recorded to database log.
                    </p>
                  </div>
                </div>
              </article>
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
