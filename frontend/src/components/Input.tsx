import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#CBD5E1] tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={inputType}
          className={`w-full bg-[#1E293B] text-[#F9FAFB] text-sm rounded-lg border ${
            error ? 'border-red-500 focus:border-red-500' : 'border-[#475569] focus:border-[#38BDF8]'
          } ${
            icon ? 'pl-9' : 'pl-3'
          } ${isPasswordType ? 'pr-10' : 'pr-3'} py-2.5 outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500/40' : 'focus:ring-[#38BDF8]/40'
          } placeholder-[#94A3B8] transition-all font-medium`}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[#94A3B8] hover:text-[#F9FAFB] focus:outline-none transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
};
