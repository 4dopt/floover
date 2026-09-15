import React, { useState } from 'react';
import {
  Plus,
  Square,
  Sparkles,
  Maximize2,
  X,
  Check,
  Building2,
  Utensils,
  Wine,
  Coffee,
  PartyPopper,
  Presentation
} from 'lucide-react';

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBlank: (name: string, venueType: string, width: number, height: number, unit: 'ft' | 'm') => void;
  onOpenTemplates: () => void;
}

const ROOM_SIZE_PRESETS = [
  { id: 'compact', label: 'Compact / Bistro', width: 30, height: 25, desc: 'Small cafe, private dining, or cozy bar' },
  { id: 'standard', label: 'Standard Dining', width: 45, height: 35, desc: 'Typical restaurant dining room' },
  { id: 'large', label: 'Large Venue', width: 60, height: 45, desc: 'Lounge, cocktail club, or large eatery' },
  { id: 'grand', label: 'Grand Banquet', width: 80, height: 50, desc: 'Ballroom, gala, wedding reception hall' },
  { id: 'custom', label: 'Custom Dimensions', width: 50, height: 40, desc: 'Specify exact room dimensions' },
];

const VENUE_TYPES = [
  { id: 'restaurant', label: 'Restaurant', icon: Utensils },
  { id: 'banquet', label: 'Banquet & Wedding', icon: PartyPopper },
  { id: 'lounge', label: 'Lounge & Bar', icon: Wine },
  { id: 'cafe', label: 'Cafe & Bistro', icon: Coffee },
  { id: 'conference', label: 'Corporate & Conference', icon: Presentation },
  { id: 'outdoor', label: 'Outdoor Patio', icon: Building2 },
];

export const NewPlanModal: React.FC<NewPlanModalProps> = ({
  isOpen,
  onClose,
  onStartBlank,
  onOpenTemplates
}) => {
  const [name, setName] = useState('New Floor Plan');
  const [venueType, setVenueType] = useState('restaurant');
  const [unit, setUnit] = useState<'ft' | 'm'>('ft');
  const [selectedSizePreset, setSelectedSizePreset] = useState('standard');
  const [customWidth, setCustomWidth] = useState(45);
  const [customHeight, setCustomHeight] = useState(35);

  if (!isOpen) return null;

  const handleSizePresetSelect = (presetId: string) => {
    setSelectedSizePreset(presetId);
    const found = ROOM_SIZE_PRESETS.find((p) => p.id === presetId);
    if (found && presetId !== 'custom') {
      setCustomWidth(found.width);
      setCustomHeight(found.height);
    }
  };

  const handleCreateBlank = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Untitled Blank Floor Plan';
    onStartBlank(finalName, venueType, customWidth, customHeight, unit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Create New Floor Plan
              </h2>
              <p className="text-xs text-slate-500">
                Start from a completely blank room or choose from pre-arranged templates.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Start Blank vs Browse Templates choices */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <Square className="w-4 h-4 text-indigo-600" />
                  Start Blank Canvas
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                  Blank
                </span>
              </div>
              <p className="text-[11px] text-indigo-900/80 mt-1">
                Empty room grid ready for you to drag and drop custom tables and furniture.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTemplates();
            }}
            className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-amber-50/60 hover:border-amber-300 text-left transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Use Room Template
                </span>
                <span className="text-[10px] font-medium text-slate-500 group-hover:text-amber-700">
                  Pre-built
                </span>
              </div>
              <p className="text-[11px] text-slate-500 group-hover:text-amber-800 mt-1">
                Browse pre-arranged layouts for bistros, banquets, and cocktail lounges.
              </p>
            </div>
          </button>
        </div>

        <form onSubmit={handleCreateBlank} className="space-y-4 pt-1">
          {/* Floor Plan Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Floor Plan Name
            </label>
            <input
              id="input-blank-plan-name"
              type="text"
              required
              placeholder="e.g. Main Dining Room - Ground Floor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Venue Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Venue Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {VENUE_TYPES.map((v) => {
                const Icon = v.icon;
                const isSelected = venueType === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVenueType(v.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room Dimensions & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Room Dimensions & Size Preset
              </label>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUnit('ft')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    unit === 'ft' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Feet (ft)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('m')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    unit === 'm' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Meters (m)
                </button>
              </div>
            </div>

            {/* Presets chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
              {ROOM_SIZE_PRESETS.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSizePresetSelect(p.id)}
                  className={`p-2 rounded-xl border text-left transition ${
                    selectedSizePreset === p.id
                      ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-xs font-bold text-slate-900">
                    {p.width} × {p.height} {unit}
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate mt-0.5">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Manual Dimensions Input */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Width ({unit})
                </label>
                <input
                  id="input-blank-width"
                  type="number"
                  min="15"
                  max="200"
                  value={customWidth}
                  onChange={(e) => {
                    setCustomWidth(Number(e.target.value));
                    setSelectedSizePreset('custom');
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Length / Height ({unit})
                </label>
                <input
                  id="input-blank-height"
                  type="number"
                  min="15"
                  max="200"
                  value={customHeight}
                  onChange={(e) => {
                    setCustomHeight(Number(e.target.value));
                    setSelectedSizePreset('custom');
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              id="btn-confirm-start-blank"
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              Start with Blank Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
