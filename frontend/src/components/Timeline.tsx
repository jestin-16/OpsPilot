import React from 'react';

export interface TimelineEvent {
  id: string | number;
  title: string;
  description?: React.ReactNode;
  timestamp: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'neutral';
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className = '' }) => {
  const statusColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    neutral: 'bg-op-muted',
  };

  const statusBgColors = {
    success: 'bg-emerald-100',
    warning: 'bg-amber-100',
    error: 'bg-rose-100',
    neutral: 'bg-slate-100',
  };

  return (
    <div className={`relative border-l border-op-border ml-4 ${className}`}>
      {events.map((event, index) => (
        <div key={event.id} className={`mb-8 ml-6 ${index === events.length - 1 ? 'mb-0' : ''}`}>
          <span 
            className={`absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-op-surface ${event.icon ? statusBgColors[event.status || 'neutral'] : statusColors[event.status || 'neutral']}`}
          >
            {event.icon ? (
              <span className={`text-${event.status === 'neutral' ? 'slate' : event.status}-600`}>{event.icon}</span>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            )}
          </span>
          <div className="flex flex-col justify-start pt-1">
            <h3 className="text-sm font-semibold text-op-fg">{event.title}</h3>
            <time className="block mb-2 text-xs font-normal text-op-subtle">
              {event.timestamp}
            </time>
            {event.description && (
              <div className="text-sm text-op-muted mt-1">
                {event.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
