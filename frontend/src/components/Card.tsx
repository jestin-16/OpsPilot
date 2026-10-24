import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div
      className={`bg-op-surface border border-op-border rounded-2xl p-5 shadow-none ${
        hoverEffect ? 'hover:bg-op-raised hover:border-op-border-strong transition-colors duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
