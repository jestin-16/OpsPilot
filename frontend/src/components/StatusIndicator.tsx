import React from 'react';

interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'pending' | 'error';
  text?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, text, className = '' }) => {
  const colors = {
    active: 'bg-emerald-500',
    inactive: 'bg-slate-400',
    pending: 'bg-amber-500',
    error: 'bg-rose-500',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex h-3 w-3">
        {status === 'active' || status === 'pending' ? (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status]}`}></span>
        ) : null}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[status]}`}></span>
      </span>
      {text && <span className="text-sm font-medium text-op-fg capitalize">{text}</span>}
    </div>
  );
};
