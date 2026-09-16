import React from 'react';
import { FloorElement } from '../types';

export function getElementSubtype(el: FloorElement): string {
  if (el.subtype) return el.subtype;
  const name = el.name.toLowerCase();

  // Decks & outdoor
  if (name.includes('wood deck') || name.includes('wooden deck') || (name.includes('deck') && !name.includes('dj'))) return 'deck-wood';
  if (name.includes('patio') || name.includes('terrace') || name.includes('stone')) return 'deck-stone';
  if (name.includes('umbrella') || name.includes('parasol')) return 'outdoor-umbrella';
  if (name.includes('pergola')) return 'outdoor-pergola';

  // Plants & greenery
  if (name.includes('ficus') || (name.includes('tree') && el.type === 'decor') || (el.type === 'decor' && el.shape === 'round' && (name.includes('plant') || name.includes('pot')))) {
    return 'plant-potted';
  }
  if (name.includes('palm') || name.includes('monstera') || name.includes('fern')) return 'plant-palm';
  if (name.includes('green wall') || name.includes('moss') || name.includes('living wall')) return 'plant-green-wall';
  if (name.includes('planter') || (name.includes('plant') && el.shape === 'rectangle')) return 'plant-box';

  // Walls & columns
  if (name.includes('glass') && (name.includes('wall') || name.includes('partition'))) return 'wall-glass';
  if (name.includes('half') && name.includes('wall')) return 'wall-half';
  if (name.includes('wall') || name.includes('partition') || name.includes('divider')) return 'wall-solid';
  if (name.includes('pillar') || name.includes('column')) return el.shape === 'round' ? 'column-round' : 'column-square';

  // Doors & windows
  if (name.includes('double') && (name.includes('door') || name.includes('entrance') || name.includes('entry'))) return 'door-double';
  if (name.includes('sliding') && (name.includes('door') || name.includes('patio'))) return 'door-sliding';
  if (name.includes('emergency') || name.includes('fire exit') || name.includes('egress')) return 'door-emergency';
  if (name.includes('arch') || name.includes('portal') || name.includes('cased opening')) return 'opening-arch';
  if (name.includes('door') || name.includes('entrance') || name.includes('entryway')) return 'door-single';
  if (name.includes('window')) return 'window-exterior';

  // Venue fixtures
  if (name.includes('bar') && (el.type === 'fixture' || el.shape === 'bar')) return 'fixture-bar';
  if (name.includes('buffet') || name.includes('carving')) return 'fixture-buffet';
  if (name.includes('kitchen') || name.includes('pass') || name.includes('chef')) return 'fixture-kitchen';
  if (name.includes('host') || name.includes('podium') || name.includes("maître d'")) return 'fixture-host';
  if (name.includes('pos') || name.includes('terminal') || name.includes('waiter station')) return 'fixture-pos';
  if (name.includes('restroom') || name.includes('toilet') || name.includes('wc') || name.includes('bathroom')) return 'fixture-restrooms';
  if (name.includes('stage') || name.includes('riser') || name.includes('podium platform')) return 'fixture-stage';
  if (name.includes('dance floor')) return 'fixture-dance-floor';
  if (name.includes('dj') || name.includes('sound booth')) return 'fixture-dj';
  if (name.includes('photo') || name.includes('backdrop') || name.includes('arch')) return 'decor-photo-backdrop';

  return '';
}

interface ArchitecturalElementRendererProps {
  element: FloorElement;
  isSelected: boolean;
  remoteSelector?: { color: string; name: string } | null;
  statusConfig: { bg: string; stroke: string; label: string; text: string };
  effectiveCovers: number;
}

export const ArchitecturalElementRenderer: React.FC<ArchitecturalElementRendererProps> = ({
  element: el,
  isSelected,
  remoteSelector,
  statusConfig,
  effectiveCovers
}) => {
  const w = el.width;
  const h = el.height;
  const hw = w / 2;
  const hh = h / 2;
  const subtype = getElementSubtype(el);

  const strokeColor = remoteSelector
    ? remoteSelector.color
    : isSelected
    ? '#4f46e5'
    : el.color || '#475569';

  const strokeWidth = isSelected || remoteSelector ? 2.5 : 1.8;

  // Render by architectural subtype
  switch (subtype) {
    // ----------------------------------------------------------------------
    // 1. WALLS & PARTITIONS
    // ----------------------------------------------------------------------
    case 'wall-solid': {
      return (
        <g className="architectural-wall-solid select-none">
          {/* Main hatched wall body */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="url(#wall-hatch)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="1"
          />
          {/* Wall end cap markers */}
          <line x1={-hw} y1={-hh} x2={-hw} y2={hh} stroke="#0f172a" strokeWidth={strokeWidth + 1} />
          <line x1={hw} y1={-hh} x2={hw} y2={hh} stroke="#0f172a" strokeWidth={strokeWidth + 1} />

          {/* Wall center dimension label pill */}
          <rect
            x={-34}
            y={-7}
            width="68"
            height="14"
            rx="4"
            fill="#0f172a"
            fillOpacity="0.85"
            className="pointer-events-none"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#ffffff"
            letterSpacing="0.5"
            className="pointer-events-none"
          >
            {el.name.length > 18 ? `${Math.round(w / 20)}ft Wall` : el.name}
          </text>
        </g>
      );
    }

    case 'wall-glass': {
      return (
        <g className="architectural-wall-glass select-none">
          {/* Translucent glass partition */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="url(#glass-gradient)"
            stroke={isSelected ? '#4f46e5' : '#38bdf8'}
            strokeWidth={strokeWidth}
            rx="2"
          />
          {/* Glass glint reflections */}
          <line
            x1={-hw + 15}
            y1={-hh + 2}
            x2={-hw + 35}
            y2={hh - 2}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          <line
            x1={hw - 35}
            y1={-hh + 2}
            x2={hw - 15}
            y2={hh - 2}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />
          {/* Stainless steel standoff clamps */}
          {[-hw + 8, 0, hw - 8].map((cx, idx) => (
            <rect
              key={idx}
              x={cx - 3}
              y={-hh - 2}
              width="6"
              height={h + 4}
              rx="1.5"
              fill="#64748b"
              stroke="#334155"
              strokeWidth="0.8"
            />
          ))}
          <text
            x="0"
            y={hh + 12}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="600"
            fill="#0284c7"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'wall-half': {
      return (
        <g className="architectural-wall-half select-none">
          {/* Base partition */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#e2e8f0"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="2"
          />
          {/* Polished wood cap trim on top */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={Math.max(4, h * 0.35)}
            fill="#b45309"
            rx="1"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="700"
            fill="#334155"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'column-square': {
      return (
        <g className="architectural-column-square select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#cbd5e1"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="1"
          />
          {/* Concrete column diagonal cross */}
          <line x1={-hw} y1={-hh} x2={hw} y2={hh} stroke="#475569" strokeWidth="1.5" />
          <line x1={-hw} y1={hh} x2={hw} y2={-hh} stroke="#475569" strokeWidth="1.5" />
          <text
            x="0"
            y={hh + 11}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#475569"
            className="pointer-events-none"
          >
            Column
          </text>
        </g>
      );
    }

    case 'column-round': {
      const radius = Math.min(w, h) / 2;
      return (
        <g className="architectural-column-round select-none">
          <circle
            r={radius}
            fill="#cbd5e1"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <circle
            r={radius * 0.65}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <circle r="3" fill="#334155" />
          <text
            x="0"
            y={radius + 11}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#475569"
            className="pointer-events-none"
          >
            Pillar
          </text>
        </g>
      );
    }

    // ----------------------------------------------------------------------
    // 2. DOORS & OPENINGS
    // ----------------------------------------------------------------------
    case 'door-single': {
      // Standard architectural single swing door with 90° clearance arc
      const doorRadius = Math.max(28, w - 12);
      return (
        <g className="architectural-door-single select-none">
          {/* Wall threshold base line */}
          <line x1={-hw} y1="0" x2={hw} y2="0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

          {/* Left and Right Wall Jambs */}
          <rect x={-hw} y="-4" width="6" height="8" fill="#1e293b" rx="1" />
          <rect x={hw - 6} y="-4" width="6" height="8" fill="#1e293b" rx="1" />

          {/* Hinged open door leaf (panel) */}
          <rect
            x={-hw + 4}
            y="0"
            width="4"
            height={doorRadius}
            fill="#475569"
            stroke={strokeColor}
            strokeWidth="1.2"
            rx="1"
          />

          {/* Door swing clearance arc (90-degree radius) */}
          <path
            d={`M ${hw - 6} 0 A ${doorRadius} ${doorRadius} 0 0 1 ${-hw + 4} ${doorRadius}`}
            fill="none"
            stroke={isSelected ? '#6366f1' : '#64748b'}
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />

          {/* Directional arrow tip on arc */}
          <circle cx={hw - 8} cy="6" r="2" fill={isSelected ? '#6366f1' : '#64748b'} />

          <text
            x="0"
            y={-8}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#334155"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'door-double': {
      // Grand double swing entryway with dual symmetric clearance arcs
      const leafRadius = Math.max(20, (w - 12) / 2);
      return (
        <g className="architectural-door-double select-none">
          {/* Threshold line */}
          <line x1={-hw} y1="0" x2={hw} y2="0" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

          {/* Left & Right Door Jambs */}
          <rect x={-hw} y="-5" width="6" height="10" fill="#1e293b" rx="1" />
          <rect x={hw - 6} y="-5" width="6" height="10" fill="#1e293b" rx="1" />

          {/* Left door leaf */}
          <rect
            x={-hw + 4}
            y="0"
            width="4"
            height={leafRadius}
            fill="#3b82f6"
            stroke={strokeColor}
            strokeWidth="1.2"
            rx="1"
          />
          {/* Right door leaf */}
          <rect
            x={hw - 8}
            y="0"
            width="4"
            height={leafRadius}
            fill="#3b82f6"
            stroke={strokeColor}
            strokeWidth="1.2"
            rx="1"
          />

          {/* Left swing arc (meeting at center) */}
          <path
            d={`M 0 0 A ${leafRadius} ${leafRadius} 0 0 1 ${-hw + 4} ${leafRadius}`}
            fill="none"
            stroke={isSelected ? '#4f46e5' : '#3b82f6'}
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          {/* Right swing arc (meeting at center) */}
          <path
            d={`M 0 0 A ${leafRadius} ${leafRadius} 0 0 0 ${hw - 8} ${leafRadius}`}
            fill="none"
            stroke={isSelected ? '#4f46e5' : '#3b82f6'}
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />

          <text
            x="0"
            y={-8}
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#1e40af"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'door-sliding': {
      return (
        <g className="architectural-door-sliding select-none">
          {/* Track frame */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#f8fafc"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="2"
          />
          {/* Dual sliding glass panels */}
          <rect
            x={-hw + 4}
            y={-hh + 2}
            width={hw}
            height={h * 0.45}
            fill="#bae6fd"
            stroke="#0284c7"
            strokeWidth="1"
            rx="1"
          />
          <rect
            x={0}
            y={hh - h * 0.45 - 2}
            width={hw - 4}
            height={h * 0.45}
            fill="#bae6fd"
            stroke="#0284c7"
            strokeWidth="1"
            rx="1"
          />
          {/* Slide arrows */}
          <path
            d={`M ${-hw + 14} 0 L ${-hw + 24} 0 M ${-hw + 18} -3 L ${-hw + 14} 0 L ${-hw + 18} 3`}
            stroke="#0284c7"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d={`M ${hw - 24} 0 L ${hw - 14} 0 M ${hw - 18} -3 L ${hw - 14} 0 L ${hw - 18} 3`}
            stroke="#0284c7"
            strokeWidth="1.5"
            fill="none"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#0369a1"
            className="pointer-events-none"
          >
            Sliding Door
          </text>
        </g>
      );
    }

    case 'door-emergency': {
      const doorRadius = Math.max(26, w - 12);
      return (
        <g className="architectural-door-emergency select-none">
          {/* Wall jambs */}
          <rect x={-hw} y="-4" width="6" height="8" fill="#15803d" rx="1" />
          <rect x={hw - 6} y="-4" width="6" height="8" fill="#15803d" rx="1" />

          {/* Door panel */}
          <rect
            x={-hw + 4}
            y="0"
            width="5"
            height={doorRadius}
            fill="#16a34a"
            stroke={strokeColor}
            strokeWidth="1.2"
            rx="1"
          />

          {/* Egress clearance arc */}
          <path
            d={`M ${hw - 6} 0 A ${doorRadius} ${doorRadius} 0 0 1 ${-hw + 4} ${doorRadius}`}
            fill="none"
            stroke="#16a34a"
            strokeWidth="1.6"
            strokeDasharray="3 3"
          />

          {/* Glowing Green Emergency Exit Badge */}
          <rect
            x="-28"
            y="-10"
            width="56"
            height="15"
            rx="3"
            fill="#16a34a"
            stroke="#14532d"
            strokeWidth="1"
          />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fontSize="8"
            fontWeight="900"
            fill="#ffffff"
            letterSpacing="0.8"
            className="pointer-events-none"
          >
            EXIT ➔
          </text>
        </g>
      );
    }

    case 'opening-arch': {
      return (
        <g className="architectural-opening-arch select-none">
          {/* Wall stub jambs on ends */}
          <rect x={-hw} y={-hh} width="8" height={h} fill="#1e293b" rx="1" />
          <rect x={hw - 8} y={-hh} width="8" height={h} fill="#1e293b" rx="1" />

          {/* Dashed opening boundary floor threshold */}
          <line x1={-hw + 8} y1="0" x2={hw - 8} y2="0" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#64748b"
            className="pointer-events-none"
          >
            Archway Opening
          </text>
        </g>
      );
    }

    case 'window-exterior': {
      return (
        <g className="architectural-window select-none">
          {/* Outer window frame */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#f0f9ff"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="1"
          />
          {/* Exterior projecting sill */}
          <line
            x1={-hw - 4}
            y1={-hh}
            x2={hw + 4}
            y2={-hh}
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Double glass glazing panes */}
          <line x1={-hw + 6} y1={-hh + 4} x2={hw - 6} y2={-hh + 4} stroke="#38bdf8" strokeWidth="1.5" />
          <line x1={-hw + 6} y1={hh - 4} x2={hw - 6} y2={hh - 4} stroke="#38bdf8" strokeWidth="1.5" />

          {/* Center window mullion */}
          <line x1="0" y1={-hh} x2="0" y2={hh} stroke="#0284c7" strokeWidth="1.5" />

          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#0369a1"
            className="pointer-events-none"
          >
            Window
          </text>
        </g>
      );
    }

    // ----------------------------------------------------------------------
    // 3. DECKS & OUTDOOR
    // ----------------------------------------------------------------------
    case 'deck-wood': {
      // Wood plank timber decking platform with horizontal boards
      const plankHeight = 12;
      const plankCount = Math.floor(h / plankHeight);

      return (
        <g className="outdoor-deck-wood select-none">
          {/* Base timber surface */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="url(#wood-deck-pattern)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="3"
          />
          {/* Timber frame borders */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="none"
            stroke="#92400e"
            strokeWidth="2"
            rx="3"
          />

          {/* Planks & fastener screws */}
          {Array.from({ length: plankCount }).map((_, i) => {
            const py = -hh + (i + 1) * plankHeight;
            if (py >= hh) return null;
            return (
              <g key={i}>
                <line x1={-hw} y1={py} x2={hw} y2={py} stroke="#78350f" strokeWidth="1" strokeOpacity="0.75" />
                {/* Fastener screw pairs */}
                <circle cx={-hw + 6} cy={py - 6} r="1" fill="#451a03" />
                <circle cx={hw - 6} cy={py - 6} r="1" fill="#451a03" />
                <circle cx="0" cy={py - 6} r="1" fill="#451a03" opacity="0.6" />
              </g>
            );
          })}

          {/* Center Platform Label */}
          <rect
            x={-44}
            y={-9}
            width="88"
            height="18"
            rx="4"
            fill="#451a03"
            fillOpacity="0.8"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#fef3c7"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'deck-stone': {
      return (
        <g className="outdoor-deck-stone select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="url(#stone-patio-pattern)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="4"
          />
          <rect
            x={-42}
            y={-9}
            width="84"
            height="18"
            rx="4"
            fill="#1e293b"
            fillOpacity="0.8"
          />
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#f8fafc"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'outdoor-umbrella': {
      const radius = Math.min(w, h) / 2;
      return (
        <g className="outdoor-umbrella select-none">
          {/* Scalloped/octagonal parasol canopy */}
          <circle
            r={radius}
            fill={el.color || '#fbbf24'}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Radiating canopy rib struts (8 ribs) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x2 = Math.cos(rad) * radius;
            const y2 = Math.sin(rad) * radius;
            return (
              <line
                key={angle}
                x1="0"
                y1="0"
                x2={x2}
                y2={y2}
                stroke="#b45309"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />
            );
          })}
          {/* Canopy shading sectors for depth */}
          <path
            d={`M 0 0 L ${radius} 0 A ${radius} ${radius} 0 0 1 ${Math.cos(Math.PI / 4) * radius} ${Math.sin(Math.PI / 4) * radius} Z`}
            fill="#000000"
            fillOpacity="0.08"
          />
          <path
            d={`M 0 0 L 0 ${radius} A ${radius} ${radius} 0 0 1 ${-Math.cos(Math.PI / 4) * radius} ${Math.sin(Math.PI / 4) * radius} Z`}
            fill="#000000"
            fillOpacity="0.08"
          />
          {/* Center pole mast & top finial */}
          <circle r="5" fill="#78350f" stroke="#ffffff" strokeWidth="1" />
          <circle r="2" fill="#ffffff" />
          <text
            x="0"
            y={radius + 12}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#92400e"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'outdoor-pergola': {
      const beamSpacing = 16;
      const beamCount = Math.floor(w / beamSpacing);
      return (
        <g className="outdoor-pergola select-none">
          {/* Outer boundary */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#fef3c7"
            fillOpacity="0.3"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="2"
          />
          {/* 4 Corner Heavy Timber Posts */}
          {[-hw, hw - 10].map((px) =>
            [-hh, hh - 10].map((py) => (
              <rect
                key={`${px}-${py}`}
                x={px}
                y={py}
                width="10"
                height="10"
                fill="#78350f"
                stroke="#451a03"
                strokeWidth="1"
                rx="1"
              />
            ))
          )}
          {/* Transverse Timber Rafter Beams */}
          {Array.from({ length: beamCount }).map((_, i) => {
            const bx = -hw + (i + 1) * beamSpacing;
            if (bx >= hw) return null;
            return (
              <line
                key={i}
                x1={bx}
                y1={-hh - 4}
                x2={bx}
                y2={hh + 4}
                stroke="#92400e"
                strokeWidth="2.5"
                strokeLinecap="square"
              />
            );
          })}
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#78350f"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    // ----------------------------------------------------------------------
    // 4. PLANTS & BOTANICALS
    // ----------------------------------------------------------------------
    case 'plant-potted': {
      const radius = Math.min(w, h) / 2;
      const potRadius = radius * 0.5;

      return (
        <g className="decor-plant-potted select-none">
          {/* Circular Ceramic/Slate Pot */}
          <circle
            r={potRadius}
            fill="#78716c"
            stroke="#44403c"
            strokeWidth="2"
          />
          <circle r={potRadius * 0.75} fill="#451a03" />

          {/* Lush Organic Foliage Leaf Petals (Layered in a circle) */}
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((ang, i) => {
            const rad = (ang * Math.PI) / 180;
            const dist = radius * (0.65 + (i % 3) * 0.15);
            const cx = Math.cos(rad) * dist;
            const cy = Math.sin(rad) * dist;
            const leafR = radius * 0.38;
            return (
              <circle
                key={ang}
                cx={cx}
                cy={cy}
                r={leafR}
                fill={i % 2 === 0 ? '#16a34a' : '#15803d'}
                fillOpacity="0.9"
                stroke="#14532d"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Inner canopy leaves */}
          {[20, 80, 140, 200, 260, 320].map((ang, i) => {
            const rad = (ang * Math.PI) / 180;
            const cx = Math.cos(rad) * (radius * 0.45);
            const cy = Math.sin(rad) * (radius * 0.45);
            return (
              <circle
                key={`in-${ang}`}
                cx={cx}
                cy={cy}
                r={radius * 0.3}
                fill="#22c55e"
                fillOpacity="0.9"
              />
            );
          })}

          {/* Center Trunk Stem */}
          <circle r="3.5" fill="#713f12" />

          {/* Selection indicator if active */}
          {isSelected && (
            <circle
              r={radius + 3}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}

          <text
            x="0"
            y={radius + 12}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#166534"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'plant-palm': {
      const radius = Math.min(w, h) / 2;
      return (
        <g className="decor-plant-palm select-none">
          {/* Pot */}
          <circle r={radius * 0.35} fill="#78716c" stroke="#292524" strokeWidth="2" />

          {/* Radiating Tropical Palm Fronds */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            return (
              <g key={angle} transform={`rotate(${angle})`}>
                <path
                  d={`M 0 0 C 10 -15, ${radius * 0.6} -8, ${radius} 0 C ${radius * 0.6} 8, 10 15, 0 0 Z`}
                  fill="#15803d"
                  fillOpacity="0.85"
                  stroke="#14532d"
                  strokeWidth="1"
                />
                <line x1="0" y1="0" x2={radius * 0.9} y2="0" stroke="#86efac" strokeWidth="1" />
              </g>
            );
          })}

          <circle r="4" fill="#3f2305" />

          <text
            x="0"
            y={radius + 12}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#14532d"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'plant-box': {
      const bushSpacing = 22;
      const bushCount = Math.max(2, Math.floor(w / bushSpacing));

      return (
        <g className="decor-plant-box select-none">
          {/* Planter container trough */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#44403c"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="3"
          />
          {/* Dark rich soil */}
          <rect
            x={-hw + 3}
            y={-hh + 3}
            width={w - 6}
            height={h - 6}
            fill="#292524"
            rx="2"
          />

          {/* Lush Green Shrub / Bush Clusters along the box */}
          {Array.from({ length: bushCount }).map((_, i) => {
            const bx = -hw + 14 + i * ((w - 28) / (bushCount - 1 || 1));
            const bushRadius = Math.min(13, h * 0.48);
            return (
              <g key={i}>
                <circle
                  cx={bx}
                  cy="0"
                  r={bushRadius}
                  fill={i % 2 === 0 ? '#15803d' : '#16a34a'}
                  stroke="#14532d"
                  strokeWidth="0.8"
                />
                <circle
                  cx={bx - 2}
                  cy="-2"
                  r={bushRadius * 0.6}
                  fill="#22c55e"
                  fillOpacity="0.8"
                />
              </g>
            );
          })}

          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#ffffff"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    case 'plant-green-wall': {
      return (
        <g className="decor-plant-green-wall select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="url(#green-wall-pattern)"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="2"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#ffffff"
            className="pointer-events-none"
          >
            {el.name}
          </text>
        </g>
      );
    }

    // ----------------------------------------------------------------------
    // 5. RESTROOMS & VENUE FIXTURES
    // ----------------------------------------------------------------------
    case 'fixture-restrooms': {
      return (
        <g className="fixture-restrooms select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#0284c7"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="6"
          />
          {/* Gender & Accessible Graphic icons */}
          <text
            x="0"
            y="-2"
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#ffffff"
            className="pointer-events-none"
          >
            🚻 ♿
          </text>
          <text
            x="0"
            y="12"
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#e0f2fe"
            className="pointer-events-none"
          >
            RESTROOMS
          </text>
        </g>
      );
    }

    case 'fixture-kitchen': {
      return (
        <g className="fixture-kitchen select-none">
          {/* Stainless steel pass counter */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#475569"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="3"
          />
          {/* Heat lamp line & ticket rail */}
          <line x1={-hw + 10} y1="0" x2={hw - 10} y2="0" stroke="#f97316" strokeWidth="2" />
          <circle cx={-hw + 24} cy="0" r="3" fill="#f97316" />
          <circle cx="0" cy="0" r="3" fill="#f97316" />
          <circle cx={hw - 24} cy="0" r="3" fill="#f97316" />

          <text
            x="0"
            y={-6}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#ffffff"
            className="pointer-events-none"
          >
            🍳 Kitchen Pass Window
          </text>
          <text
            x="0"
            y={8}
            textAnchor="middle"
            fontSize="7"
            fontWeight="600"
            fill="#cbd5e1"
            className="pointer-events-none"
          >
            Order Pickup & Expeditor
          </text>
        </g>
      );
    }

    case 'fixture-host': {
      return (
        <g className="fixture-host select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#334155"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="5"
          />
          {/* Angled reservation book / tablet */}
          <rect
            x={-hw * 0.6}
            y={-hh * 0.6}
            width={w * 0.6}
            height={h * 0.6}
            fill="#e2e8f0"
            stroke="#0f172a"
            strokeWidth="1"
            rx="2"
          />
          <line x1="0" y1={-hh * 0.6} x2="0" y2={hh * 0.6} stroke="#94a3b8" strokeWidth="1" />
          <text
            x="0"
            y={hh + 12}
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#334155"
            className="pointer-events-none"
          >
            Host Stand
          </text>
        </g>
      );
    }

    case 'fixture-pos': {
      return (
        <g className="fixture-pos select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#475569"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="4"
          />
          {/* POS Touchscreen Monitor */}
          <rect
            x={-12}
            y={-10}
            width="24"
            height="14"
            rx="2"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="1.2"
          />
          <circle cx="0" cy="-3" r="3" fill="#38bdf8" />
          <text
            x="0"
            y={hh + 11}
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#475569"
            className="pointer-events-none"
          >
            POS Station
          </text>
        </g>
      );
    }

    case 'fixture-stage': {
      return (
        <g className="fixture-stage select-none">
          {/* Elevated Stage Riser */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#0f172a"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="4"
          />
          {/* Front Stage Steps edge line */}
          <line x1={-hw} y1={hh - 8} x2={hw} y2={hh - 8} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 2" />
          <text
            x="0"
            y="-4"
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#ffffff"
            className="pointer-events-none"
          >
            🎤 EVENT STAGE
          </text>
          <text
            x="0"
            y="10"
            textAnchor="middle"
            fontSize="8"
            fill="#94a3b8"
            className="pointer-events-none"
          >
            Presentation & Performance
          </text>
        </g>
      );
    }

    case 'fixture-dance-floor': {
      return (
        <g className="fixture-dance-floor select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="url(#parquet-pattern)"
            stroke="#b45309"
            strokeWidth="2.5"
            rx="4"
          />
          {/* Center Dance Floor emblem badge */}
          <rect
            x={-44}
            y={-10}
            width="88"
            height="20"
            rx="4"
            fill="#78350f"
            fillOpacity="0.85"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#fef3c7"
            className="pointer-events-none"
          >
            ✨ DANCE FLOOR
          </text>
        </g>
      );
    }

    case 'fixture-dj': {
      return (
        <g className="fixture-dj select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#1e1b4b"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="4"
          />
          {/* Dual Turntable Platters */}
          <circle cx={-18} cy="0" r="10" fill="#0f172a" stroke="#6366f1" strokeWidth="1.2" />
          <circle cx={-18} cy="0" r="3" fill="#ffffff" />

          <circle cx={18} cy="0" r="10" fill="#0f172a" stroke="#6366f1" strokeWidth="1.2" />
          <circle cx={18} cy="0" r="3" fill="#ffffff" />

          {/* Center audio mixer crossfader */}
          <rect x="-6" y="-8" width="12" height="16" fill="#312e81" rx="1" />
          <line x1="-3" y1="0" x2="3" y2="0" stroke="#a5b4fc" strokeWidth="1.5" />

          <text
            x="0"
            y={hh + 11}
            textAnchor="middle"
            fontSize="8"
            fontWeight="bold"
            fill="#4338ca"
            className="pointer-events-none"
          >
            DJ Console
          </text>
        </g>
      );
    }

    case 'fixture-bar': {
      return (
        <g className="fixture-bar select-none">
          {/* Wooden Bar Top Counter */}
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill={el.color || '#1e293b'}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="4"
          />
          {/* Underbar service speedrail line */}
          <line
            x1={-hw + 8}
            y1={-hh + 12}
            x2={hw - 8}
            y2={-hh + 12}
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          {/* Brass footrail guide */}
          <line
            x1={-hw + 8}
            y1={hh - 6}
            x2={hw - 8}
            y2={hh - 6}
            stroke="#d97706"
            strokeWidth="2"
          />
          <text
            x="0"
            y={-1}
            textAnchor="middle"
            fontSize={Math.min(12, Math.max(9, w / 16))}
            fontWeight="bold"
            fill="#ffffff"
            className="pointer-events-none"
          >
            {el.name}
          </text>
          {effectiveCovers > 0 && (
            <text
              x="0"
              y="11"
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="600"
              fill="#94a3b8"
              className="pointer-events-none"
            >
              {effectiveCovers} bar stools
            </text>
          )}
        </g>
      );
    }

    case 'decor-photo-backdrop': {
      return (
        <g className="decor-photo-backdrop select-none">
          <rect
            x={-hw}
            y={-hh}
            width={w}
            height={h}
            fill="#fdf2f8"
            stroke="#ec4899"
            strokeWidth={strokeWidth}
            rx="3"
          />
          {/* Floral Blossom Clusters along the top arch */}
          {[-hw + 12, -hw + 28, 0, hw - 28, hw - 12].map((fx, i) => (
            <circle key={i} cx={fx} cy={-hh + 4} r="4" fill="#f472b6" />
          ))}
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="bold"
            fill="#db2777"
            className="pointer-events-none"
          >
            🌸 Photo Backdrop & Floral Arch
          </text>
        </g>
      );
    }

    default:
      return null;
  }
};
