import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div
      className={`bg-[#111827] border border-[#374151] rounded-xl p-6 shadow-md ${
        hoverEffect ? 'hover:bg-[#1F2937] hover:border-[#4B5563] transition-all duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
