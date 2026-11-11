import { useEffect, type RefObject } from 'react';

/** One observer for small, once-only entrances. Content stays visible without animation. */
export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const running = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches) continue;
        const order = Number((entry.target as HTMLElement).dataset.motionOrder ?? 0);
        const animation = entry.target.animate(
          [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 650, delay: Math.min(order, 3) * 70, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' },
        );
        running.add(animation);
        animation.onfinish = () => running.delete(animation);
      }
    }, { threshold: 0.08 });
    root.querySelectorAll('[data-motion]').forEach(element => observer.observe(element));
    const stopMotion = () => {
      if (!preference.matches) return;
      running.forEach(animation => animation.cancel());
      running.clear();
    };
    preference.addEventListener('change', stopMotion);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', stopMotion);
      running.forEach(animation => animation.cancel());
    };
  }, [rootRef]);
}
