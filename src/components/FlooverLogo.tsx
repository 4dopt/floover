import React from 'react';

interface FlooverLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const FlooverLogo: React.FC<FlooverLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showBadge = true,
  className = ''
}) => {
  // Dimensions for mark
  const markDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14'
  }[size];

  const wordmarkSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric Architectural "F" Logomark */}
      <div
        className={`${markDimensions} shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform duration-200 hover:scale-105`}
        title="Floover - Floor & Covers Designer"
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="flv-mark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="flv-mark-accent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="flv-mark-mid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="flv-mark-chair" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
          </defs>

          {/* Squircle Background Canvas */}
          <rect width="64" height="64" rx="16" fill="url(#flv-mark-bg)" />
          <rect
            x="1"
            y="1"
            width="62"
            height="62"
            rx="15"
            stroke="#3730a3"
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />

          {/* Blueprint Drafting Coordinate Grid */}
          <path
            d="M16 4v56M32 4v56M48 4v56M4 16h56M4 32h56M4 48h56"
            stroke="#334155"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.3"
          />

          {/* Structural Architectural Spine (Letter "F" stem) */}
          <rect x="13" y="14" width="9" height="36" rx="4.5" fill="#4338ca" />

          {/* Top Dining Zone (Upper Arm of "F") */}
          <g>
            {/* Top row covers (chairs) */}
            <rect x="22" y="9" width="6" height="3.5" rx="1.5" fill="url(#flv-mark-chair)" />
            <rect x="31" y="9" width="6" height="3.5" rx="1.5" fill="url(#flv-mark-chair)" />
            <rect x="40" y="9" width="6" height="3.5" rx="1.5" fill="url(#flv-mark-chair)" />

            {/* Upper Banquet Table */}
            <rect x="17" y="14" width="33" height="11" rx="5.5" fill="url(#flv-mark-accent)" />
          </g>

          {/* Middle Dining Zone (Mid Arm of "F") */}
          <g>
            {/* Mid Table */}
            <rect x="17" y="30" width="23" height="10" rx="5" fill="url(#flv-mark-mid)" />

            {/* Bottom row covers (chairs) */}
            <rect x="22" y="42" width="6" height="3.5" rx="1.5" fill="url(#flv-mark-chair)" />
            <rect x="31" y="42" width="6" height="3.5" rx="1.5" fill="url(#flv-mark-chair)" />
          </g>

          {/* Live Cover / Radar Indicator (Active hospitality seating sensor) */}
          <g>
            <circle cx="48" cy="43" r="5.5" fill="#10b981" />
            <circle cx="48" cy="43" r="2.5" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-black tracking-tight text-slate-900 ${wordmarkSizes}`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              floover
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5 mb-0.5 shrink-0 inline-block" />
          </div>

          {showBadge && (
            <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              PRO
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FlooverLogo;
