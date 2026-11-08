import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    success: 'bg-op-sage-soft text-op-sage border-op-sage/15',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/70',
    error: 'bg-rose-50 text-rose-800 border-rose-200/70',
    info: 'bg-sky-50 text-sky-800 border-sky-200/70',
    neutral: 'bg-op-raised text-op-muted border-op-border',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
