import React from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OpsPilotLogo } from './OpsPilotLogo';
import { HeroSignalMap } from './HeroSignalMap';
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
              <OpsPilotLogo size={34} className="op-hero-logo" />
              <p className="op-hero-eyebrow"><span aria-hidden="true" /> YOUR OPERATIONS, SIMPLIFIED</p>
            </div>
            <h1 id="op-hero-title">
              <span className="op-title-line"><span>Less noise.</span></span>
              <span className="op-title-line op-title-accent"><span>More clarity.</span></span>
            </h1>
            <p className="op-hero-description">
              Bring your deployments, infrastructure, and logs together.
              {' '}A calmer way to see it all. A clearer way to move forward.
            </p>
            <div className="op-hero-actions">
              <button type="button" className="op-hero-primary" onClick={() => navigate('/signup')}>
                Get started <ArrowUpRight size={17} strokeWidth={1.6} />
              </button>
              <a className="op-hero-secondary" href="#platform">
                Discover OpsPilot <ArrowDown size={15} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <HeroSignalMap />
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
