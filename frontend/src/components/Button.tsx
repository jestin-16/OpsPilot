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
    'inline-flex items-center justify-center font-semibold rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 focus:ring-offset-[#090D16] disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-4 cursor-pointer';

  const variants = {
    primary:
      'bg-[#0EA5E9] text-[#090D16] font-bold hover:bg-[#38BDF8] active:bg-[#0284C7] border border-transparent shadow-md',
    secondary:
      'bg-[#111827] text-[#F9FAFB] border border-[#374151] hover:bg-[#1F2937] hover:border-[#0EA5E9]/50 active:bg-[#111827]',
    ghost:
      'bg-transparent text-[#CBD5E1] hover:text-[#F9FAFB] hover:bg-[#1F2937] border border-transparent',
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
