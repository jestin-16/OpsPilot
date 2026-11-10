import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, GitBranch, Layers, Activity } from 'lucide-react';
import { HeroOrbit } from './HeroOrbit';
import '../styles/hero.css';

export function LandingHero() {
  return (
    <section className="op-hero-section" aria-labelledby="op-hero-title">
      <div className="op-hero-container">
        <div className="op-hero-intro">
          <p className="op-hero-eyebrow"><span aria-hidden="true" /> THE DEVELOPER CONTROL PLANE</p>
          <h1 id="op-hero-title" className="op-hero-headline">Less noise.<br />More control.</h1>
          <p className="op-hero-description">
            Your projects, deployments, and infrastructure.
            Connected in one place, so you can focus on what comes next.
          </p>
          <div className="op-hero-actions">
            <Link to="/signup" className="op-hero-primary">Get started <ArrowUpRight size={17} aria-hidden="true" /></Link>
            <a href="#platform" className="op-hero-secondary">Explore the platform <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          <div className="op-hero-workflow" aria-label="Connect, deploy, and observe">
            <span><GitBranch size={14} aria-hidden="true" /> Connect</span>
            <span className="op-hero-workflow-line" aria-hidden="true" />
            <span><Layers size={14} aria-hidden="true" /> Deploy</span>
            <span className="op-hero-workflow-line" aria-hidden="true" />
            <span><Activity size={14} aria-hidden="true" /> Observe</span>
          </div>
        </div>
        <HeroOrbit />
      </div>
    </section>
  );
}
