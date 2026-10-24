import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-op-accent focus-visible:ring-offset-2 focus-visible:ring-offset-op-bg disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-4 cursor-pointer';

  const variants = {
    primary:
      'bg-op-accent text-op-accent-fg font-semibold hover:bg-op-accent-hover active:bg-op-accent-active border border-transparent shadow-none',
    secondary:
      'bg-op-surface text-op-fg border border-op-border hover:bg-op-raised hover:border-op-accent/50 active:bg-op-surface',
    ghost:
      'bg-transparent text-op-muted hover:text-op-fg hover:bg-op-raised border border-transparent',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
