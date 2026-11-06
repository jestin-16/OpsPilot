import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { createHeroFrame } from '../lib/heroAscii';
import '../styles/hero-ascii.css';

const STILL_FRAME = createHeroFrame(0);

export function HeroAscii() {
  const figureRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLPreElement>(null);
  const elapsedRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const figure = figureRef.current;
    const art = artRef.current;
    if (!figure || !art) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    let frame = 0;
    let previous = 0;

    const draw = (now: number) => {
      if (now - previous >= 1000 / 24) {
        elapsedRef.current += previous ? Math.min(now - previous, 100) / 1000 : 0;
        previous = now;
        const pointer = pointerRef.current;
        pointer.currentX += (pointer.x - pointer.currentX) * 0.08;
        pointer.currentY += (pointer.y - pointer.currentY) * 0.08;
        art.textContent = createHeroFrame(elapsedRef.current, pointer.currentX, pointer.currentY);
      }
      frame = requestAnimationFrame(draw);
    };

    const syncPlayback = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!paused && !motion.matches && visible && !document.hidden) {
        frame = requestAnimationFrame(draw);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(figure);
    motion.addEventListener('change', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    syncPlayback();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener('change', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
    };
  }, [paused]);

  return (
    <figure ref={figureRef} className="op-ascii" aria-label="An animated ASCII OpsPilot emblem with orbiting infrastructure and flowing signals">
      <div className="op-ascii-heading" aria-hidden="true">
        <span><span className="op-ascii-dot" /> THE CONTROL PLANE</span>
        <span>FIG. 001</span>
      </div>
      <div
        className="op-ascii-art"
        aria-hidden="true"
        onPointerMove={event => {
          if (event.pointerType !== 'mouse') return;
          const bounds = event.currentTarget.getBoundingClientRect();
          pointerRef.current.x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
          pointerRef.current.y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
        }}
        onPointerLeave={() => { pointerRef.current.x = 0; pointerRef.current.y = 0; }}
      >
        <pre ref={artRef} className="op-ascii-grid">{STILL_FRAME}</pre>
        <span className="op-ascii-axis op-ascii-axis-top">+</span>
        <span className="op-ascii-axis op-ascii-axis-bottom">+</span>
        <span className="op-ascii-side-label">SIGNALS IN</span>
        <span className="op-ascii-side-label op-ascii-side-label-right">CLARITY OUT</span>
      </div>
      <figcaption className="op-ascii-caption">
        <div className="op-ascii-legend">
          <span><i aria-hidden="true">01</i> Deploy</span>
          <span><i aria-hidden="true">02</i> Observe</span>
          <span><i aria-hidden="true">03</i> Resolve</span>
        </div>
        <button
          type="button"
          className="op-ascii-motion"
          onClick={() => setPaused(value => !value)}
          aria-label={paused ? 'Play ASCII animation' : 'Pause ASCII animation'}
          aria-pressed={paused}
        >
          {paused ? <Play size={12} strokeWidth={1.5} /> : <Pause size={12} strokeWidth={1.5} />}
        </button>
      </figcaption>
    </figure>
  );
}
