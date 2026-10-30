import { Activity, ArrowDown, ArrowUpRight, Check, GitBranch, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/hero.css';

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="op-hero" aria-labelledby="op-hero-title">
      <div className="op-hero-inner">
        <div className="op-hero-split">
          <div className="op-hero-intro">
            <p className="op-hero-eyebrow"><span aria-hidden="true" /> YOUR OPERATIONS, SIMPLIFIED</p>
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

          <figure className="op-flow" aria-labelledby="op-flow-caption">
            <div className="op-flow-label"><span /> FROM CODE TO CLARITY</div>
            <ol className="op-flow-steps">
              <li className="op-flow-step op-flow-commit">
                <div className="op-flow-marker" aria-hidden="true"><GitBranch size={16} strokeWidth={1.5} /></div>
                <div className="op-flow-card">
                  <div className="op-flow-card-heading"><span>01 / COMMIT</span><GitBranch size={13} strokeWidth={1.5} /></div>
                  <strong>A new idea, pushed.</strong>
                  <div className="op-flow-meta"><span className="op-flow-tag">main</span><span>feat: improve checkout</span></div>
                </div>
              </li>
              <li className="op-flow-step op-flow-deploy">
                <div className="op-flow-marker" aria-hidden="true"><Layers size={16} strokeWidth={1.5} /></div>
                <div className="op-flow-card">
                  <div className="op-flow-card-heading"><span>02 / DEPLOY</span><span className="op-flow-check"><Check size={12} /> Ready</span></div>
                  <strong>From branch to production.</strong>
                  <div className="op-flow-pipeline" aria-hidden="true">
                    <span><Check size={11} /> Build</span><i /><span><Check size={11} /> Verify</span><i /><span><Check size={11} /> Release</span>
                  </div>
                </div>
              </li>
              <li className="op-flow-step op-flow-monitor">
                <div className="op-flow-marker" aria-hidden="true"><Activity size={16} strokeWidth={1.5} /></div>
                <div className="op-flow-card">
                  <div className="op-flow-card-heading"><span>03 / OBSERVE</span><span className="op-flow-status"><span /> Healthy</span></div>
                  <strong>Every signal in sight.</strong>
                  <div className="op-flow-telemetry">
                    <span>Logs. Metrics. Context.</span>
                    <svg viewBox="0 0 160 32" fill="none" aria-hidden="true">
                      <path d="M0 26H160" stroke="#edf0ee" />
                      <path className="op-flow-sparkline" pathLength="1" d="M1 21L13 21L20 17L29 19L37 18L45 23L53 20L61 20L68 7L75 25L82 18L93 19L103 16L112 19L122 16L132 18L143 15L159 16" stroke="#8da99a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </li>
            </ol>
            <figcaption id="op-flow-caption">From first commit to a healthy release.</figcaption>
          </figure>
        </div>

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
