import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import '../styles/hero-signal-map.css';

const signalPaths = [
  'M64 56 C184 56 180 168 302 168',
  'M36 94 C174 94 188 168 302 168',
  'M80 132 C188 132 202 168 302 168',
  'M24 168 H302',
  'M80 204 C188 204 202 168 302 168',
  'M36 242 C174 242 188 168 302 168',
  'M64 280 C184 280 180 168 302 168',
];

/** A decorative illustration of scattered signals becoming one clear view. */
export function HeroSignalMap() {
  const [paused, setPaused] = useState(false);

  return (
    <figure className={`op-signal-map${paused ? ' is-paused' : ''}`} aria-label="Scattered operational signals come together in OpsPilot">
      <div className="op-signal-art" aria-hidden="true">
        <svg className="op-signal-lines" viewBox="0 0 520 336" fill="none">
          <defs>
            <linearGradient id="op-signal-ink" x1="24" y1="0" x2="302" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a8afa5" stopOpacity="0.08" />
              <stop offset="0.55" stopColor="#929f8f" stopOpacity="0.45" />
              <stop offset="1" stopColor="#71836d" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="op-signal-out" x1="332" y1="0" x2="494" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#71836d" />
              <stop offset="1" stopColor="#71836d" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <g stroke="url(#op-signal-ink)" strokeWidth="1">
            {signalPaths.map(path => <path key={path} d={path} />)}
          </g>
          <g className="op-signal-traces" stroke="#81917a" strokeWidth="1.5" strokeLinecap="round">
            {signalPaths.filter((_, index) => index % 2 === 1).map((path, index) => (
              <path key={path} d={path} pathLength="100" style={{ animationDelay: `${index * -2}s` }} />
            ))}
          </g>
          <path d="M332 168 H477" stroke="url(#op-signal-out)" />
          <path className="op-signal-resolved" d="M332 168 H477" pathLength="100" stroke="#71836d" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="485" cy="168" r="9" fill="#edf0e8" stroke="#b5c0ae" strokeWidth="0.8" />
          <path d="M481 168L484 171L489 165" stroke="#71836d" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <g className="op-signal-labels">
            <text x="42" y="83">Deployments</text>
            <text x="30" y="157">Infrastructure</text>
            <text x="42" y="266">Logs &amp; signals</text>
          </g>
          <g transform="translate(294 144)">
            <rect x="0.5" y="0.5" width="47" height="47" rx="13" fill="#30392f" stroke="#45523f" />
            <path d="M13 34L24 13V27L17 34H13Z" fill="#f5f4f0" />
            <path d="M35 34L24 13V27L31 34H35Z" fill="#a3b69a" />
            <circle cx="24" cy="27" r="2" fill="#f5f4f0" />
          </g>
          <text className="op-signal-brand" x="318" y="215" textAnchor="middle">OpsPilot</text>
        </svg>
      </div>
      <figcaption className="op-signal-caption">
        <span>A little less complexity. A lot more clarity.</span>
        <button type="button" className="op-map-motion" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play illustration animation' : 'Pause illustration animation'} aria-pressed={paused}>
          {paused ? <Play size={12} strokeWidth={1.5} /> : <Pause size={12} strokeWidth={1.5} />}
        </button>
      </figcaption>
    </figure>
  );
}
