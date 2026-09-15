import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Check,
  ChevronRight,
  Ruler,
  Armchair,
  Layers,
  ArrowLeft,
  SlidersHorizontal,
  X,
  Plus,
  Square
} from 'lucide-react';
import { RoomTemplate } from '../types';
import { ROOM_TEMPLATES } from '../data/roomTemplates';

interface TemplatesModalProps {
  onSelectTemplate: (template: RoomTemplate) => void;
  onStartBlank: (name: string, venueType: string, width: number, height: number, unit: 'ft' | 'm') => void;
  onBackToEditor: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  onSelectTemplate,
  onStartBlank,
  onBackToEditor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'compact' | 'medium' | 'large'>('all');

  // Blank room card state
  const [blankRoomSize, setBlankRoomSize] = useState<{ width: number; height: number; label: string }>({
    width: 45,
    height: 35,
    label: 'Standard Dining'
  });

  const styles = ['all', ...Array.from(new Set(ROOM_TEMPLATES.map((t) => t.style)))];

  const filteredTemplates = ROOM_TEMPLATES.filter((tmpl) => {
    // Style check
    const matchesStyle = selectedStyle === 'all' || tmpl.style === selectedStyle;

    // Size check
    const maxDim = Math.max(tmpl.dimensions.width, tmpl.dimensions.height);
    let matchesSize = true;
    if (sizeFilter === 'compact') matchesSize = maxDim <= 35;
    else if (sizeFilter === 'medium') matchesSize = maxDim > 35 && maxDim <= 55;
    else if (sizeFilter === 'large') matchesSize = maxDim > 55;

    // Search query check
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      tmpl.name.toLowerCase().includes(q) ||
      tmpl.style.toLowerCase().includes(q) ||
      tmpl.description.toLowerCase().includes(q) ||
      `${tmpl.dimensions.width}x${tmpl.dimensions.height}`.includes(q) ||
      tmpl.tags.some((t) => t.toLowerCase().includes(q));

    return matchesStyle && matchesSize && matchesQuery;
  });

  return (
    <div id="templates-library-view" className="flex-1 h-full overflow-y-auto bg-slate-50 p-6 lg:p-10 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToEditor}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Designer
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Template Library
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-0.5">
                Pre-Arranged Room Templates
              </h1>
            </div>
          </div>

          {/* Direct Start Blank Header Action */}
          <button
            id="btn-templates-start-blank"
            onClick={() => onStartBlank('Blank Floor Plan', 'restaurant', blankRoomSize.width, blankRoomSize.height, 'ft')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition"
          >
            <Square className="w-4 h-4" />
            <span>Start from Blank Canvas</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="templates-search-bar"
                type="text"
                placeholder="Search templates by style, dimensions (e.g. 50x40, 45x35), venue type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Size Filters */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium mr-1 hidden sm:inline">Dimensions:</span>
              {(
                [
                  { id: 'all', label: 'All Sizes' },
                  { id: 'compact', label: 'Compact (<35 ft)' },
                  { id: 'medium', label: 'Medium (35-55 ft)' },
                  { id: 'large', label: 'Large (55+ ft)' }
                ] as const
              ).map((sz) => (
                <button
                  key={sz.id}
                  onClick={() => setSizeFilter(sz.id)}
                  className={`px-3 py-2 rounded-xl font-semibold transition ${
                    sizeFilter === sz.id
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-slate-100 pt-3">
            <span className="text-slate-500 font-medium mr-2 shrink-0">Style Categories:</span>
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 capitalize transition ${
                  selectedStyle === style
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Blank Canvas Card (Always available first) */}
          <div className="bg-linear-to-b from-indigo-50/60 via-white to-white rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden">
            {/* Visual Top */}
            <div className="p-5 border-b border-indigo-100 flex flex-col justify-between h-44 bg-slate-900 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              />

              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-indigo-600 text-white shadow-xs">
                  Empty Room
                </span>
                <span className="text-xs font-semibold text-indigo-200 bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-xs">
                  {blankRoomSize.width} × {blankRoomSize.height} ft
                </span>
              </div>

              <div className="z-10 text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 mx-auto flex items-center justify-center mb-1">
                  <Square className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-300">Clean Slate • Ready to Design</p>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Blank Canvas (Start from Scratch)
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Start with an empty room and place your tables, booths, and fixtures freely.
                </p>

                {/* Quick Dimensions Picker */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                    Room Size:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { width: 30, height: 25, label: '30×25 ft' },
                      { width: 45, height: 35, label: '45×35 ft' },
                      { width: 60, height: 45, label: '60×45 ft' },
                    ].map((sz) => (
                      <button
                        key={sz.label}
                        type="button"
                        onClick={() => setBlankRoomSize({ width: sz.width, height: sz.height, label: sz.label })}
                        className={`py-1.5 rounded-lg font-bold border transition ${
                          blankRoomSize.width === sz.width
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                id="btn-card-start-blank"
                onClick={() => onStartBlank('Blank Floor Plan', 'restaurant', blankRoomSize.width, blankRoomSize.height, 'ft')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Start with Blank Room</span>
              </button>
            </div>
          </div>

          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Header Visual Bar */}
              <div className="p-5 border-b border-slate-100 flex flex-col justify-between h-44 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden">
                {/* Background layout sketch preview */}
                <div className="absolute inset-0 opacity-15 flex items-center justify-center p-4">
                  <div className="w-full h-full border border-dashed border-white rounded-lg flex flex-wrap gap-2 p-2 items-center justify-center">
                    {template.elements.slice(0, 8).map((el, i) => (
                      <div
                        key={i}
                        className="rounded bg-white/40"
                        style={{
                          width: `${Math.min(32, el.width / 3)}px`,
                          height: `${Math.min(32, el.height / 3)}px`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-500/90 text-white shadow-xs">
                    {template.style}
                  </span>
                  <span className="text-xs font-semibold text-slate-300 bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-xs">
                    {template.dimensions.width} × {template.dimensions.height} {template.dimensions.unit}
                  </span>
                </div>

                <div className="z-10">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Body stats */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">CAPACITY</span>
                      <strong className="text-slate-900 font-bold">{template.capacity} seats</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">TABLES</span>
                      <strong className="text-slate-900 font-bold">{template.tableCount} tables</strong>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Apply Button */}
                <button
                  id={`btn-apply-template-${template.id}`}
                  onClick={() => onSelectTemplate(template)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 group-hover:bg-amber-600"
                >
                  <span>Load Layout into Designer</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Sparkles className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h3 className="text-base font-bold text-slate-800">No room templates found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your style category or dimensions filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
