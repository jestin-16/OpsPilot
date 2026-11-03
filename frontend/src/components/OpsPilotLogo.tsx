import React from 'react';

interface OpsPilotLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export const OpsPilotLogo: React.FC<OpsPilotLogoProps> = ({
  size = 36,
  className = '',
  showWordmark = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
        aria-label="OpsPilot Logo"
      >
        <rect width="48" height="48" rx="12" fill="#242528" />
        <rect width="48" height="48" rx="12" fill="url(#op-react-logo-grad)" opacity="0.25" />
        <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="rgba(255,255,255,0.14)" />
        <path d="M13 34L24 13L24 27L17 34H13Z" fill="#ffffff" fillOpacity="0.95" />
        <path d="M35 34L24 13L24 27L31 34H35Z" fill="#8da99a" />
        <circle cx="24" cy="27" r="2.5" fill="#ffffff" />
        <path d="M12 24C12 17.3726 17.3726 12 24 12" stroke="#8da99a" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 3" opacity="0.75" />
        <defs>
          <linearGradient id="op-react-logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8da99a" />
            <stop offset="1" stopColor="#242528" />
          </linearGradient>
        </defs>
      </svg>
      {showWordmark && (
        <div className="flex flex-col text-left">
          <span className="font-tech-mono text-[0.92rem] font-bold tracking-tight text-neutral-900">
            OPS<span className="text-neutral-400">/</span>PILOT
          </span>
          <span className="font-tech-mono text-[0.62rem] font-medium tracking-wider text-neutral-500 uppercase">
            Control Plane
          </span>
        </div>
      )}
    </div>
  );
};
