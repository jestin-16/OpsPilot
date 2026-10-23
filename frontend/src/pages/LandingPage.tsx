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
  <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 backdrop-blur-md px-3.5 py-1.5 font-tech-mono text-xs font-bold uppercase tracking-wider text-gray-800 shadow-sm transition-all duration-300 hover:border-black/20">
    {dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />}
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
      className="landing-root min-h-screen font-sans antialiased text-[#1A1A1A] selection:bg-[#FFC107] selection:text-[#1A1A1A]"
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

              <div className="hero-corner-glyph" aria-hidden="true">
                &lt;:
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
      <div id="integrations" className="landing-trust-strip border-y border-white/25 bg-black/10 backdrop-blur-md py-9">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <p className="mb-6 text-center font-tech-mono text-xs font-semibold uppercase tracking-[0.2em] text-gray-800">
            Engineered to unify your existing infrastructure stack
          </p>
          <div className="landing-marquee overflow-hidden">
            <div className="landing-marquee-track">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  aria-hidden={copy === 1}
                  className="flex shrink-0 items-center gap-14 pr-14 text-gray-800"
                >
                  {INTEGRATIONS.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="group flex items-center gap-3 whitespace-nowrap font-tech-mono text-xs font-bold tracking-tight transition-all duration-300 hover:text-black"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/40 bg-white/60 text-gray-900 transition-colors group-hover:border-black group-hover:bg-black group-hover:text-white shadow-2xs">
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
      <div className="landing-metrics border-b border-white/20 bg-white/30 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/20 sm:grid-cols-4">
          {METRICS.map(([value, label], i) => (
            <Reveal
              key={label}
              index={i}
              className="group px-6 py-10 text-center transition-colors duration-300 hover:bg-white/40"
            >
              <p className="font-tech-mono text-3xl font-black tracking-tight text-black sm:text-4xl">
                <CountUp value={value} />
              </p>
              <p className="mt-2 font-tech-mono text-[11px] font-bold uppercase tracking-wider text-gray-700 transition-colors group-hover:text-black">
                {label}
              </p>
            </Reveal>
          ))}
        </div>
      </div>

      <main className="studio-section">
        {/* =========================================================================
            FOUR EDITORIAL CAPABILITY AREAS (STUDIO GLASS SLATES)
           ========================================================================= */}
        <section id="platform" className="landing-capabilities mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
          <Reveal className="capabilities-intro max-w-3xl">
            <Eyebrow dot>The OpsPilot Platform Core</Eyebrow>
            <h2 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-black sm:text-5xl lg:text-6xl">
              An internal developer platform <br className="hidden sm:inline" />
              <span className="text-gray-700 font-editorial-italic font-normal">built for runtime reality.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-800 sm:text-lg">
              Every deployment has a project. Every project has an accountable owner. Every anomaly traces directly to the
              commit, pipeline stage, or container that produced it.
            </p>
          </Reveal>

          {/* 4 Feature Areas Layout */}
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {/* 1. Deployment Management */}
            <Reveal index={1}>
              <article id="deployments" className="editorial-card flex h-full flex-col p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-black shadow-xs">
                    <Rocket className="h-5 w-5 text-amber-600" />
                  </span>
                  <span className="editorial-tag-chip">[ 01 // CI/CD ]</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-black">
                  Deployment Management
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  Trigger, monitor, and govern releases from GitHub repositories to production clusters. Trace exact commit
                  hashes, version tags, build duration, and trigger one-click instant rollbacks when health indicators degrade.
                </p>

                {/* Technical Interactive Visual */}
                <div className="mt-8 rounded-2xl bg-black/5 p-4.5 font-tech-mono">
                  <div className="flex items-center justify-between text-[11px] text-gray-700 mb-3">
                    <span className="font-semibold tracking-wide">PIPELINE EXECUTION #8491</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      CANARY ROLLOUT 100%
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white/90 p-2.5 shadow-2xs">
                      <span className="text-[9px] uppercase text-gray-500 block">Lint</span>
                      <span className="font-bold text-black">0.4s ✓</span>
                    </div>
                    <div className="rounded-lg bg-white/90 p-2.5 shadow-2xs">
                      <span className="text-[9px] uppercase text-gray-500 block">Test</span>
                      <span className="font-bold text-black">1.8s ✓</span>
                    </div>
                    <div className="rounded-lg bg-white/90 p-2.5 shadow-2xs">
                      <span className="text-[9px] uppercase text-gray-500 block">Build</span>
                      <span className="font-bold text-black">12.2s ✓</span>
                    </div>
                    <div className="rounded-lg bg-black text-white p-2.5">
                      <span className="text-[9px] uppercase text-gray-400 block">Deploy</span>
                      <span className="font-bold text-emerald-400">Live 🟢</span>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>

            {/* 2. Infrastructure Visibility */}
            <Reveal index={2}>
              <article id="infrastructure" className="editorial-card flex h-full flex-col p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-black shadow-xs">
                    <Cpu className="h-5 w-5 text-amber-500" />
                  </span>
                  <span className="editorial-tag-chip">[ 02 // K8S & DOCKER ]</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-black">
                  Infrastructure Visibility
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  Inspect Kubernetes clusters, worker nodes, namespaces, and Docker daemon state in real-time. Verify container
                  uptime, CPU/memory limits, restarting pods, and ingress routing without switching context.
                </p>

                {/* Technical Cluster Status Preview */}
                <div className="mt-8 rounded-2xl bg-black/5 p-4.5 font-tech-mono">
                  <div className="flex items-center justify-between text-[11px] text-gray-700 mb-3">
                    <span className="font-semibold tracking-wide">KUBERNETES TOPOLOGY</span>
                    <span className="text-black font-bold">2 NODES · 8 PODS</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-white/90 px-3.5 py-2.5 text-xs shadow-2xs">
                      <span className="flex items-center gap-2 font-bold text-black">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        ip-10-0-1-92.ec2.internal
                      </span>
                      <span className="text-[11px] text-gray-600">Ready · 14% CPU</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white/90 px-3.5 py-2.5 text-xs shadow-2xs">
                      <span className="flex items-center gap-2 font-bold text-black">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        ip-10-0-2-14.ec2.internal
                      </span>
                      <span className="text-[11px] text-gray-600">Ready · 22% CPU</span>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>

            {/* 3. Logs and Monitoring */}
            <Reveal index={3}>
              <article id="observability" className="editorial-card flex h-full flex-col p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-black shadow-xs">
                    <Terminal className="h-5 w-5 text-amber-500" />
                  </span>
                  <span className="editorial-tag-chip">[ 03 // LOKI & PROMETHEUS ]</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-black">
                  Logs &amp; Monitoring
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  Stream high-frequency stdout and stderr logs via Loki with sub-second latency. Search across projects with level
                  filters, inspect Prometheus uptime probes, and correlate spike trends during active incidents.
                </p>

                {/* Live Log Stream Preview */}
                <div className="mt-8 rounded-2xl bg-[#1F1F24] border border-[#3A322C] p-4.5 font-tech-mono text-[11px] text-[#D8D8DC] shadow-lg">
                  <div className="flex items-center justify-between text-[10px] text-[#C8C8CC] mb-2.5 border-b border-[#3A322C] pb-2">
                    <span className="flex items-center gap-1.5 text-[#FFC107]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FFC107] animate-pulse" />
                      LIVE BUFFER STREAMING
                    </span>
                    <span>LOKI // DEFAULT</span>
                  </div>
                  <div className="space-y-1.5 text-[#C8C8CC]">
                    <p><span className="text-[#8E8E98]">14:02:18</span> <span className="text-[#F5D061]">INFO</span> [core-service] HTTP 200 GET /api/v1/health (12ms)</p>
                    <p><span className="text-[#8E8E98]">14:02:19</span> <span className="text-[#F5D061]">INFO</span> [ci-cd] Webhook received from github.com/opspilot</p>
                    <p><span className="text-[#8E8E98]">14:02:21</span> <span className="text-[#FFC107] font-bold">WARN</span> [k8s-agent] Memory usage reached 74% limit</p>
                  </div>
                </div>
              </article>
            </Reveal>

            {/* 4. Operational Insights & Governance */}
            <Reveal index={4}>
              <article className="editorial-card flex h-full flex-col p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-black shadow-xs">
                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                  </span>
                  <span className="editorial-tag-chip">[ 04 // AUDIT & RBAC ]</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-black">
                  Operational Insights
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  Maintain complete auditability with tracked operator actions, login sessions, project deletions, and RBAC role
                  enforcements (DEVELOPER, DEVOPS, ADMIN). Surface actionable diagnosis without hallucinated metrics.
                </p>

                {/* Audit Event Preview */}
                <div className="mt-8 rounded-2xl bg-black/5 p-4.5 font-tech-mono">
                  <div className="flex items-center justify-between text-[11px] text-gray-700 mb-3">
                    <span className="font-semibold tracking-wide">SECURITY &amp; AUDIT LOG</span>
                    <span className="text-black font-bold">ROLE: ADMIN</span>
                  </div>
                  <div className="rounded-lg bg-white/90 p-3.5 text-xs shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-black mb-1">
                      <span>USER_LOGIN // SUCCESS</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">VERIFIED JWT</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-normal">
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
        <section id="product-preview" className="landing-product-story relative isolate overflow-hidden px-6 py-24 sm:px-8 sm:py-32 lg:px-12">
          <div className="story-orbit pointer-events-none absolute -right-40 top-1/2 -z-10 h-[42rem] w-[42rem] -translate-y-1/2 rounded-full" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1.5 font-tech-mono text-[11px] font-bold uppercase tracking-wider text-[#FFC107]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFC107]" />
                One connected platform
              </div>
              <h2 className="mt-6 max-w-xl text-4xl font-black leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Clarity from commit <span className="font-editorial-italic font-normal text-[#F5D061]">to runtime.</span>
              </h2>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[#D8D8DC] sm:text-lg">
                OpsPilot brings delivery, infrastructure, and operational signals together, so your team can move from a change to its impact with less guesswork.
              </p>
              <button
                type="button"
                onClick={() => go('/signup')}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FFC107] px-6 py-3.5 font-tech-mono text-xs font-bold text-[#1A1A1A] shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-[#F5D061] cursor-pointer"
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
                  <article className="story-card h-full rounded-2xl p-6 transition duration-300 sm:p-7">
                    <div className="flex items-center justify-between">
                      <Icon className="story-card-icon h-5 w-5" aria-hidden="true" />
                      <span className="font-tech-mono text-[10px] font-bold tracking-[0.18em] text-[#C8C8CC]">{number}</span>
                    </div>
                    <h3 className="mt-8 text-lg font-bold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#D8D8DC]">{detail}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            OPERATIONAL WORKFLOW TIMELINE (STUDIO STYLE)
           ========================================================================= */}
        <section id="workflow" className="landing-workflow border-t border-white/20 py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-12">
            <Reveal>
              <Eyebrow>Shorter Path To Resolution</Eyebrow>
              <h2 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight text-black sm:text-5xl">
                From repository commit to <br className="hidden sm:inline" />
                reliable runtime<span className="text-amber-500">.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-gray-800">
                Stop jumping across disconnected terminals, consoles, and cloud dashboards. OpsPilot connects delivery context
                to runtime diagnostics in a unified workflow.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3.5 font-tech-mono text-xs font-bold text-white shadow-md transition-all duration-300 hover:bg-gray-800 hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="inline-flex items-center gap-2 rounded-full border border-black/30 bg-white/70 backdrop-blur-md px-5 py-3 font-tech-mono text-xs font-bold text-black transition-all duration-300 hover:border-black cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </Reveal>

            <div className="relative pl-9">
              {/* Timeline Signal Rail with travelling pulse */}
              <div className="pointer-events-none absolute top-10 bottom-10 left-[11px] w-0.5 rounded-full bg-black/20" aria-hidden="true">
                <span className="workflow-rail-dot absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]" />
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
                    <div className="group relative flex gap-5 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-black hover:shadow-md">
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 -left-[31px] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-[3px] border-white bg-gray-400 transition-all duration-300 group-hover:bg-amber-500 group-hover:scale-125"
                      />
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black font-tech-mono text-sm font-black text-white shadow-xs transition-all duration-300 group-hover:bg-amber-500 group-hover:text-black">
                        {number}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-black">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">{description}</p>
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
        <section className="landing-final-cta px-6 pb-24 pt-12 sm:px-8 lg:px-12 lg:pb-32">
          <Reveal onReveal={() => setMascotHop((n) => n + 1)} className="relative mx-auto max-w-7xl">
            <AuthMascot gaze={null} cover="none" mood={ctaHover ? 'happy' : 'idle'} hopKey={mascotHop} />
            <div className="relative z-10 overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-b from-white/80 to-white/50 backdrop-blur-xl px-8 py-16 text-center shadow-lg transition-all duration-500 hover:shadow-2xl sm:px-16 sm:py-20">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-amber-300/30 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/10 px-3.5 py-1.5 font-tech-mono text-[11px] font-bold uppercase tracking-wider text-[#FFC107]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FFC107] shadow-[0_0_8px_rgba(255,193,7,0.8)]" />
                  Start in Minutes
                </div>
                <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Take command of your developer platform today<span className="text-[#FFC107]">.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#D8D8DC]">
                  Connect your first project and discover what happens when deployments, clusters, and logs share one unified
                  workspace.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => go('/signup')}
                    onMouseEnter={() => setCtaHover(true)}
                    onMouseLeave={() => setCtaHover(false)}
                    className="inline-flex items-center gap-2.5 rounded-full bg-black px-8 py-4 font-tech-mono text-xs font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-gray-800 hover:shadow-xl cursor-pointer"
                  >
                    <span>Create Free Workspace</span>
                    <ArrowRight className="h-4 w-4 text-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go('/login')}
                    className="inline-flex items-center gap-2 rounded-full border border-black/30 bg-white/70 backdrop-blur-md px-7 py-3.5 font-tech-mono text-xs font-bold text-black transition-all duration-300 hover:border-black cursor-pointer"
                  >
                    <span>Sign In</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-500" />
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
      <footer className="border-t border-white/20 bg-black/15 backdrop-blur-xl text-black">
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
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-800">
                  The internal developer platform engineered for high-velocity teams. Unifying deployments, infrastructure,
                  and live observability into a single command plane.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 backdrop-blur-md px-3.5 py-1.5 font-tech-mono text-xs font-medium text-gray-800 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
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
              <ul className="mt-4 space-y-3 font-tech-mono text-xs text-gray-700">
                <li><a href="#deployments" className="hover:text-black transition-colors">Deployments</a></li>
                <li><a href="#infrastructure" className="hover:text-black transition-colors">Kubernetes</a></li>
                <li><a href="#observability" className="hover:text-black transition-colors">Loki &amp; Logs</a></li>
                <li><a href="#product-preview" className="hover:text-black transition-colors">Audit Trails</a></li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-3 lg:col-span-2">
              <h3 className="font-tech-mono text-xs font-bold uppercase tracking-wider text-black">
                Platform
              </h3>
              <ul className="mt-4 space-y-3 font-tech-mono text-xs text-gray-700">
                <li><a href="#platform" className="hover:text-black transition-colors">Architecture</a></li>
                <li><a href="#workflow" className="hover:text-black transition-colors">Workflows</a></li>
                <li><a href="#integrations" className="hover:text-black transition-colors">Integrations</a></li>
                <li>
                  <a
                    href="https://opspilot.jestin16.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-black transition-colors"
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
              <p className="mt-4 text-xs leading-relaxed text-gray-700">
                Ready to explore the internal developer platform?
              </p>
              <div className="mt-4 flex items-center gap-3 font-tech-mono text-xs">
                <button
                  type="button"
                  onClick={() => go('/signup')}
                  className="rounded-full bg-black px-5 py-2 font-bold text-white transition hover:bg-gray-800 cursor-pointer"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => go('/login')}
                  className="rounded-full border border-black/30 bg-white/70 backdrop-blur-md px-5 py-2 font-bold text-black transition hover:border-black cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Legal Line */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 font-tech-mono text-xs text-gray-600 sm:flex-row">
            <span>&copy; 2026 OpsPilot. Built for dependable delivery.</span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-gray-700">
              <a href="#platform" className="hover:text-black transition-colors">Platform</a>
              <a href="#workflow" className="hover:text-black transition-colors">Workflow</a>
              <a href="#integrations" className="hover:text-black transition-colors">Integrations</a>
              <a href="https://opspilot.jestin16.dev" target="_blank" rel="noreferrer" className="hover:text-black transition-colors">Live App</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
