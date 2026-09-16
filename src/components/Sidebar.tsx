import React, { useState } from 'react';
import {
  Armchair,
  Sparkles,
  Sliders,
  Settings2,
  Search,
  Plus,
  Circle,
  Square,
  RectangleHorizontal,
  Egg,
  Check,
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  Filter,
  Layers,
  ChevronRight,
  DoorOpen,
  DoorClosed,
  Columns3,
  Trees,
  Sprout,
  Sun,
  LayoutGrid,
  Wine,
  ChefHat,
  UserCheck,
  Laptop,
  Mic,
  Disc,
  Camera,
  ChevronsLeftRight,
  Split,
  Box,
  AlertTriangle
} from 'lucide-react';
import { FurniturePreset, FloorElement, FloorPlan, TableShape, TableStatus, RoomTemplate } from '../types';
import { FURNITURE_PRESETS } from '../data/furniturePresets';
import { ROOM_TEMPLATES } from '../data/roomTemplates';
import {
  getChairPositions,
  getCornerChairIndices,
  getEndChairIndices,
  getEffectiveCovers
} from '../utils/chairLayout';
import { clampElementPosition } from '../utils/geometry';

interface SidebarProps {
  floorPlan: FloorPlan;
  onUpdateFloorPlan: (updates: Partial<FloorPlan>) => void;
  selectedElementId: string | null;
  onUpdateElement: (element: FloorElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onAddPresetElement: (preset: FurniturePreset) => void;
  onApplyTemplate: (template: RoomTemplate) => void;
  onStartBlank?: () => void;
}

function getPresetIcon(preset: FurniturePreset) {
  switch (preset.icon) {
    case 'DoorOpen': return <DoorOpen className="w-5 h-5 text-amber-700" />;
    case 'DoorClosed': return <DoorClosed className="w-5 h-5 text-slate-700" />;
    case 'Columns3': return <Columns3 className="w-5 h-5 text-slate-700" />;
    case 'Trees': return <Trees className="w-5 h-5 text-emerald-600" />;
    case 'Sprout': return <Sprout className="w-5 h-5 text-emerald-500" />;
    case 'Sun': return <Sun className="w-5 h-5 text-amber-500" />;
    case 'LayoutGrid': return <LayoutGrid className="w-5 h-5 text-amber-700" />;
    case 'Layers': return <Layers className="w-5 h-5 text-slate-700" />;
    case 'Wine': return <Wine className="w-5 h-5 text-indigo-600" />;
    case 'ChefHat': return <ChefHat className="w-5 h-5 text-orange-600" />;
    case 'UserCheck': return <UserCheck className="w-5 h-5 text-blue-600" />;
    case 'Laptop': return <Laptop className="w-5 h-5 text-blue-600" />;
    case 'Mic': return <Mic className="w-5 h-5 text-purple-600" />;
    case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-500" />;
    case 'Disc': return <Disc className="w-5 h-5 text-violet-600" />;
    case 'Camera': return <Camera className="w-5 h-5 text-pink-500" />;
    case 'ChevronsLeftRight': return <ChevronsLeftRight className="w-5 h-5 text-cyan-600" />;
    case 'Split': return <Split className="w-5 h-5 text-blue-600" />;
    case 'Box': return <Box className="w-5 h-5 text-emerald-700" />;
    case 'AlertTriangle': return <AlertTriangle className="w-5 h-5 text-emerald-600" />;
    case 'Armchair': return <Armchair className="w-5 h-5 text-indigo-600" />;
    case 'Square': return <Square className="w-5 h-5 text-slate-700" />;
    case 'Circle': return <Circle className="w-5 h-5 text-slate-700" />;
    case 'Egg': return <Egg className="w-5 h-5 text-slate-700" />;
    case 'RectangleHorizontal': return <RectangleHorizontal className="w-5 h-5 text-slate-700" />;
    default:
      if (preset.category === 'decor') return <Sprout className="w-5 h-5 text-emerald-600" />;
      if (preset.category === 'outdoor') return <Sun className="w-5 h-5 text-amber-600" />;
      if (preset.category === 'architectural') return <Columns3 className="w-5 h-5 text-slate-700" />;
      if (preset.shape === 'round') return <Circle className="w-5 h-5 text-slate-700" />;
      if (preset.shape === 'square') return <Square className="w-5 h-5 text-slate-700" />;
      if (preset.shape === 'oval') return <Egg className="w-5 h-5 text-slate-700" />;
      return <RectangleHorizontal className="w-5 h-5 text-slate-700" />;
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  floorPlan,
  onUpdateFloorPlan,
  selectedElementId,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAddPresetElement,
  onApplyTemplate,
  onStartBlank
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'templates' | 'inspector' | 'room'>('library');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Templates search & filter
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [templateStyleFilter, setTemplateStyleFilter] = useState<string>('all');

  const selectedElement = floorPlan.elements.find((e) => e.id === selectedElementId);

  // Switch to inspector tab automatically when an element is clicked
  React.useEffect(() => {
    if (selectedElementId) {
      setActiveTab('inspector');
    }
  }, [selectedElementId]);

  // Filtered furniture presets
  const filteredPresets = FURNITURE_PRESETS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shape.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered room templates
  const filteredTemplates = ROOM_TEMPLATES.filter((tmpl) => {
    const matchesStyle = templateStyleFilter === 'all' || tmpl.style === templateStyleFilter;
    const searchLower = templateSearch.toLowerCase();
    const matchesSearch =
      tmpl.name.toLowerCase().includes(searchLower) ||
      tmpl.style.toLowerCase().includes(searchLower) ||
      tmpl.description.toLowerCase().includes(searchLower) ||
      `${tmpl.dimensions.width}x${tmpl.dimensions.height}`.includes(searchLower) ||
      tmpl.tags.some((t) => t.toLowerCase().includes(searchLower));
    return matchesStyle && matchesSearch;
  });

  // Unique template styles for filter
  const templateStyles = ['all', ...Array.from(new Set(ROOM_TEMPLATES.map((t) => t.style)))];

  // Drag start from sidebar
  const handleDragStart = (e: React.DragEvent, presetId: string) => {
    e.dataTransfer.setData('text/preset-id', presetId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside id="app-sidebar" className="w-80 lg:w-88 h-full bg-white border-r border-slate-200 flex flex-col shrink-0 select-none z-20">
      {/* Sidebar Top Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1 gap-1">
        <button
          id="tab-btn-library"
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'library'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Armchair className="w-3.5 h-3.5 text-indigo-600" />
          Furniture
        </button>

        <button
          id="tab-btn-templates"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'templates'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Templates
        </button>

        <button
          id="tab-btn-inspector"
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'inspector'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          Inspector
          {selectedElement && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
          )}
        </button>

        <button
          id="tab-btn-room"
          onClick={() => setActiveTab('room')}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
            activeTab === 'room'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Room Dimensions & Settings"
        >
          <Settings2 className="w-3.5 h-3.5 text-slate-600" />
        </button>
      </div>

      {/* Tab 1: FURNITURE & TABLES LIBRARY */}
      {activeTab === 'library' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-furniture"
                type="text"
                placeholder="Search tables, booths, bars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'tables', label: 'Tables' },
                { id: 'architectural', label: 'Walls & Doors' },
                { id: 'outdoor', label: 'Decks & Patio' },
                { id: 'decor', label: 'Plants & Decor' },
                { id: 'fixtures', label: 'Fixtures & Bar' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full font-medium shrink-0 transition ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preset list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-[11px] text-slate-400 font-medium px-1">
              Drag item onto canvas or click to add
            </p>

            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                draggable
                onDragStart={(e) => handleDragStart(e, preset.id)}
                onClick={() => onAddPresetElement(preset)}
                className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  {/* Shape Icon Preview */}
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                    {getPresetIcon(preset)}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                        {preset.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {preset.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  {preset.type === 'table' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {preset.defaultCovers} covers
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {Math.round(preset.defaultWidth / 20)}×{Math.round(preset.defaultHeight / 20)} ft
                  </span>
                </div>
              </div>
            ))}

            {filteredPresets.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No items match "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: ROOM TEMPLATES (Searchable by Style & Dimensions) */}
      {activeTab === 'templates' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-templates"
                type="text"
                placeholder="Search by style, dimensions (e.g. 50x40)..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>

            {/* Style Filters */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 text-[11px]">
              {templateStyles.map((style) => (
                <button
                  key={style}
                  onClick={() => setTemplateStyleFilter(style)}
                  className={`px-2.5 py-1 rounded-full font-medium shrink-0 capitalize transition ${
                    templateStyleFilter === style
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Start Blank Room Card */}
            <div className="bg-linear-to-br from-indigo-50/90 via-white to-blue-50/80 rounded-xl border-2 border-indigo-200 p-3 flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Custom Blank
                </span>
                <span className="text-[11px] font-semibold text-indigo-600">
                  0 Items
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-950">
                  Start from a Blank Room
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Begin with an empty room layout and customize tables, covers, and dimensions.
                </p>
              </div>
              {onStartBlank && (
                <button
                  id="btn-sidebar-start-blank"
                  onClick={onStartBlank}
                  className="w-full mt-0.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Start Blank Floor Plan
                </button>
              )}
            </div>

            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-xs p-3 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                      {template.style}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">
                      {template.name}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    {template.dimensions.width}×{template.dimensions.height} {template.dimensions.unit}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {template.description}
                </p>

                {/* Capacity & Tables stats */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-slate-600">
                    <span><strong>{template.capacity}</strong> Seats</span>
                    <span>•</span>
                    <span><strong>{template.tableCount}</strong> Tables</span>
                  </div>

                  <button
                    id={`btn-load-tmpl-${template.id}`}
                    onClick={() => onApplyTemplate(template)}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    Apply Layout
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No templates found matching your search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: INSPECTOR (Selected Element) */}
      {activeTab === 'inspector' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedElement ? (
            <>
              {/* Element Title & ID */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Element Properties
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    ID: {selectedElement.id}
                  </span>
                </div>
                <button
                  onClick={() => onUpdateElement({ ...selectedElement, locked: !selectedElement.locked })}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 font-medium transition ${
                    selectedElement.locked
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {selectedElement.locked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-600" /> Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> Unlocked
                    </>
                  )}
                </button>
              </div>

              {/* 1. Name / Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Table / Fixture Name
                </label>
                <input
                  id="input-elem-name"
                  type="text"
                  value={selectedElement.name}
                  onChange={(e) => onUpdateElement({ ...selectedElement, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* 2. Shape Selector */}
              {selectedElement.type === 'table' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Table Shape
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'round', label: 'Round', icon: Circle },
                        { id: 'square', label: 'Square', icon: Square },
                        { id: 'rectangle', label: 'Rectangle', icon: RectangleHorizontal },
                        { id: 'oval', label: 'Oval', icon: Egg },
                        { id: 'booth', label: 'Booth', icon: Armchair },
                        { id: 'bar', label: 'Bar', icon: Layers }
                      ] as const
                    ).map((shapeItem) => {
                      const Icon = shapeItem.icon;
                      const isCurr = selectedElement.shape === shapeItem.id;
                      return (
                        <button
                          key={shapeItem.id}
                          onClick={() => onUpdateElement({ ...selectedElement, shape: shapeItem.id })}
                          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-medium transition ${
                            isCurr
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {shapeItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Number of Chairs / Covers (Key Requirement!) */}
              {selectedElement.type === 'table' && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Armchair className="w-4 h-4 text-indigo-600" />
                      Number of Chairs (Covers)
                    </label>
                    <span className="text-sm font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                      {selectedElement.covers} total
                    </span>
                  </div>

                  {/* Slider */}
                  <input
                    id="slider-covers"
                    type="range"
                    min="0"
                    max="24"
                    value={selectedElement.covers}
                    onChange={(e) => {
                      const newCovers = Number(e.target.value);
                      onUpdateElement({
                        ...selectedElement,
                        covers: newCovers,
                        removedChairs: selectedElement.removedChairs?.filter((idx) => idx < newCovers)
                      });
                    }}
                    className="w-full accent-indigo-600 cursor-pointer mt-1"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100/80">
                    <span className="text-[10px] font-medium text-indigo-600">Quick set:</span>
                    <div className="flex gap-1">
                      {[2, 4, 6, 8, 10, 12].map((cnt) => (
                        <button
                          key={cnt}
                          onClick={() =>
                            onUpdateElement({
                              ...selectedElement,
                              covers: cnt,
                              removedChairs: selectedElement.removedChairs?.filter((idx) => idx < cnt)
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            selectedElement.covers === cnt
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3b. Chair Arrangement & Corner Seating Controls (Key Feature!) */}
              {selectedElement.type === 'table' && selectedElement.covers > 0 && (() => {
                const effectiveCovers = getEffectiveCovers(selectedElement.covers, selectedElement.removedChairs);
                const tableChairs = getChairPositions(selectedElement.shape, selectedElement.width, selectedElement.height, selectedElement.covers);
                const cornerIndices = getCornerChairIndices(selectedElement.shape, selectedElement.width, selectedElement.height, selectedElement.covers);
                const areCornersRemoved = cornerIndices.length > 0 && cornerIndices.every((idx) => selectedElement.removedChairs?.includes(idx));
                const endIndices = getEndChairIndices(selectedElement.shape, selectedElement.width, selectedElement.height, selectedElement.covers);
                const areEndsRemoved = endIndices.length > 0 && endIndices.every((idx) => selectedElement.removedChairs?.includes(idx));
                const removedCount = selectedElement.removedChairs?.length || 0;

                const toggleCornerChairs = () => {
                  if (cornerIndices.length === 0) return;
                  const current = selectedElement.removedChairs || [];
                  const allCornersOut = cornerIndices.every((idx) => current.includes(idx));
                  const next = allCornersOut
                    ? current.filter((idx) => !cornerIndices.includes(idx))
                    : Array.from(new Set([...current, ...cornerIndices]));
                  onUpdateElement({ ...selectedElement, removedChairs: next });
                };

                const toggleEndChairs = () => {
                  if (endIndices.length === 0) return;
                  const current = selectedElement.removedChairs || [];
                  const allEndsOut = endIndices.every((idx) => current.includes(idx));
                  const next = allEndsOut
                    ? current.filter((idx) => !endIndices.includes(idx))
                    : Array.from(new Set([...current, ...endIndices]));
                  onUpdateElement({ ...selectedElement, removedChairs: next });
                };

                const toggleSingleChair = (chairIdx: number) => {
                  const current = selectedElement.removedChairs || [];
                  const next = current.includes(chairIdx)
                    ? current.filter((i) => i !== chairIdx)
                    : [...current, chairIdx];
                  onUpdateElement({ ...selectedElement, removedChairs: next });
                };

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Chair Layout & Removal
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {effectiveCovers} of {selectedElement.covers} seats active
                          {removedCount > 0 && (
                            <span className="text-rose-600 font-bold ml-1">
                              ({removedCount} removed)
                            </span>
                          )}
                        </p>
                      </div>
                      {removedCount > 0 && (
                        <button
                          id="btn-restore-all-chairs-sidebar"
                          onClick={() => onUpdateElement({ ...selectedElement, removedChairs: [] })}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                        >
                          Restore All
                        </button>
                      )}
                    </div>

                    {/* Quick Removal Buttons: Corners & Ends */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        id="btn-sidebar-toggle-corner-chairs"
                        onClick={toggleCornerChairs}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          areCornersRemoved
                            ? 'bg-amber-100/80 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Armchair className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{areCornersRemoved ? 'Restore Corners' : 'Remove Corners'}</span>
                      </button>

                      {(selectedElement.shape === 'rectangle' || selectedElement.shape === 'oval' || selectedElement.shape === 'square') && (
                        <button
                          id="btn-sidebar-toggle-end-chairs"
                          onClick={toggleEndChairs}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            areEndsRemoved
                              ? 'bg-amber-100/80 border-amber-300 text-amber-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{areEndsRemoved ? 'Restore Ends' : 'Remove Ends'}</span>
                        </button>
                      )}
                    </div>

                    {/* Seat-by-Seat Matrix */}
                    <div className="pt-1">
                      <span className="text-[11px] font-medium text-slate-500 block mb-1">
                        Individual Seats (Click to remove/restore):
                      </span>
                      <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1">
                        {tableChairs.map((ch) => {
                          const isRemoved = selectedElement.removedChairs?.includes(ch.index);
                          return (
                            <button
                              key={ch.index}
                              onClick={() => toggleSingleChair(ch.index)}
                              className={`px-2 py-1 rounded text-[10.5px] font-medium border flex items-center justify-between transition ${
                                isRemoved
                                  ? 'bg-rose-50 border-rose-200 text-rose-500 line-through opacity-70'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                              }`}
                            >
                              <span className="truncate max-w-[85px]">{ch.label || `Seat ${ch.index + 1}`}</span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                  isRemoved ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isRemoved ? 'Off' : 'On'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      💡 Tip: You can also click directly on any chair on the canvas to remove or restore it.
                    </p>
                  </div>
                );
              })()}

              {/* 4. Table Status */}
              {selectedElement.type === 'table' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Table Status
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'available', label: 'Available', dot: 'bg-emerald-500', bg: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                        { id: 'reserved', label: 'Reserved', dot: 'bg-amber-500', bg: 'text-amber-700 bg-amber-50 border-amber-200' },
                        { id: 'occupied', label: 'Occupied', dot: 'bg-blue-500', bg: 'text-blue-700 bg-blue-50 border-blue-200' },
                        { id: 'vip', label: 'VIP Reserved', dot: 'bg-purple-500', bg: 'text-purple-700 bg-purple-50 border-purple-200' }
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        onClick={() => onUpdateElement({ ...selectedElement, status: st.id })}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                          selectedElement.status === st.id
                            ? `${st.bg} font-bold ring-1 ring-slate-400`
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Guest / Party Name */}
              {selectedElement.type === 'table' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Guest / Reservation Party
                  </label>
                  <input
                    id="input-guest-name"
                    type="text"
                    placeholder="e.g. Dupont Anniversary (4)"
                    value={selectedElement.guestName || ''}
                    onChange={(e) => onUpdateElement({ ...selectedElement, guestName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              )}

              {/* 6. Special Notes / Dietary */}
              {selectedElement.type === 'table' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Notes & Requests
                  </label>
                  <textarea
                    id="textarea-notes"
                    rows={2}
                    placeholder="e.g. High chair needed, bottle of champagne on arrival"
                    value={selectedElement.notes || ''}
                    onChange={(e) => onUpdateElement({ ...selectedElement, notes: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                  />
                </div>
              )}

              {/* 7. Dimensions & Rotation */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Width (px)
                    </label>
                    <input
                      id="input-width"
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => onUpdateElement({ ...selectedElement, width: Math.max(20, Number(e.target.value)) })}
                      className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Height (px)
                    </label>
                    <input
                      id="input-height"
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => onUpdateElement({ ...selectedElement, height: Math.max(20, Number(e.target.value)) })}
                      className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Rotation</span>
                    <span className="font-mono text-indigo-600 font-bold">{selectedElement.rotation || 0}°</span>
                  </div>
                  <input
                    id="slider-rotation"
                    type="range"
                    min="0"
                    max="359"
                    value={selectedElement.rotation || 0}
                    onChange={(e) => {
                      const newRot = Number(e.target.value);
                      const clamped = clampElementPosition(
                        selectedElement.x,
                        selectedElement.y,
                        selectedElement.width,
                        selectedElement.height,
                        newRot,
                        floorPlan.roomWidth * 20,
                        floorPlan.roomHeight * 20,
                        8
                      );
                      onUpdateElement({
                        ...selectedElement,
                        rotation: newRot,
                        x: clamped.x,
                        y: clamped.y
                      });
                    }}
                    className="w-full accent-indigo-600"
                  />

                  {/* Quick Rotation Orientation Presets */}
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => {
                          const clamped = clampElementPosition(
                            selectedElement.x,
                            selectedElement.y,
                            selectedElement.width,
                            selectedElement.height,
                            deg,
                            floorPlan.roomWidth * 20,
                            floorPlan.roomHeight * 20,
                            8
                          );
                          onUpdateElement({
                            ...selectedElement,
                            rotation: deg,
                            x: clamped.x,
                            y: clamped.y
                          });
                        }}
                        className={`py-1 text-[10px] font-semibold rounded-md border transition ${
                          (selectedElement.rotation || 0) === deg
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                        title={deg === 0 ? 'Horizontal (0°)' : deg === 90 ? 'Vertical (90°)' : `${deg}°`}
                      >
                        {deg}°
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const nextRot = ((selectedElement.rotation || 0) + 90) % 360;
                        const clamped = clampElementPosition(
                          selectedElement.x,
                          selectedElement.y,
                          selectedElement.width,
                          selectedElement.height,
                          nextRot,
                          floorPlan.roomWidth * 20,
                          floorPlan.roomHeight * 20,
                          8
                        );
                        onUpdateElement({
                          ...selectedElement,
                          rotation: nextRot,
                          x: clamped.x,
                          y: clamped.y
                        });
                      }}
                      className="py-1 text-[10px] font-bold rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center gap-0.5"
                      title="Rotate +90°"
                    >
                      <RotateCw className="w-2.5 h-2.5" />
                      <span>+90</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  id="btn-sidebar-duplicate"
                  onClick={() => onDuplicateElement(selectedElement.id)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </button>
                <button
                  id="btn-sidebar-delete"
                  onClick={() => onDeleteElement(selectedElement.id)}
                  className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">No element selected</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                Click any table or fixture on the floor plan to customize chairs, status, and dimensions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: ROOM SETTINGS */}
      {activeTab === 'room' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
            Room Boundary & Units
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Floor Plan Name
            </label>
            <input
              id="input-room-name"
              type="text"
              value={floorPlan.name}
              onChange={(e) => onUpdateFloorPlan({ name: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Venue Type
            </label>
            <select
              id="select-venue-type"
              value={floorPlan.venueType}
              onChange={(e) => onUpdateFloorPlan({ venueType: e.target.value as any })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="restaurant">Restaurant / Dining</option>
              <option value="banquet">Banquet & Wedding</option>
              <option value="cafe">Cafe & Bistro</option>
              <option value="lounge">Cocktail Lounge & Bar</option>
              <option value="conference">Conference / Corporate</option>
              <option value="outdoor">Outdoor / Terrace</option>
            </select>
          </div>

          {/* Room Width & Height */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Width ({floorPlan.unit})
              </label>
              <input
                id="input-room-width"
                type="number"
                min="10"
                max="200"
                value={floorPlan.roomWidth}
                onChange={(e) => onUpdateFloorPlan({ roomWidth: Math.max(10, Number(e.target.value)) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Height ({floorPlan.unit})
              </label>
              <input
                id="input-room-height"
                type="number"
                min="10"
                max="200"
                value={floorPlan.roomHeight}
                onChange={(e) => onUpdateFloorPlan({ roomHeight: Math.max(10, Number(e.target.value)) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Unit Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Measurement Unit
            </label>
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                id="btn-unit-ft"
                onClick={() => onUpdateFloorPlan({ unit: 'ft' })}
                className={`flex-1 py-1 rounded text-xs font-bold transition ${
                  floorPlan.unit === 'ft' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Feet (ft)
              </button>
              <button
                id="btn-unit-m"
                onClick={() => onUpdateFloorPlan({ unit: 'm' })}
                className={`flex-1 py-1 rounded text-xs font-bold transition ${
                  floorPlan.unit === 'm' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
                }`}
              >
                Meters (m)
              </button>
            </div>
          </div>

          {/* Blank Plan & Clear elements */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {onStartBlank && (
              <button
                id="btn-room-new-blank"
                onClick={onStartBlank}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Start New Blank Floor Plan
              </button>
            )}

            <button
              id="btn-clear-canvas"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all tables and items from this floor plan?')) {
                  onUpdateFloorPlan({ elements: [] });
                }
              }}
              className="w-full py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition border border-slate-200 hover:border-rose-200"
            >
              Clear All Tables & Items
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
