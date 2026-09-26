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
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-op-surface border border-op-border rounded-xl border-dashed ${className}`}>
      {icon && <div className="mb-4 text-op-muted w-12 h-12 flex items-center justify-center bg-op-raised rounded-full">{icon}</div>}
      <h3 className="text-lg font-semibold text-op-fg mb-2">{title}</h3>
      <p className="text-op-subtle max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
