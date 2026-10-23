import React, { useEffect, useRef } from 'react';

export type MascotCover = 'none' | 'full' | 'peek';
export type MascotMood = 'idle' | 'happy' | 'oops';

interface AuthMascotProps {
  /** Horizontal look target in -1..1 while the user types in a field; null follows the pointer. */
  gaze: number | null;
  /** Paws over the eyes while a password is typed ('peek' when it is revealed). */
  cover: MascotCover;
  mood: MascotMood;
  /** Bump to make the mascot hop (on every sign in / sign up switch). */
  hopKey: number;
}

const PUPIL_RANGE = 3.2;

const HOP_FRAMES: Keyframe[] = [
  { transform: 'translateY(0) rotate(0deg)' },
  { transform: 'translateY(-16px) rotate(-7deg)', offset: 0.35 },
  { transform: 'translateY(0) rotate(5deg)', offset: 0.65 },
  { transform: 'translateY(-4px) rotate(-2deg)', offset: 0.82 },
  { transform: 'translateY(0) rotate(0deg)' },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A small robot that peeks over the top edge of the auth card. The head sits
 * behind the card and the paws in front of it, so the parent must stack:
 * head layer < card < paw layer.
 */
export const AuthMascot: React.FC<AuthMascotProps> = ({ gaze, cover, mood, hopKey }) => {
  const headLayerRef = useRef<HTMLDivElement>(null);
  const pawLayerRef = useRef<HTMLDivElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const gazeRef = useRef(gaze);

  // Follow the field caret while typing, otherwise the pointer.
  useEffect(() => {
    gazeRef.current = gaze;
    if (gaze !== null && pupilsRef.current) {
      pupilsRef.current.style.transform = `translate(${(gaze * PUPIL_RANGE).toFixed(2)}px, 3px)`;
    }
    // The pupils remount when the mood returns to idle, so re-apply the gaze then too.
  }, [gaze, mood]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const head = headLayerRef.current;
      const pupils = pupilsRef.current;
      if (!head || !pupils || gazeRef.current !== null) return;
      const rect = head.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const reach = Math.min(dist / 220, 1) * PUPIL_RANGE;
      pupils.style.transform = `translate(${((dx / dist) * reach).toFixed(2)}px, ${((dy / dist) * reach).toFixed(2)}px)`;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    if (hopKey === 0 || prefersReducedMotion()) return;
    const timing: KeyframeAnimationOptions = { duration: 700, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' };
    headLayerRef.current?.animate(HOP_FRAMES, timing);
    pawLayerRef.current?.animate(HOP_FRAMES, { ...timing, delay: 40 });
  }, [hopKey]);

  const layerClass = 'pointer-events-none absolute bottom-[calc(100%-18px)] left-1/2 h-24 w-[120px] -translate-x-1/2';

  return (
    <>
      <div ref={headLayerRef} className={`${layerClass} z-0 auth-mascot auth-mascot--${mood}`} aria-hidden>
        <svg viewBox="0 0 120 96" width="120" height="96" className="overflow-visible">
          <g className="auth-mascot-head">
            <line x1="60" y1="22" x2="60" y2="11" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
            <circle className="auth-mascot-bulb" cx="60" cy="8" r="5" fill="#FFC107" />
            <rect x="11" y="44" width="9" height="20" rx="4.5" fill="#262626" />
            <rect x="100" y="44" width="9" height="20" rx="4.5" fill="#262626" />
            <rect x="18" y="20" width="84" height="72" rx="28" fill="#0a0a0a" />

            {mood === 'happy' ? (
              <g stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none">
                <path d="M37 52 Q45 42 53 52" />
                <path d="M67 52 Q75 42 83 52" />
              </g>
            ) : mood === 'oops' ? (
              <g stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M39 44 L50 50 L39 56" />
                <path d="M81 44 L70 50 L81 56" />
              </g>
            ) : (
              <g className="auth-mascot-eyes">
                <ellipse cx="45" cy="50" rx="9" ry="10" fill="#fff" />
                <ellipse cx="75" cy="50" rx="9" ry="10" fill="#fff" />
                <g ref={pupilsRef} className="auth-mascot-pupils">
                  <circle cx="45" cy="50" r="4.5" fill="#0a0a0a" />
                  <circle cx="75" cy="50" r="4.5" fill="#0a0a0a" />
                  <circle cx="46.6" cy="48.4" r="1.4" fill="#fff" />
                  <circle cx="76.6" cy="48.4" r="1.4" fill="#fff" />
                </g>
              </g>
            )}

            <circle cx="33" cy="63" r="5" fill="#E69A00" opacity="0.45" />
            <circle cx="87" cy="63" r="5" fill="#E69A00" opacity="0.45" />
            {mood === 'oops' ? (
              <circle cx="60" cy="68" r="3" fill="none" stroke="#fff" strokeWidth="2.5" />
            ) : (
              <path
                d={mood === 'happy' ? 'M52 64 Q60 74 68 64' : 'M54 66 Q60 71 66 66'}
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        </svg>
      </div>

      <div ref={pawLayerRef} className={`${layerClass} z-20`} aria-hidden>
        <svg viewBox="0 0 120 96" width="120" height="96" className="overflow-visible">
          <g className={`auth-mascot-paw auth-mascot-paw--left is-${cover}`}>
            <ellipse cx="34" cy="80" rx="11" ry="8" fill="#0a0a0a" />
            <path d="M30 76 v5 M35 75.5 v5.5 M40 76 v5" stroke="#404040" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <g className={`auth-mascot-paw auth-mascot-paw--right is-${cover}`}>
            <ellipse cx="86" cy="80" rx="11" ry="8" fill="#0a0a0a" />
            <path d="M80 76 v5 M85 75.5 v5.5 M90 76 v5" stroke="#404040" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </>
  );
};
