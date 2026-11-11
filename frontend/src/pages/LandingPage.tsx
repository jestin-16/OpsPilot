import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, ArrowDown, ArrowRight, ArrowUpRight, Box, GitBranch, Menu, Server, Terminal, X } from 'lucide-react';
import { LandingHero } from '../components/LandingHero';
import { LandingFooter } from '../components/LandingFooter';
import { PlatformSection } from '../components/PlatformSection';
import { ObservabilitySection } from '../components/ObservabilitySection';
import { OpsPilotLogo, OpsPilotMark } from '../components/OpsPilotLogo';
import { useLandingMotion } from '../hooks/useLandingMotion';
import '../styles/landing.css';
import '../styles/landing-composition.css';

const NAV_ITEMS = [
  { label: 'How it works', href: '#architecture' },
  { label: 'Platform', href: '#platform' },
  { label: 'Observability', href: '#observability' },
];
const INTEGRATIONS = [
  { icon: GitBranch, label: 'GitHub' },
  { icon: Box, label: 'Docker' },
  { icon: Server, label: 'Kubernetes' },
  { icon: Activity, label: 'Prometheus' },
  { icon: Terminal, label: 'Grafana Loki' },
];
const WORKFLOW = [
  { icon: GitBranch, title: 'Connect your project.', description: 'Bring your repository, environment, and service owners into one workspace.', note: 'A shared starting point' },
  { icon: Box, title: 'Follow every release.', description: 'Keep your CI/CD workflow. Track what shipped, where it runs, and who changed it.', note: 'Your tools, connected' },
  { icon: Activity, title: 'See the full picture.', description: 'Explore service health and logs with the context of the releases behind them.', note: 'From change to understanding' },
];

export function LandingPage() {
  const { hash } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('#home');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useLandingMotion(rootRef);

  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 20);
      const current = [...NAV_ITEMS].reverse().find(({ href }) => {
        const section = document.getElementById(href.slice(1));
        return section && section.getBoundingClientRect().top <= window.innerHeight * 0.3;
      });
      setActiveSection(current?.href ?? '#home');
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [menuOpen]);

  return (
    <div ref={rootRef} id="home" className="landing-root landing-composed">
      <a className="landing-skip-link" href="#landing-main">Skip to content</a>
      <header className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <a href="#home" onClick={() => setMenuOpen(false)} className="landing-nav-brand" aria-label="OpsPilot home">
            <OpsPilotLogo size={27} variant="monochrome" /><span>OpsPilot</span>
          </a>
          <nav className="landing-nav-links" aria-label="Primary navigation">
            {NAV_ITEMS.map(item => <a key={item.href} href={item.href} aria-current={activeSection === item.href ? 'location' : undefined}><span>{item.label}</span></a>)}
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-nav-signin">Sign in</Link>
            <Link to="/dashboard" className="landing-nav-launch">Launch console <ArrowUpRight size={14} aria-hidden="true" /></Link>
            <button ref={menuButtonRef} type="button" className="landing-nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="landing-mobile-menu">
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menuOpen && <nav id="landing-mobile-menu" className="landing-mobile-menu" aria-label="Mobile navigation">
          {NAV_ITEMS.map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={activeSection === item.href ? 'location' : undefined}>{item.label}<ArrowUpRight size={14} aria-hidden="true" /></a>)}
          <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in <ArrowRight size={14} aria-hidden="true" /></Link>
        </nav>}
      </header>

      <main id="landing-main" tabIndex={-1}>
        <LandingHero />
        <div className="landing-container landing-hero-end" data-motion>
          <span>ONE WORKSPACE. YOUR ENTIRE WORKFLOW.</span>
          <a href="#architecture">See how it connects <ArrowDown size={14} aria-hidden="true" /></a>
        </div>

        <section className="landing-stack" aria-label="Supported tools">
          <div className="landing-container landing-stack-inner" data-motion>
            <p>Fits the way<br /><strong>you already work.</strong></p>
            <ul>{INTEGRATIONS.map(({ icon: Icon, label }) => <li key={label}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><span>{label}</span></li>)}</ul>
          </div>
        </section>

        <section id="architecture" className="landing-workflow" aria-labelledby="workflow-title">
          <div className="landing-container">
            <div className="landing-section-intro" data-motion>
              <div><p className="landing-section-index">01 / A CONNECTED WORKFLOW</p><h2 id="workflow-title">Less between you<br /><span>and your next release.</span></h2></div>
              <p>Keep the tools you trust.<br />Bring their context together.</p>
            </div>
            <ol className="landing-workflow-steps">
              {WORKFLOW.map(({ icon: Icon, title, description, note }, index) => (
                <li key={title} data-motion data-motion-order={index}>
                  <div className="landing-step-rail"><span>0{index + 1}</span><span className="landing-step-line" /><Icon size={22} strokeWidth={1.4} aria-hidden="true" /></div>
                  <h3>{title}</h3><p>{description}</p><span className="landing-step-note">{note}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <PlatformSection />
        <ObservabilitySection />

        <section className="landing-closing" aria-labelledby="closing-title">
          <div className="landing-container landing-closing-inner" data-motion>
            <div className="landing-closing-mark" aria-hidden="true"><OpsPilotMark size={32} /></div>
            <p className="landing-section-index">MAKE ROOM FOR WHAT'S NEXT</p>
            <h2 id="closing-title">Your stack.<br /><span>Finally, together.</span></h2>
            <p>Start with one project. Connect the tools behind it.<br />See what a little clarity can change.</p>
            <div className="landing-closing-actions">
              <Link to="/signup" className="op-hero-primary">Create your workspace <ArrowUpRight size={16} aria-hidden="true" /></Link>
              <Link to="/login" className="op-hero-secondary">Sign in <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
