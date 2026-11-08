import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-10 text-center bg-op-raised/40 border border-op-border rounded-2xl border-dashed ${className}`}>
      {icon && <div className="mb-4 text-op-muted w-12 h-12 flex items-center justify-center bg-op-raised rounded-full">{icon}</div>}
      <h3 className="text-sm font-semibold text-op-fg mb-2">{title}</h3>
      <p className="text-xs leading-6 text-op-muted max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
