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
        <label htmlFor={inputId} className="text-xs font-semibold text-op-muted tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-op-subtle pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={inputType}
          className={`w-full bg-op-input text-op-fg text-sm rounded-lg border ${
            error ? 'border-op-danger focus:border-op-danger' : 'border-op-border-strong focus:border-op-accent'
          } ${
            icon ? 'pl-9' : 'pl-3'
          } ${isPasswordType ? 'pr-10' : 'pr-3'} py-2.5 outline-none focus:ring-2 ${
            error ? 'focus:ring-op-danger/40' : 'focus:ring-op-accent/40'
          } placeholder-op-subtle transition-all font-medium ${className}`}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-op-subtle hover:text-op-fg focus:outline-none transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-op-danger font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
};
