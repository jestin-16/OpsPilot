import { useEffect, useRef, useState } from 'react';
import { Activity, Box, GitBranch, Pause, Play } from 'lucide-react';
import { OpsPilotMark } from './OpsPilotLogo';

const ORBITS = [
  'M75 270a225 106 0 1 0 450 0a225 106 0 1 0-450 0',
  'M75 270a225 106 0 1 0 450 0a225 106 0 1 0-450 0',
  'M75 270a225 106 0 1 0 450 0a225 106 0 1 0-450 0',
];

/** Decorative workflow illustration; does not represent live service data. */
export function HeroOrbit() {
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const figureRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const figure = figureRef.current;
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
      : null;
    if (figure) observer?.observe(figure);
    const updateVisibility = () => setTabVisible(!document.hidden);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  return (
    <figure ref={figureRef} data-motion data-motion-order="1" className={`op-orbit${paused || !visible || !tabVisible ? ' is-paused' : ''}`} aria-label="Animated illustration connecting code, deployments, and monitoring through OpsPilot">
      <div className="op-orbit-art" aria-hidden="true">
        <div className="op-orbit-grid" />
        <svg className="op-orbit-paths" viewBox="0 0 600 540" fill="none">
          <circle cx="300" cy="270" r="232" stroke="#ededed" strokeDasharray="2 7" />
          <path d="M300 16V33M300 507V524M46 270H63M537 270H554" stroke="#c7c7c7" />
          {ORBITS.map((path, index) => (
            <g key={index} transform={`rotate(${index * 60 - 30} 300 270)`}>
              <path d={path} stroke={index === 1 ? '#bababa' : '#d8d8d8'} strokeWidth="1" />
              <path className="op-orbit-tracer" d={path} pathLength="100" stroke="#111" strokeWidth="2" strokeLinecap="round" style={{ animationDelay: `${index * -4}s` }} />
              <path className="op-orbit-particle" d={path} pathLength="100" stroke="#111" strokeWidth="7" strokeLinecap="round" style={{ animationDelay: `${index * -4}s` }} />
            </g>
          ))}
          <circle cx="300" cy="270" r="88" stroke="#eaeaea" />
          <circle cx="300" cy="270" r="65" stroke="#f0f0f0" />
        </svg>
        <div className="op-orbit-core">
          <div className="op-orbit-core-back" />
          <div className="op-orbit-core-face">
            <OpsPilotMark size={52} color="#ffffff" />
          </div>
          <span>OpsPilot</span>
        </div>
        <div className="op-orbit-node op-orbit-code">
          <span className="op-orbit-node-icon"><GitBranch size={20} strokeWidth={1.5} /></span>
          <div><span className="op-orbit-node-label">01 / SOURCE</span><strong>Push your code</strong></div>
          <span className="op-orbit-node-dot" />
        </div>
        <div className="op-orbit-node op-orbit-deploy">
          <span className="op-orbit-node-icon"><Box size={20} strokeWidth={1.5} /></span>
          <div><span className="op-orbit-node-label">02 / DEPLOY</span><strong>Ship with clarity</strong></div>
          <span className="op-orbit-node-dot" />
        </div>
        <div className="op-orbit-node op-orbit-observe">
          <span className="op-orbit-node-icon"><Activity size={20} strokeWidth={1.5} /></span>
          <div><span className="op-orbit-node-label">03 / OBSERVE</span><strong>See the full picture</strong></div>
          <div className="op-orbit-wave"><i /><i /><i /><i /><i /></div>
        </div>
        <span className="op-orbit-side-note">EVERY SIGNAL. ONE PLACE.</span>
      </div>
      <figcaption className="op-orbit-caption">
        <span><span className="op-orbit-caption-dot" /> Your stack, working together.</span>
        <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? 'Play illustration animation' : 'Pause illustration animation'}>
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
        </button>
      </figcaption>
    </figure>
  );
}
