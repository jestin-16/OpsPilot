import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { CHAPTER_SECONDS, HERO_CHAPTERS, createHeroRenderer, heroChapterAt } from '../lib/heroAscii';
import '../styles/hero-ascii.css';

export function HeroAscii() {
  const [renderer] = useState(createHeroRenderer);
  const [stillFrame] = useState(() => renderer.render(0));
  const figureRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLPreElement>(null);
  const elapsedRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });
  const [paused, setPaused] = useState(false);
  const [chapter, setChapter] = useState(0);
  const chapterRef = useRef(0);

  const selectChapter = (index: number) => {
    elapsedRef.current = index * CHAPTER_SECONDS + 0.75;
    chapterRef.current = index;
    setChapter(index);
    if (artRef.current) artRef.current.textContent = renderer.render(elapsedRef.current);
    figureRef.current?.style.setProperty('--chapter-progress', String(0.75 / CHAPTER_SECONDS));
  };

  useEffect(() => {
    const figure = figureRef.current;
    const art = artRef.current;
    if (!figure || !art) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compact = window.matchMedia('(max-width: 600px)');
    let visible = true;
    let frame = 0;
    let previous = 0;
    let lastDraw = 0;
    let averageCost = 0;

    const draw = (now: number) => {
      const fps = averageCost > 12 ? 15 : averageCost > 6 ? 20 : compact.matches ? 24 : 30;
      const interval = 1000 / fps;
      if (now - lastDraw >= interval - 0.5) {
        elapsedRef.current += previous ? Math.min(now - previous, 100) / 1000 : 0;
        previous = now;
        lastDraw = now - Math.max(0, (now - lastDraw) % interval);
        const pointer = pointerRef.current;
        pointer.currentX += (pointer.x - pointer.currentX) * 0.08;
        pointer.currentY += (pointer.y - pointer.currentY) * 0.08;
        const start = performance.now();
        art.textContent = renderer.render(elapsedRef.current, pointer.currentX, pointer.currentY);
        averageCost = averageCost * 0.9 + (performance.now() - start) * 0.1;
        figure.style.setProperty('--chapter-progress', ((elapsedRef.current % CHAPTER_SECONDS) / CHAPTER_SECONDS).toFixed(3));
        const nextChapter = heroChapterAt(elapsedRef.current);
        if (chapterRef.current !== nextChapter) {
          chapterRef.current = nextChapter;
          setChapter(nextChapter);
        }
      }
      frame = requestAnimationFrame(draw);
    };

    const syncPlayback = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      lastDraw = 0;
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
  }, [paused, renderer]);

  return (
    <figure ref={figureRef} className="op-ascii" aria-label="An animated ASCII journey from connected sources to correlated operational signals" aria-describedby="op-ascii-description">
      <div className="op-ascii-heading" aria-hidden="true">
        <span><span className="op-ascii-dot" /> ONE PROJECT. EVERY SIGNAL.</span>
        <span>0{chapter + 1} / 03</span>
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
        <pre ref={artRef} className="op-ascii-grid">{stillFrame}</pre>
        <span className="op-ascii-axis op-ascii-axis-top">+</span>
        <span className="op-ascii-axis op-ascii-axis-bottom">+</span>
        <span className="op-ascii-side-label">SIGNALS IN</span>
        <span className="op-ascii-side-label op-ascii-side-label-right">CLARITY OUT</span>
      </div>
      <div className="op-ascii-sources" aria-label="Illustrated integrations">
        <span>GitHub</span><span>CI/CD</span><span>Docker</span><span>Kubernetes</span><span>App logs</span>
      </div>
      <figcaption className="op-ascii-caption">
        <div className="op-ascii-legend" role="group" aria-label="Explore the animation chapters">
          {HERO_CHAPTERS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={chapter === index ? 'is-active' : ''}
              aria-pressed={chapter === index}
              onClick={() => selectChapter(index)}
            >
              <i aria-hidden="true">0{index + 1}</i>{item.label}
            </button>
          ))}
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
        <p id="op-ascii-description">{HERO_CHAPTERS[chapter].description}</p>
      </figcaption>
    </figure>
  );
}
