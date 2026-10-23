import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  color: string;
}

interface SignalPulse {
  pathIndex: number;
  t: number;
  speed: number;
  size: number;
  alpha: number;
}

export const HeroParticleCanvas: React.FC<{ activeState?: number }> = ({ activeState = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Champagne gold & warm amber palette
    const colors = [
      'rgba(245, 206, 122, ',
      'rgba(255, 225, 150, ',
      'rgba(230, 157, 72, ',
      'rgba(255, 243, 196, ',
    ];

    // Generate floating ambient particles around the central conduits
    const particleCount = 42;
    const particles: Particle[] = [];

    const centerX = width * 0.5;
    const centerY = height * 0.58;

    for (let i = 0; i < particleCount; i++) {
      // Concentrate near center-lower region where the conduit tips glow
      const spreadX = (Math.random() - 0.5) * (width * 0.45);
      const spreadY = (Math.random() - 0.5) * (height * 0.55);
      const baseAlpha = 0.25 + Math.random() * 0.65;
      const baseRadius = 0.8 + Math.random() * 2.2;

      particles.push({
        x: centerX + spreadX,
        y: centerY + spreadY,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.15 - Math.random() * 0.45, // gentle upward drift
        radius: baseRadius,
        baseRadius,
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: 0.02 + Math.random() * 0.04,
        pulsePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Conduit spline paths for state 0 (vertical cascading conduit endpoints)
    const splinePaths: Array<Array<{ x: number; y: number }>> = [
      [
        { x: width * 0.5, y: height * 0.1 },
        { x: width * 0.48, y: height * 0.35 },
        { x: width * 0.47, y: height * 0.62 },
        { x: width * 0.46, y: height * 0.72 },
      ],
      [
        { x: width * 0.51, y: height * 0.08 },
        { x: width * 0.52, y: height * 0.32 },
        { x: width * 0.51, y: height * 0.58 },
        { x: width * 0.52, y: height * 0.74 },
      ],
      [
        { x: width * 0.49, y: height * 0.12 },
        { x: width * 0.46, y: height * 0.4 },
        { x: width * 0.48, y: height * 0.65 },
        { x: width * 0.49, y: height * 0.76 },
      ],
      [
        { x: width * 0.52, y: height * 0.14 },
        { x: width * 0.54, y: height * 0.38 },
        { x: width * 0.53, y: height * 0.63 },
        { x: width * 0.54, y: height * 0.73 },
      ],
    ];

    // Pulses traveling down conduits
    const pulses: SignalPulse[] = [
      { pathIndex: 0, t: 0.1, speed: 0.004, size: 2.2, alpha: 0.9 },
      { pathIndex: 1, t: 0.45, speed: 0.005, size: 2.6, alpha: 0.85 },
      { pathIndex: 2, t: 0.75, speed: 0.0035, size: 2.0, alpha: 0.75 },
      { pathIndex: 3, t: 0.2, speed: 0.0045, size: 2.4, alpha: 0.95 },
    ];

    // Helper: evaluate cubic Bezier spline
    function getBezierPoint(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, t: number) {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      return {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
      };
    }

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing telemetry pulses along conduit splines
      if (!prefersReducedMotion && activeState === 0) {
        for (const pulse of pulses) {
          pulse.t += pulse.speed;
          if (pulse.t > 1) {
            pulse.t = 0;
            pulse.pathIndex = Math.floor(Math.random() * splinePaths.length);
          }

          const path = splinePaths[pulse.pathIndex];
          if (path && path.length >= 4) {
            const pt = getBezierPoint(path[0], path[1], path[2], path[3], pulse.t);

            // Draw radial glow for pulse
            const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pulse.size * 5);
            glow.addColorStop(0, `rgba(255, 235, 180, ${pulse.alpha})`);
            glow.addColorStop(0.3, `rgba(230, 157, 72, ${pulse.alpha * 0.5})`);
            glow.addColorStop(1, 'rgba(230, 157, 72, 0)');

            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pulse.size * 5, 0, Math.PI * 2);
            ctx.fill();

            // Core bright point
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse.alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pulse.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2. Draw floating champagne gold particles
      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulsePhase += p.pulseSpeed;

          // Wrap around with gentle boundary reset
          if (p.y < height * 0.15) {
            p.y = height * 0.82;
            p.x = width * 0.5 + (Math.random() - 0.5) * (width * 0.4);
          }
          if (p.x < width * 0.2) p.x = width * 0.8;
          if (p.x > width * 0.8) p.x = width * 0.2;
        }

        const currentAlpha = Math.max(0.05, p.baseAlpha + Math.sin(p.pulsePhase) * 0.25);
        const currentRadius = p.baseRadius * (1 + Math.sin(p.pulsePhase) * 0.15);

        // Soft halo
        const haloGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius * 3.5);
        haloGradient.addColorStop(0, `${p.color}${currentAlpha})`);
        haloGradient.addColorStop(0.5, `${p.color}${currentAlpha * 0.3})`);
        haloGradient.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Particle core
        ctx.fillStyle = `rgba(255, 255, 245, ${currentAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [activeState]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ mixBlendMode: 'screen', zIndex: 3 }}
      aria-hidden="true"
    />
  );
};
