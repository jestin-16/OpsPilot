import React from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SignalNetworkAnimation } from './SignalNetworkAnimation';
import '../styles/hero.css';

export function LandingHero() {
  const navigate = useNavigate();
  return (
    <section className="op-hero" aria-labelledby="op-hero-title">
      <div className="op-hero-inner">
        <div className="op-hero-split">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="op-hero-intro">
            <div className="op-hero-brand-wrap">
              <p className="op-hero-eyebrow"><span aria-hidden="true" /> YOUR OPERATIONS, IN SYNC</p>
            </div>
            <h1 id="op-hero-title">
              <span className="op-title-line"><span>Less noise.</span></span>
              <span className="op-title-line op-title-accent"><span>More clarity.</span></span>
            </h1>
            <p className="op-hero-description">
              One clear view of your deployments, infrastructure, and logs.
              {' '}Find your signal. Keep your team moving.
            </p>
            <div className="op-hero-actions">
              <button type="button" className="op-hero-primary" onClick={() => navigate('/signup')}>
                Get started <ArrowUpRight size={17} strokeWidth={1.6} />
              </button>
              <a className="op-hero-secondary" href="#platform">
                Discover OpsPilot <ArrowDown size={15} strokeWidth={1.5} />
              </a>
            </div>
            <p className="op-hero-note">Built around your stack. Designed for your focus.</p>
          </div>

          <SignalNetworkAnimation />
        </div>

        {/* Hero Footer */}
        <div className="op-hero-footer">
          <div className="op-hero-rule" aria-hidden="true" />
          <p>Built to fit your workflow.</p>
          <ul className="op-hero-tools" aria-label="Supported tools">
            <li>GitHub</li>
            <li>Docker</li>
            <li>Kubernetes</li>
            <li>Grafana Loki</li>
          </ul>
          <span className="op-hero-footnote">Your tools. One workspace.</span>
        </div>
      </div>
    </section>
  );
}
