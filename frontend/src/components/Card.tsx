import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div
      className={`op-card bg-op-surface border border-op-border rounded-[20px] p-5 ${
        hoverEffect ? 'hover:border-op-border-strong transition-colors duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
