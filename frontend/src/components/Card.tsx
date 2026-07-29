import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div
      className={`bg-op-surface border border-op-border rounded-xl p-6 shadow-md ${
        hoverEffect ? 'hover:bg-op-raised hover:border-op-border-strong transition-all duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
