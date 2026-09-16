import React from 'react';

export interface FloordoneLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const FloordoneLogo: React.FC<FloordoneLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = ''
}) => {
  // Dimensions for mark container
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
      {/* Precision Geometric Architectural "Floor + Done" Logomark */}
      <div
        className={`${markDimensions} shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform duration-200 hover:scale-105`}
        title="Floordone - Floor Plans, Done."
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Deep Obsidian-Navy Architectural Blueprint Canvas */}
            <linearGradient id="fd-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Architectural Room Partition Gradient */}
            <linearGradient id="fd-wall-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            {/* Dining Table Top Gradient */}
            <linearGradient id="fd-table-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>

            {/* Radiant Theme-Matched Indigo "Done" Checkmark Gradient */}
            <linearGradient id="fd-done-check" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="40%" stopColor="#4f46e5" />
              <stop offset="75%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>

            {/* Subtle glow for the checkmark to signify completion */}
            <filter id="fd-check-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#6366f1" floodOpacity="0.45" />
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

          {/* 1. Architectural CAD Coordinate Grid */}
          <path
            d="M16 6v52M32 6v52M48 6v52M6 16h52M6 32h52M6 48h52"
            stroke="#1e293b"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.5"
          />

          {/* Precision drafting tick at origin */}
          <path d="M10 12h4M12 10v4" stroke="#818cf8" strokeWidth="0.9" opacity="0.6" />

          {/* 2. "FLOOR" Geometry: Architectural Perimeter Wall & Room Enclosure */}
          <g>
            {/* Main Outer Structural Wall (Top corner and left boundary) */}
            <path
              d="M44 14H14V50H32"
              stroke="url(#fd-wall-grad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Architectural Door Swing Arc into Room */}
            <path
              d="M32 50A12 12 0 0 1 44 38"
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.6"
            />
            {/* Door leaf */}
            <line x1="32" y1="50" x2="44" y2="38" stroke="#94a3b8" strokeWidth="1.2" opacity="0.75" />

            {/* Interior Zone: Upper Dining Table (Rectangular 4-Top) */}
            <g opacity="0.95">
              {/* Chairs / Covers (Pills) */}
              <rect x="20" y="19" width="4.5" height="2" rx="1" fill="#c7d2fe" />
              <rect x="27.5" y="19" width="4.5" height="2" rx="1" fill="#c7d2fe" />
              <rect x="20" y="29" width="4.5" height="2" rx="1" fill="#c7d2fe" />
              <rect x="27.5" y="29" width="4.5" height="2" rx="1" fill="#c7d2fe" />

              {/* Table Top */}
              <rect x="18" y="22" width="16" height="6" rx="2.5" fill="url(#fd-table-grad)" />
            </g>

            {/* Interior Zone: Lower Dining Table (Round 4-Top with Covers) */}
            <g opacity="0.9">
              {/* Chairs */}
              <circle cx="21" cy="35" r="1.3" fill="#c7d2fe" />
              <circle cx="21" cy="47" r="1.3" fill="#c7d2fe" />
              <circle cx="15" cy="41" r="1.3" fill="#c7d2fe" />
              <circle cx="27" cy="41" r="1.3" fill="#c7d2fe" />

              {/* Round Table Top */}
              <circle cx="21" cy="41" r="4.2" fill="#4f46e5" />
            </g>
          </g>

          {/* 3. "DONE" Geometry: The Radiant Architectural Completion Checkmark */}
          {/* Sweeps boldly from inside the floor plan, cutting through to top-right completion */}
          <g filter="url(#fd-check-glow)">
            <path
              d="M26 36L36 47L54 17"
              stroke="url(#fd-done-check)"
              strokeWidth="4.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Luminous Core Highlight */}
            <path
              d="M26 36L36 47L54 17"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </g>

          {/* 4. Completion Sparkle & Precision Point at the Apex of "Done" in Theme Indigo */}
          <g>
            <circle cx="54" cy="17" r="4.5" fill="#6366f1" opacity="0.35" />
            <circle cx="54" cy="17" r="2.6" fill="#ffffff" />
            <circle cx="54" cy="17" r="1.2" fill="#4f46e5" />
          </g>
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <div
            className="flex items-baseline font-black tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <span className={`text-slate-900 ${wordmarkSizes}`}>
              floor
            </span>
            <span className={`text-indigo-600 font-black ${wordmarkSizes}`}>
              done
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-0.5 mb-0.5 shrink-0 inline-block ring-2 ring-indigo-100" />
          </div>
        </div>
      )}
    </div>
  );
};

export const FlooverLogo = FloordoneLogo;
export default FloordoneLogo;
