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
      <div className="relative flex items-center justify-center p-2 rounded-lg bg-[#111827] border border-[#374151] text-[#38BDF8] shadow-sm">
        <Terminal className={iconSizes[size]} />
        <span className="absolute -top-1 -right-1 text-[#C4B5FD]">
          <Sparkles className="w-3.5 h-3.5 fill-[#C4B5FD]" />
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-bold tracking-tight text-[#F9FAFB] ${textSizes[size]}`}>
          Ops<span className="text-[#38BDF8]">Pilot</span>
        </span>
        {showBadge && (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1F2937] text-[#C4B5FD] border border-[#374151]">
            IDP
          </span>
        )}
      </div>
    </div>
  );
};
