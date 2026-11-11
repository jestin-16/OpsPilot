import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, ArrowUpRight } from 'lucide-react';
import { OpsPilotLogo } from './OpsPilotLogo';
import '../styles/landing-footer.css';

export function LandingFooter() {
  return (
    <footer className="op-footer">
      <div className="op-footer-container">
        <div className="op-footer-main" data-motion>
          <div className="op-footer-brand">
            <a href="#home" className="op-footer-logo" aria-label="OpsPilot home">
              <OpsPilotLogo size={30} showWordmark />
            </a>
            <p className="op-footer-statement">A clearer view.<br />A calmer workflow.</p>
            <p className="op-footer-description">Your deployments, infrastructure, and logs.<br />Connected in one place.</p>
          </div>

          <nav className="op-footer-links" aria-labelledby="footer-platform-heading">
            <h2 id="footer-platform-heading">Explore</h2>
            <a href="#architecture">How it connects <ArrowUpRight size={14} aria-hidden="true" /></a>
            <a href="#platform">The platform <ArrowUpRight size={14} aria-hidden="true" /></a>
            <a href="#observability">Observability <ArrowUpRight size={14} aria-hidden="true" /></a>
          </nav>

          <nav className="op-footer-links" aria-labelledby="footer-workspace-heading">
            <h2 id="footer-workspace-heading">Your workspace</h2>
            <Link to="/dashboard">Launch console <ArrowUpRight size={14} aria-hidden="true" /></Link>
            <Link to="/login">Sign in <ArrowUpRight size={14} aria-hidden="true" /></Link>
            <Link to="/signup" className="op-footer-start">Get started <ArrowRight size={14} aria-hidden="true" /></Link>
          </nav>
        </div>

        <div className="op-footer-signature" aria-hidden="true">
          <span>OpsPilot</span>
          <p>FROM COMMIT<br />TO RUNTIME.</p>
        </div>

        <div className="op-footer-bottom">
          <span>&copy; {new Date().getFullYear()} OpsPilot</span>
          <p>Built for the people behind production.</p>
          <a href="#home" className="op-footer-top">Back to top <span><ArrowUp size={15} aria-hidden="true" /></span></a>
        </div>
      </div>
    </footer>
  );
}
