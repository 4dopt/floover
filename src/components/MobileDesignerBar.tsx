import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Layers,
  Settings2,
  Box,
  Trash2,
  Copy,
  RotateCw,
  Lock,
  Unlock,
  X,
  Sliders,
  Armchair,
  Eye,
  Check,
  Search,
  Maximize2,
  Tag,
  Circle,
  Square,
  RectangleHorizontal,
  Egg,
  DoorOpen,
  DoorClosed,
  Columns3,
  Trees,
  Sprout,
  Sun,
  LayoutGrid,
  Wine,
  ChefHat,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { FloorElement, FloorPlan, FurniturePreset, RoomTemplate, TableShape, TableStatus } from '../types';
import { FURNITURE_PRESETS } from '../data/furniturePresets';
import { ROOM_TEMPLATES } from '../data/roomTemplates';
import {
  getCornerChairIndices,
  getEndChairIndices,
  getEffectiveCovers
} from '../utils/chairLayout';

interface MobileDesignerBarProps {
  floorPlan: FloorPlan;
  onUpdateFloorPlan?: (updates: Partial<FloorPlan>) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (element: FloorElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onAddPresetElement: (preset: FurniturePreset) => void;
  onApplyTemplate: (template: RoomTemplate) => void;
  is3DMode?: boolean;
  onToggle3D?: () => void;
  onOpenRoomShapeModal?: () => void;
  showGrid?: boolean;
  setShowGrid?: (val: boolean) => void;
  snapToGrid?: boolean;
  setSnapToGrid?: (val: boolean) => void;
  onFitToScreen?: () => void;
}

export const MobileDesignerBar: React.FC<MobileDesignerBarProps> = ({
  floorPlan,
  onUpdateFloorPlan,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAddPresetElement,
  onApplyTemplate,
  is3DMode = false,
  onToggle3D,
  onOpenRoomShapeModal,
  showGrid = true,
  setShowGrid,
  snapToGrid = true,
  setSnapToGrid,
  onFitToScreen
}) => {
  // Mobile drawer states
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'add' | 'templates' | 'layers' | 'room' | 'elementDetail'>('none');
  const [addCategory, setAddCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedElement = floorPlan.elements.find((e) => e.id === selectedElementId);

  // Filtered furniture presets for mobile add drawer
  const filteredPresets = FURNITURE_PRESETS.filter((item) => {
    const isSeating =
      item.category === 'seating' ||
      item.shape === 'booth' ||
      item.type === 'chair';

    const isTables =
      item.category === 'tables' &&
      item.shape !== 'booth' &&
      item.type !== 'chair';

    const matchesCategory =
      addCategory === 'all' ||
      (addCategory === 'seating' && isSeating) ||
      (addCategory === 'tables' && isTables) ||
      (addCategory !== 'seating' && addCategory !== 'tables' && item.category === addCategory);

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Handle adding preset and closing drawer
  const handleSelectPreset = (preset: FurniturePreset) => {
    onAddPresetElement(preset);
    setActiveDrawer('none');
  };

  // Quick cover delta
  const handleCoverDelta = (delta: number) => {
    if (!selectedElement) return;
    const newCovers = Math.max(0, Math.min(32, selectedElement.covers + delta));
    onUpdateElement({
      ...selectedElement,
      covers: newCovers,
      removedChairs: selectedElement.removedChairs?.filter((idx) => idx < newCovers)
    });
  };

  // Quick rotate +45°
  const handleQuickRotate = () => {
    if (!selectedElement) return;
    const nextRot = ((selectedElement.rotation || 0) + 45) % 360;
    onUpdateElement({
      ...selectedElement,
      rotation: nextRot
    });
  };

  // Corner chairs toggle
  const handleToggleCornerChairs = () => {
    if (!selectedElement) return;
    const corners = getCornerChairIndices(
      selectedElement.shape,
      selectedElement.width,
      selectedElement.height,
      selectedElement.covers
    );
    if (corners.length === 0) return;
    const current = selectedElement.removedChairs || [];
    const allRemoved = corners.every((c) => current.includes(c));
    let next: number[];
    if (allRemoved) {
      next = current.filter((c) => !corners.includes(c));
    } else {
      next = Array.from(new Set([...current, ...corners]));
    }
    onUpdateElement({
      ...selectedElement,
      removedChairs: next
    });
  };

  return (
    <div id="mobile-designer-container" className="md:hidden">
      {/* 1. Selected Element Quick Action Floating Bar */}
      {selectedElement && activeDrawer === 'none' && (
        <div className="fixed bottom-16 left-2 right-2 z-40 bg-slate-900/95 text-white backdrop-blur-md px-3 py-2 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-2 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Element Info & Seats */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/50 border border-indigo-400/40 flex items-center justify-center shrink-0">
              <Armchair className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <div className="truncate max-w-[90px] xs:max-w-[120px]">
              <span className="block text-xs font-bold text-white truncate leading-tight">
                {selectedElement.name}
              </span>
              <span className="block text-[10px] text-slate-400 capitalize">
                {selectedElement.status} • {selectedElement.covers} seats
              </span>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Covers Stepper (for tables) */}
            {selectedElement.type === 'table' && (
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => handleCoverDelta(-1)}
                  disabled={selectedElement.covers <= 0}
                  className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 active:scale-95 font-black text-xs"
                  title="Remove seat"
                >
                  -
                </button>
                <span className="text-[11px] font-extrabold text-indigo-300 px-1 min-w-[20px] text-center">
                  {selectedElement.covers}
                </span>
                <button
                  onClick={() => handleCoverDelta(1)}
                  disabled={selectedElement.covers >= 24}
                  className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 active:scale-95 font-black text-xs"
                  title="Add seat"
                >
                  +
                </button>
              </div>
            )}

            {/* Quick Rotate */}
            <button
              onClick={handleQuickRotate}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition"
              title="Rotate 45°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Corner Chairs Toggle (square/rectangle tables) */}
            {selectedElement.type === 'table' && (selectedElement.shape === 'square' || selectedElement.shape === 'rectangle') && selectedElement.covers >= 4 && (
              <button
                onClick={handleToggleCornerChairs}
                className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-amber-300 active:scale-95 transition"
                title="Toggle corner chairs"
              >
                Corners
              </button>
            )}

            {/* Duplicate */}
            <button
              onClick={() => onDuplicateElement(selectedElement.id)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition"
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDeleteElement(selectedElement.id)}
              className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 active:scale-95 transition"
              title="Delete element"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* More / Full Details */}
            <button
              onClick={() => setActiveDrawer('elementDetail')}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] active:scale-95 transition"
              title="Full Element Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Deselect */}
            <button
              onClick={() => onSelectElement(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
              title="Deselect"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Mobile Bottom Dock Toolbar (Canva-style) */}
      <nav
        id="mobile-bottom-dock"
        className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 flex items-center justify-around select-none shadow-lg"
      >
        {/* + Add (Canva primary action) */}
        <button
          id="btn-mobile-dock-add"
          onClick={() => setActiveDrawer(activeDrawer === 'add' ? 'none' : 'add')}
          className={`flex flex-col items-center justify-center -mt-4 transition group ${
            activeDrawer === 'add' ? 'scale-105' : 'hover:scale-105'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center ring-4 ring-white group-active:bg-indigo-700">
            <Plus className={`w-6 h-6 transition-transform ${activeDrawer === 'add' ? 'rotate-45' : ''}`} />
          </div>
          <span className="text-[10px] font-bold text-indigo-700 mt-0.5">Add</span>
        </button>

        {/* Templates */}
        <button
          id="btn-mobile-dock-templates"
          onClick={() => setActiveDrawer(activeDrawer === 'templates' ? 'none' : 'templates')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition ${
            activeDrawer === 'templates' ? 'text-indigo-600' : 'text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-semibold mt-1">Templates</span>
        </button>

        {/* Tables / Layers */}
        <button
          id="btn-mobile-dock-layers"
          onClick={() => setActiveDrawer(activeDrawer === 'layers' ? 'none' : 'layers')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition relative ${
            activeDrawer === 'layers' ? 'text-indigo-600' : 'text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-1">Tables</span>
          {floorPlan.elements.length > 0 && (
            <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold flex items-center justify-center">
              {floorPlan.elements.length}
            </span>
          )}
        </button>

        {/* Room Settings */}
        <button
          id="btn-mobile-dock-room"
          onClick={() => setActiveDrawer(activeDrawer === 'room' ? 'none' : 'room')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition ${
            activeDrawer === 'room' ? 'text-indigo-600' : 'text-slate-600'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-1">Room</span>
        </button>

        {/* 3D Walkthrough Toggle */}
        {onToggle3D && (
          <button
            id="btn-mobile-dock-3d"
            onClick={onToggle3D}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition ${
              is3DMode ? 'text-indigo-600' : 'text-slate-600'
            }`}
          >
            <Box className={`w-4 h-4 ${is3DMode ? 'text-indigo-600' : 'text-slate-600'}`} />
            <span className="text-[10px] font-semibold mt-1">{is3DMode ? '2D View' : '3D View'}</span>
          </button>
        )}
      </nav>

      {/* 3. Backdrop for Open Drawers */}
      {activeDrawer !== 'none' && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-xs transition-opacity"
          onClick={() => setActiveDrawer('none')}
        />
      )}

      {/* 4. Drawer: + ADD FURNITURE & TABLES (Canva-style Bottom Sheet) */}
      {activeDrawer === 'add' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-250">
          {/* Drawer Drag Pill & Header */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto -mt-1 mb-2" />
              <h3 className="text-base font-extrabold text-slate-900">Add to Floor Plan</h3>
              <p className="text-[11px] text-slate-500">Tap any item to place it onto the canvas center.</p>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Category Pills */}
          <div className="p-3 space-y-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tables, booths, bars, plants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'tables', label: 'Tables' },
                { id: 'seating', label: 'Booths & Chairs' },
                { id: 'fixtures', label: 'Bars & Stages' },
                { id: 'architectural', label: 'Walls & Doors' },
                { id: 'decor', label: 'Plants & Decor' },
                { id: 'outdoor', label: 'Patio' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setAddCategory(cat.id)}
                  className={`px-3 py-1 rounded-full font-bold whitespace-nowrap text-[11px] transition ${
                    addCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Items Grid */}
          <div className="p-3 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-8">
            {filteredPresets.length === 0 ? (
              <div className="col-span-full py-10 flex flex-col items-center justify-center text-center text-slate-400">
                <Armchair className="w-10 h-10 mb-2 text-slate-300 stroke-1" />
                <p className="text-xs font-semibold text-slate-600">No matching items</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search or switching categories</p>
                <button
                  onClick={() => {
                    setAddCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
                >
                  View All Items
                </button>
              </div>
            ) : (
              filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-400 active:bg-indigo-50/50 shadow-2xs transition flex flex-col items-center text-center cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-200 flex items-center justify-center text-slate-700 group-hover:text-indigo-600 transition mb-1.5">
                    {preset.category === 'seating' || preset.shape === 'booth' || preset.type === 'chair' ? (
                      <Armchair className="w-5 h-5 text-indigo-600" />
                    ) : preset.category === 'decor' ? (
                      <Sprout className="w-5 h-5 text-emerald-600" />
                    ) : preset.category === 'outdoor' ? (
                      <Sun className="w-5 h-5 text-amber-600" />
                    ) : preset.category === 'fixtures' ? (
                      <Wine className="w-5 h-5 text-purple-600" />
                    ) : preset.category === 'architectural' ? (
                      <Columns3 className="w-5 h-5 text-slate-600" />
                    ) : preset.shape === 'round' ? (
                      <Circle className="w-5 h-5" />
                    ) : preset.shape === 'square' ? (
                      <Square className="w-5 h-5" />
                    ) : preset.shape === 'oval' ? (
                      <Egg className="w-5 h-5" />
                    ) : (
                      <RectangleHorizontal className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight group-hover:text-indigo-600">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {preset.defaultCovers > 0
                      ? `${preset.defaultCovers} seats`
                      : preset.category === 'seating'
                      ? 'Seating'
                      : preset.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. Drawer: TEMPLATES EXPLORER */}
      {activeDrawer === 'templates' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-250">
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto -mt-1 mb-2" />
              <h3 className="text-base font-extrabold text-slate-900">Room Templates</h3>
              <p className="text-[11px] text-slate-500">Apply a professionally configured venue layout.</p>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-2.5 pb-8">
            {ROOM_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => {
                  if (window.confirm(`Apply "${tmpl.name}"? This replaces the current room arrangement.`)) {
                    onApplyTemplate(tmpl);
                    setActiveDrawer('none');
                  }
                }}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 active:bg-amber-50/40 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    {tmpl.style}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{tmpl.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {tmpl.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 block">{tmpl.capacity} seats</span>
                  <span className="text-[10px] text-slate-400">{tmpl.tableCount} tables</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Drawer: TABLES & LAYERS LIST */}
      {activeDrawer === 'layers' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-250">
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto -mt-1 mb-2" />
              <h3 className="text-base font-extrabold text-slate-900">
                Floor Plan Elements ({floorPlan.elements.length})
              </h3>
              <p className="text-[11px] text-slate-500">Tap an item to select and edit it on canvas.</p>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 pb-8">
            {floorPlan.elements.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No elements on canvas yet. Tap &quot;+ Add&quot; to place your first table!
              </div>
            ) : (
              floorPlan.elements.map((el) => {
                const isSelected = el.id === selectedElementId;
                return (
                  <div
                    key={el.id}
                    onClick={() => {
                      onSelectElement(el.id);
                      setActiveDrawer('none');
                    }}
                    className={`p-3 flex items-center justify-between cursor-pointer rounded-xl transition ${
                      isSelected ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        {el.type === 'table' ? (
                          <Armchair className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <LayoutGrid className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{el.name}</h4>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {el.type} • {el.covers > 0 ? `${el.covers} seats` : ''} ({el.status})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(el.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 7. Drawer: ROOM DIMENSIONS & SETTINGS */}
      {activeDrawer === 'room' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-250">
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto -mt-1 mb-2" />
              <h3 className="text-base font-extrabold text-slate-900">Room & Canvas Settings</h3>
              <p className="text-[11px] text-slate-500">Adjust venue dimensions, grid, and architecture.</p>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4 pb-8">
            {/* Room Dimensions */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Room Dimensions</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Width ({floorPlan.unit})
                  </label>
                  <input
                    type="number"
                    value={floorPlan.roomWidth}
                    onChange={(e) =>
                      onUpdateFloorPlan?.({
                        roomWidth: Math.max(10, Math.min(200, Number(e.target.value) || 10))
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                    Length ({floorPlan.unit})
                  </label>
                  <input
                    type="number"
                    value={floorPlan.roomHeight}
                    onChange={(e) =>
                      onUpdateFloorPlan?.({
                        roomHeight: Math.max(10, Math.min(200, Number(e.target.value) || 10))
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Units switcher */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600">Measurement Unit:</span>
                <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => onUpdateFloorPlan?.({ unit: 'ft' })}
                    className={`px-3 py-1 text-xs font-bold rounded-md ${
                      floorPlan.unit === 'ft' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Feet (ft)
                  </button>
                  <button
                    onClick={() => onUpdateFloorPlan?.({ unit: 'm' })}
                    className={`px-3 py-1 text-xs font-bold rounded-md ${
                      floorPlan.unit === 'm' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Meters (m)
                  </button>
                </div>
              </div>
            </div>

            {/* Grid & Snap Toggles */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block">Drawing Guides</span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Show Grid Overlay</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid?.(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Snap Tables to Grid</span>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid?.(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Alter Room Shape */}
            {onOpenRoomShapeModal && (
              <button
                onClick={() => {
                  setActiveDrawer('none');
                  onOpenRoomShapeModal();
                }}
                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 transition"
              >
                Alter Room Shape (L-Shape, T-Shape, Angles)
              </button>
            )}

            {/* Fit to screen button */}
            {onFitToScreen && (
              <button
                onClick={() => {
                  onFitToScreen();
                  setActiveDrawer('none');
                }}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 transition flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Fit Room to Mobile Screen
              </button>
            )}
          </div>
        </div>
      )}

      {/* 8. Drawer: FULL ELEMENT DETAIL INSPECTOR */}
      {activeDrawer === 'elementDetail' && selectedElement && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-250">
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto -mt-1 mb-2" />
              <h3 className="text-base font-extrabold text-slate-900">Table Settings</h3>
              <p className="text-[11px] text-slate-500">{selectedElement.name}</p>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4 pb-8">
            {/* Label / Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Table Label</label>
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) => onUpdateElement({ ...selectedElement, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['available', 'reserved', 'occupied'] as TableStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateElement({ ...selectedElement, status: st })}
                    className={`py-2 rounded-xl font-bold capitalize transition border ${
                      selectedElement.status === st
                        ? st === 'available'
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : st === 'reserved'
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Guest / Reservation Notes</label>
              <input
                type="text"
                placeholder="e.g. VIP guest, anniversary, high chair"
                value={selectedElement.notes || ''}
                onChange={(e) => onUpdateElement({ ...selectedElement, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  onUpdateElement({ ...selectedElement, locked: !selectedElement.locked });
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {selectedElement.locked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Unlock
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-500" /> Lock in Place
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onDeleteElement(selectedElement.id);
                  setActiveDrawer('none');
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
