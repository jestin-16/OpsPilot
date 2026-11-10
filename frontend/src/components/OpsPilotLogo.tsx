import type { CSSProperties } from 'react';

interface OpsPilotMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Interlocking O and P, drawn on one grid for consistent use at every size. */
export function OpsPilotMark({ size = 36, color = 'currentColor', className = '' }: OpsPilotMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill={color} className={className} aria-hidden="true" focusable="false">
      <path fillRule="evenodd" d="M17 13C8.5 13 3 19.3 3 28S8.5 43 17 43S31 36.7 31 28S25.5 13 17 13ZM17 19C12.1 19 9 22.6 9 28S12.1 37 17 37S25 33.4 25 28S21.9 19 17 19Z" />
      <path fillRule="evenodd" d="M21 41V5H32C40.2 5 45 10.4 45 18.5S40.2 32 32 32H27V41H21ZM27 11V26H32C36.5 26 39 23.2 39 18.5S36.5 11 32 11H27Z" />
    </svg>
  );
}

interface OpsPilotLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  variant?: 'default' | 'forest' | 'monochrome';
}

export function OpsPilotLogo({ size = 36, className = '', showWordmark = false, variant = 'monochrome' }: OpsPilotLogoProps) {
  const style: CSSProperties = { color: variant === 'forest' ? '#183b32' : '#111111' };
  return (
    <span className={`inline-flex items-center gap-2.5 shrink-0 ${className}`} style={style} role={showWordmark ? undefined : 'img'} aria-label={showWordmark ? undefined : 'OpsPilot'}>
      <OpsPilotMark size={size} />
      {showWordmark && <span className="font-sans text-[1.15rem] font-semibold tracking-[-0.055em] leading-none">OpsPilot</span>}
    </span>
  );
}
