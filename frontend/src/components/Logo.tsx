import React from 'react';
import { Terminal, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showBadge = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center p-2 rounded-lg bg-op-surface border border-op-border text-op-accent shadow-sm">
        <Terminal className={iconSizes[size]} />
        <span className="absolute -top-1 -right-1 text-op-highlight">
          <Sparkles className="w-3.5 h-3.5 fill-op-highlight" />
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-bold tracking-tight text-op-fg ${textSizes[size]}`}>
          Ops<span className="text-op-accent">Pilot</span>
        </span>
        {showBadge && (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-op-raised text-op-highlight border border-op-border">
            IDP
          </span>
        )}
      </div>
    </div>
  );
};
