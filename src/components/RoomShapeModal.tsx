import React, { useState } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Square,
  Sparkles,
  Layers,
  HelpCircle,
  Move,
  ArrowRight,
  Info
} from 'lucide-react';
import { FloorPlan, Point2D, RoomShapePreset } from '../types';
import {
  getEffectiveBoundaryPoints,
  getPresetBoundaryPoints,
  calculatePolygonArea,
  calculateBoundingBox,
  getWallSegments,
  insertVertexOnEdge,
  removeVertexAtIndex,
  pointsToSvgPathD
} from '../utils/roomGeometry';

interface RoomShapeModalProps {
  floorPlan: FloorPlan;
  isOpen: boolean;
  onClose: () => void;
  onApplyShape: (shape: RoomShapePreset, points: Point2D[], width: number, height: number) => void;
}

export const RoomShapeModal: React.FC<RoomShapeModalProps> = ({
  floorPlan,
  isOpen,
  onClose,
  onApplyShape
}) => {
  if (!isOpen) return null;

  const initialPoints = getEffectiveBoundaryPoints(floorPlan);
  const [currentShape, setCurrentShape] = useState<RoomShapePreset>(floorPlan.roomShape || 'rectangle');
  const [points, setPoints] = useState<Point2D[]>(initialPoints);
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);

  // Compute stats
  const area = calculatePolygonArea(points);
  const bbox = calculateBoundingBox(points);
  const wallSegments = getWallSegments(points);
  const estimatedCapacity = Math.round(area / (floorPlan.unit === 'ft' ? 15 : 1.5));

  // Switch preset
  const handleSelectPreset = (preset: RoomShapePreset) => {
    setCurrentShape(preset);
    const newPoints = getPresetBoundaryPoints(
      preset,
      Math.max(20, floorPlan.roomWidth),
      Math.max(20, floorPlan.roomHeight)
    );
    setPoints(newPoints);
    setSelectedVertexIdx(null);
  };

  // Modify individual point coordinate
  const handleUpdateCoordinate = (idx: number, axis: 'x' | 'y', val: number) => {
    setCurrentShape('custom');
    setPoints((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [axis]: Math.max(0, Math.round(val * 2) / 2)
      };
      return next;
    });
  };

  // Add a new vertex along a wall segment
  const handleAddVertex = (edgeIdx: number) => {
    setCurrentShape('custom');
    const nextPoints = insertVertexOnEdge(points, edgeIdx);
    setPoints(nextPoints);
    setSelectedVertexIdx(edgeIdx + 1);
  };

  // Delete vertex
  const handleDeleteVertex = (idx: number) => {
    if (points.length <= 3) return;
    setCurrentShape('custom');
    const nextPoints = removeVertexAtIndex(points, idx);
    setPoints(nextPoints);
    setSelectedVertexIdx(null);
  };

  // Apply changes to floor plan
  const handleSave = () => {
    const updatedBbox = calculateBoundingBox(points);
    onApplyShape(currentShape, points, updatedBbox.width, updatedBbox.height);
    onClose();
  };

  // Mini preview dimensions
  const previewScale = Math.min(180 / (bbox.width || 40), 140 / (bbox.height || 30));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Hall Shape & Custom Architecture
              </h2>
              <p className="text-xs text-slate-500">
                Select room layout or modify wall corners for non-square venues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Preset Shape Selector Cards */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Choose Architectural Room Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'rectangle', label: 'Rectangle', desc: 'Standard 4-wall hall', icon: '⬛' },
                { id: 'l-shape', label: 'L-Shaped Hall', desc: 'Main hall with side wing', icon: '🇱' },
                { id: 't-shape', label: 'T-Shaped Hall', desc: 'Head table / altar wing', icon: '🇹' },
                { id: 'u-shape', label: 'U-Shaped / Atrium', desc: 'Dual wings with courtyard', icon: '🇺' },
                { id: 'angled', label: 'Angled / Chamfer', desc: 'Diagonal corner cut wall', icon: '📐' },
                { id: 'hexagon', label: 'Octagonal Ballroom', desc: '45° chamfered corners', icon: '🛑' }
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id as RoomShapePreset)}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    currentShape === preset.id
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{preset.icon}</span>
                    {currentShape === preset.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900">{preset.label}</p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Shape Preview & Stats Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* SVG Visualizer */}
            <div className="w-48 h-36 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2 shadow-2xs">
              <svg
                width={Math.max(60, bbox.width * previewScale)}
                height={Math.max(60, bbox.height * previewScale)}
                viewBox={`-5 -5 ${(bbox.width || 40) * previewScale + 10} ${(bbox.height || 30) * previewScale + 10}`}
                className="overflow-visible"
              >
                {/* Floor Polygon */}
                <path
                  d={pointsToSvgPathD(points, previewScale)}
                  fill="#e0e7ff"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* Corner Vertex Dots */}
                {points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x * previewScale}
                    cy={pt.y * previewScale}
                    r={selectedVertexIdx === i ? 5 : 3.5}
                    fill={selectedVertexIdx === i ? '#4f46e5' : '#ffffff'}
                    stroke="#4f46e5"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>

            {/* Calculated Metrics */}
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Usable Floor Area</span>
                <span className="font-extrabold text-slate-900">
                  {Math.round(area).toLocaleString()} sq {floorPlan.unit}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Estimated Capacity</span>
                <span className="font-extrabold text-emerald-600">
                  ~{estimatedCapacity} seated covers
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500 font-medium">Bounding Footprint</span>
                <span className="font-bold text-slate-800">
                  {bbox.width} × {bbox.height} {floorPlan.unit}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-medium">Perimeter Walls</span>
                <span className="font-bold text-indigo-600">{points.length} walls</span>
              </div>
            </div>
          </div>

          {/* Detailed Wall Corners & Vertices List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Wall Vertices & Coordinates ({points.length} corners)
              </label>
              <button
                onClick={() => handleAddVertex(points.length - 1)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 rounded-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Extra Corner
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {points.map((pt, i) => {
                const nextPt = points[(i + 1) % points.length];
                const wallLen = Math.round(
                  Math.hypot(nextPt.x - pt.x, nextPt.y - pt.y) * 10
                ) / 10;

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedVertexIdx(i)}
                    className={`flex items-center justify-between gap-3 p-2 rounded-lg bg-white border text-xs transition ${
                      selectedVertexIdx === i
                        ? 'border-indigo-500 shadow-2xs ring-1 ring-indigo-400'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-800">Corner #{i + 1}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium">X:</span>
                        <input
                          type="number"
                          value={pt.x}
                          step={1}
                          onChange={(e) =>
                            handleUpdateCoordinate(i, 'x', Number(e.target.value) || 0)
                          }
                          className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-center font-bold text-slate-900 bg-slate-50 focus:bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-medium">Y:</span>
                        <input
                          type="number"
                          value={pt.y}
                          step={1}
                          onChange={(e) =>
                            handleUpdateCoordinate(i, 'y', Number(e.target.value) || 0)
                          }
                          className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-center font-bold text-slate-900 bg-slate-50 focus:bg-white"
                        />
                      </div>

                      <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                        Wall to #{((i + 1) % points.length) + 1}: {wallLen} {floorPlan.unit}
                      </span>

                      {points.length > 3 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVertex(i);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete this corner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => handleSelectPreset('rectangle')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Rectangle</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>Apply Room Architecture</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
