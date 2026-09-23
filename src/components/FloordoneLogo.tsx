import React from 'react';

export interface FloordoneLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showBadge?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const FloordoneLogo: React.FC<FloordoneLogoProps> = ({
  size = 'md',
  showWordmark = true,
  theme = 'light',
  className = ''
}) => {
  // Proportional mark dimensions that optically harmonize with wordmark text
  const markDimensions = {
    xs: 'w-4 h-4 rounded-md',
    sm: 'w-5 h-5 rounded-md',
    md: 'w-6 h-6 rounded-lg',
    lg: 'w-8 h-8 rounded-xl',
    xl: 'w-10 h-10 rounded-2xl'
  }[size] || 'w-5 h-5 rounded-md';

  const pixelDimensions: Record<string, number> = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40
  };
  const px = pixelDimensions[size] || 20;

  const wordmarkSizes = {
    xs: 'text-xs tracking-tight',
    sm: 'text-sm tracking-tight',
    md: 'text-xl tracking-tight',
    lg: 'text-2xl tracking-tight',
    xl: 'text-3xl tracking-tight'
  }[size] || 'text-sm tracking-tight';

  const gapSize = {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2.5',
    xl: 'gap-3'
  }[size] || 'gap-1.5';

  return (
    <div className={`flex items-center ${gapSize} select-none ${className}`}>
      {/* 1. Wordmark: "floordone" comes first */}
      {showWordmark && (
        <div
          className="flex items-baseline font-black leading-none"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} ${wordmarkSizes}`}>
            floor
          </span>
          <span className={`${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} font-black ${wordmarkSizes}`}>
            done
          </span>
        </div>
      )}

      {/* 2. Logo Mark with bold/thick tick placed after "floordone" */}
      <div
        className={`${markDimensions} shrink-0 overflow-hidden shadow-xs transition-transform duration-200 hover:scale-105 flex items-center justify-center`}
        style={{ width: px, height: px, minWidth: px, minHeight: px, maxWidth: px, maxHeight: px }}
        title="Floordone - Floor Plans, Done."
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Deep Obsidian-Navy Canvas */}
            <linearGradient id="fd-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>

            {/* Radiant Theme-Matched Indigo "Done" Checkmark Gradient */}
            <linearGradient id="fd-done-check" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="35%" stopColor="#4f46e5" />
              <stop offset="70%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>

            {/* Subtle glow for the checkmark */}
            <filter id="fd-check-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366f1" floodOpacity="0.55" />
            </filter>
          </defs>

          {/* Squircle Background Canvas */}
          <rect width="64" height="64" rx="16" fill="url(#fd-bg-grad)" />
          <rect
            x="1"
            y="1"
            width="62"
            height="62"
            rx="15"
            stroke="#334155"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Bold, Thick Radiant "Done" Checkmark */}
          <g filter="url(#fd-check-glow)">
            <path
              d="M16 33L27.5 44.5L48 19"
              stroke="url(#fd-done-check)"
              strokeWidth="8.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Luminous Core Highlight */}
            <path
              d="M16 33L27.5 44.5L48 19"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.92"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export const FlooverLogo = FloordoneLogo;
export default FloordoneLogo;
