import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Copy,
  RotateCw,
  Plus,
  Minus,
  Lock,
  Unlock,
  Move,
  Check,
  Crown,
  Square,
  Sparkles,
  Armchair,
  Hand,
  MousePointer,
  GripHorizontal,
  ArrowLeftRight,
  ArrowUpDown,
  Scaling,
  X,
  Sliders
} from 'lucide-react';
import { FloorElement, FloorPlan, Collaborator, TableStatus } from '../types';
import {
  getChairPositions,
  getEffectiveCovers,
  getCornerChairIndices,
  getEndChairIndices
} from '../utils/chairLayout';
import {
  getElementRotatedExtents,
  clampElementPosition,
  dragClampElementPosition
} from '../utils/geometry';
import { ArchitecturalElementRenderer, getElementSubtype } from './ArchitecturalElementRenderer';

interface CanvasProps {
  floorPlan: FloorPlan;
  onUpdateFloorPlan?: (updates: Partial<FloorPlan>) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (element: FloorElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onDropNewElement: (presetId: string, x: number, y: number) => void;
  showGrid: boolean;
  snapToGrid: boolean;
  collaborators: Collaborator[];
  onCursorMove: (x: number, y: number) => void;
  onOpenTemplates?: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  floorPlan,
  onUpdateFloorPlan,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onDropNewElement,
  showGrid,
  snapToGrid,
  collaborators,
  onCursorMove,
  onOpenTemplates
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Active tool: 'select' (V) vs 'pan' (H or hold Space)
  const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Floor resize state (dragging right border, bottom border, or bottom-right corner)
  interface FloorResizeState {
    direction: 'e' | 's' | 'se';
    startWidth: number;
    startHeight: number;
    startClientX: number;
    startClientY: number;
    currentWidth: number;
    currentHeight: number;
  }
  const [floorResize, setFloorResize] = useState<FloorResizeState | null>(null);

  // Floor dimensions quick modal popover
  const [isFloorDimensionModalOpen, setIsFloorDimensionModalOpen] = useState(false);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging / rotating an element
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [rotateInitialRotation, setRotateInitialRotation] = useState(0);

  // Convert room dimensions to SVG canvas coordinates
  // 1 unit (ft/m) = 20 pixels by default
  const scaleRatio = 20;

  // Minimum room dimensions required so existing tables and fixtures are never cut off (accounting for rotation)
  const maxElementX = floorPlan.elements.reduce((max, el) => {
    const { halfW } = getElementRotatedExtents(el.width, el.height, el.rotation || 0);
    const cx = el.x + el.width / 2;
    return Math.max(max, cx + halfW);
  }, 0);
  const maxElementY = floorPlan.elements.reduce((max, el) => {
    const { halfH } = getElementRotatedExtents(el.width, el.height, el.rotation || 0);
    const cy = el.y + el.height / 2;
    return Math.max(max, cy + halfH);
  }, 0);
  const minAllowedWidth = Math.max(12, Math.ceil((maxElementX + 30) / scaleRatio));
  const minAllowedHeight = Math.max(12, Math.ceil((maxElementY + 30) / scaleRatio));

  // Current effective dimensions (live during resize drag)
  const effectiveRoomWidth = floorResize ? floorResize.currentWidth : floorPlan.roomWidth;
  const effectiveRoomHeight = floorResize ? floorResize.currentHeight : floorPlan.roomHeight;
  const roomWidthPx = effectiveRoomWidth * scaleRatio;
  const roomHeightPx = effectiveRoomHeight * scaleRatio;

  // Selected element
  const selectedElement = floorPlan.elements.find((e) => e.id === selectedElementId);

  // Keyboard shortcuts: Space to pan, V for select, H for pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      }
      if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Global pointerup to ensure pan and resize cleanly complete anywhere on screen
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (floorResize) {
        if (
          onUpdateFloorPlan &&
          (floorResize.currentWidth !== floorPlan.roomWidth ||
            floorResize.currentHeight !== floorPlan.roomHeight)
        ) {
          onUpdateFloorPlan({
            roomWidth: floorResize.currentWidth,
            roomHeight: floorResize.currentHeight
          });
        }
        setFloorResize(null);
      }
      setIsPanning(false);
      setDraggedElementId(null);
      setIsRotating(false);
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [floorResize, onUpdateFloorPlan, floorPlan.roomWidth, floorPlan.roomHeight]);

  // Grid snap helper
  const snap = (val: number, step = 10) => {
    if (!snapToGrid) return val;
    return Math.round(val / step) * step;
  };

  // Convert client coordinates to SVG canvas coordinates
  const clientToCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left - pan.x;
    const relY = clientY - rect.top - pan.y;
    return {
      x: relX / zoom,
      y: relY / zoom
    };
  }, [pan, zoom]);

  // Start resizing floor from edge or corner
  const handleFloorResizeStart = (e: React.PointerEvent, direction: 'e' | 's' | 'se') => {
    e.stopPropagation();
    e.preventDefault();
    if (!onUpdateFloorPlan) return;

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setFloorResize({
      direction,
      startWidth: floorPlan.roomWidth,
      startHeight: floorPlan.roomHeight,
      startClientX: e.clientX,
      startClientY: e.clientY,
      currentWidth: floorPlan.roomWidth,
      currentHeight: floorPlan.roomHeight
    });
  };

  // Handle Wheel for Pan & Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) => Math.max(0.4, Math.min(2.5, prev * zoomFactor)));
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8
      }));
    }
  };

  // Drag & Drop from Sidebar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const presetId = e.dataTransfer.getData('text/preset-id');
    if (!presetId) return;

    const coords = clientToCanvasCoords(e.clientX, e.clientY);
    const snappedX = snap(coords.x, 20);
    const snappedY = snap(coords.y, 20);

    onDropNewElement(presetId, snappedX, snappedY);
  };

  // Pointer Move on Canvas
  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = clientToCanvasCoords(e.clientX, e.clientY);
    onCursorMove(coords.x, coords.y);

    // 1. Resizing floor canvas takes highest precedence
    if (floorResize) {
      const deltaX = (e.clientX - floorResize.startClientX) / (zoom * scaleRatio);
      const deltaY = (e.clientY - floorResize.startClientY) / (zoom * scaleRatio);
      let newWidth = floorResize.startWidth;
      let newHeight = floorResize.startHeight;

      if (floorResize.direction === 'e' || floorResize.direction === 'se') {
        let rawW = floorResize.startWidth + deltaX;
        rawW = snapToGrid ? Math.round(rawW / 2) * 2 : Math.round(rawW);
        newWidth = Math.max(minAllowedWidth, Math.min(250, rawW));
      }

      if (floorResize.direction === 's' || floorResize.direction === 'se') {
        let rawH = floorResize.startHeight + deltaY;
        rawH = snapToGrid ? Math.round(rawH / 2) * 2 : Math.round(rawH);
        newHeight = Math.max(minAllowedHeight, Math.min(250, rawH));
      }

      setFloorResize((prev) =>
        prev
          ? {
              ...prev,
              currentWidth: newWidth,
              currentHeight: newHeight
            }
          : null
      );
      return;
    }

    // 2. Pan canvas
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // 3. Rotating element
    if (isRotating && selectedElement) {
      const centerX = selectedElement.x + selectedElement.width / 2;
      const centerY = selectedElement.y + selectedElement.height / 2;
      const currentAngle = Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
      let newRotation = (rotateInitialRotation + (currentAngle - rotateStartAngle)) % 360;
      if (newRotation < 0) newRotation += 360;

      // Snap rotation to 15 degrees if snap enabled
      if (snapToGrid) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      const finalRotation = Math.round(newRotation);

      // Keep rotated element within room boundaries
      const clampedPos = clampElementPosition(
        selectedElement.x,
        selectedElement.y,
        selectedElement.width,
        selectedElement.height,
        finalRotation,
        roomWidthPx,
        roomHeightPx,
        8
      );

      onUpdateElement({
        ...selectedElement,
        x: clampedPos.x,
        y: clampedPos.y,
        rotation: finalRotation
      });
      return;
    }

    // 4. Dragging element
    if (draggedElementId) {
      const el = floorPlan.elements.find((e) => e.id === draggedElementId);
      if (!el || el.locked) return;

      const rawX = coords.x - dragOffset.x;
      const rawY = coords.y - dragOffset.y;

      // Keep rotated element completely within room boundaries without artificial edge limitations
      const clamped = dragClampElementPosition(
        rawX,
        rawY,
        el.width,
        el.height,
        el.rotation || 0,
        roomWidthPx,
        roomHeightPx,
        snapToGrid,
        10,
        8
      );

      onUpdateElement({
        ...el,
        x: clamped.x,
        y: clamped.y
      });
    }
  };

  const handlePointerUp = () => {
    if (floorResize) {
      if (
        onUpdateFloorPlan &&
        (floorResize.currentWidth !== floorPlan.roomWidth ||
          floorResize.currentHeight !== floorPlan.roomHeight)
      ) {
        onUpdateFloorPlan({
          roomWidth: floorResize.currentWidth,
          roomHeight: floorResize.currentHeight
        });
      }
      setFloorResize(null);
    }
    setIsPanning(false);
    setDraggedElementId(null);
    setIsRotating(false);
  };

  // Start element drag
  const handleElementPointerDown = (e: React.PointerEvent, el: FloorElement) => {
    e.stopPropagation();

    // If in Pan mode or holding Space or middle-clicking, pan the floor canvas instead of dragging element
    if (activeTool === 'pan' || isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
      return;
    }

    onSelectElement(el.id);

    if (el.locked) return;

    const coords = clientToCanvasCoords(e.clientX, e.clientY);
    setDraggedElementId(el.id);
    setDragOffset({
      x: coords.x - el.x,
      y: coords.y - el.y
    });
  };

  // Start rotating element
  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!selectedElement) return;

    const coords = clientToCanvasCoords(e.clientX, e.clientY);
    const centerX = selectedElement.x + selectedElement.width / 2;
    const centerY = selectedElement.y + selectedElement.height / 2;

    const startAngle = Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
    setRotateStartAngle(startAngle);
    setRotateInitialRotation(selectedElement.rotation || 0);
    setIsRotating(true);
  };

  // Canvas background click (deselect & drag canvas to pan)
  const handleCanvasBackgroundPointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) return; // ignore right-click

    onSelectElement(null);
    // Pan canvas
    setIsPanning(true);
    setPanStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom((z) => Math.min(2.2, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.15));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 80, y: 40 });
  };

  // Quick cover adjustments
  const handleCoverDelta = (delta: number) => {
    if (!selectedElement) return;
    const newCovers = Math.max(0, Math.min(32, selectedElement.covers + delta));
    onUpdateElement({
      ...selectedElement,
      covers: newCovers,
      removedChairs: selectedElement.removedChairs?.filter((idx) => idx < newCovers)
    });
  };

  // Toggle individual chair removal/restoration
  const handleToggleChair = (e: React.PointerEvent | React.MouseEvent, element: FloorElement, chairIndex: number) => {
    e.stopPropagation();
    const currentRemoved = element.removedChairs || [];
    const nextRemoved = currentRemoved.includes(chairIndex)
      ? currentRemoved.filter((i) => i !== chairIndex)
      : [...currentRemoved, chairIndex];
    onUpdateElement({
      ...element,
      removedChairs: nextRemoved
    });
  };

  // Toggle corner chairs removal/restoration
  const handleToggleCornerChairs = (element: FloorElement) => {
    const cornerIndices = getCornerChairIndices(element.shape, element.width, element.height, element.covers);
    if (cornerIndices.length === 0) return;
    const currentRemoved = element.removedChairs || [];
    const allCornersRemoved = cornerIndices.every((idx) => currentRemoved.includes(idx));

    let nextRemoved: number[];
    if (allCornersRemoved) {
      nextRemoved = currentRemoved.filter((idx) => !cornerIndices.includes(idx));
    } else {
      const set = new Set([...currentRemoved, ...cornerIndices]);
      nextRemoved = Array.from(set);
    }

    onUpdateElement({
      ...element,
      removedChairs: nextRemoved
    });
  };

  // Toggle end (head) chairs removal/restoration
  const handleToggleEndChairs = (element: FloorElement) => {
    const endIndices = getEndChairIndices(element.shape, element.width, element.height, element.covers);
    if (endIndices.length === 0) return;
    const currentRemoved = element.removedChairs || [];
    const allEndsRemoved = endIndices.every((idx) => currentRemoved.includes(idx));

    let nextRemoved: number[];
    if (allEndsRemoved) {
      nextRemoved = currentRemoved.filter((idx) => !endIndices.includes(idx));
    } else {
      const set = new Set([...currentRemoved, ...endIndices]);
      nextRemoved = Array.from(set);
    }

    onUpdateElement({
      ...element,
      removedChairs: nextRemoved
    });
  };

  // Restore all chairs
  const handleRestoreAllChairs = (element: FloorElement) => {
    onUpdateElement({
      ...element,
      removedChairs: []
    });
  };

  // Rotate step (45 deg or 90 deg) with boundary safety
  const handleRotateStep = (step = 45) => {
    if (!selectedElement) return;
    const newRot = (selectedElement.rotation + step) % 360;
    const clampedPos = clampElementPosition(
      selectedElement.x,
      selectedElement.y,
      selectedElement.width,
      selectedElement.height,
      newRot,
      roomWidthPx,
      roomHeightPx,
      8
    );
    onUpdateElement({
      ...selectedElement,
      rotation: newRot,
      x: clampedPos.x,
      y: clampedPos.y
    });
  };

  // Status toggle
  const handleStatusChange = (status: TableStatus) => {
    if (!selectedElement) return;
    onUpdateElement({ ...selectedElement, status });
  };

  return (
    <div
      ref={containerRef}
      id="floorplan-canvas-container"
      onWheel={handleWheel}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerDown={handleCanvasBackgroundPointerDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex-1 h-full w-full bg-slate-100/90 overflow-hidden select-none ${
        isPanning
          ? 'cursor-grabbing'
          : activeTool === 'pan' || isSpacePressed
          ? 'cursor-grab'
          : 'cursor-default'
      }`}
    >
      {/* Floating Canvas Controls: Tool Switcher & Zoom */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl shadow-md border border-slate-200">
        {/* Tool Mode: Select vs Pan */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg mr-1">
          <button
            id="btn-tool-select"
            onClick={() => setActiveTool('select')}
            title="Select & Move Tables (V)"
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
              activeTool === 'select'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>
          <button
            id="btn-tool-pan"
            onClick={() => setActiveTool('pan')}
            title="Drag Canvas / Pan View (H or Hold Space)"
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
              activeTool === 'pan'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pan</span>
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        <button
          id="btn-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-slate-600 px-1 min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          id="btn-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-200 mx-0.5" />
        <button
          id="btn-zoom-fit"
          onClick={handleResetZoom}
          title="Reset View (100%)"
          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Quick Stats Pill & Floor Resize Popover Trigger */}
      <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2.5 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          <span>
            Room: <strong className="text-slate-900">{floorPlan.roomWidth} × {floorPlan.roomHeight} {floorPlan.unit}</strong>
          </span>
        </div>
        <div className="h-3 w-px bg-slate-200" />
        <button
          id="btn-open-floor-resize-modal"
          onClick={() => setIsFloorDimensionModalOpen((prev) => !prev)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold transition cursor-pointer ${
            isFloorDimensionModalOpen
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
          title="Adjust room dimensions or pick venue presets"
        >
          <Scaling className="w-3.5 h-3.5" />
          <span>Resize Floor</span>
        </button>
        <div className="h-3 w-px bg-slate-200" />
        <div>
          <span>Scale: <strong className="text-slate-900">1 {floorPlan.unit} = 20px</strong></span>
        </div>
      </div>

      {/* Quick Floor Dimensions Popover Modal */}
      {isFloorDimensionModalOpen && (
        <div
          id="floor-dimensions-modal"
          className="absolute top-14 left-4 z-30 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 select-none"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Scaling className="w-4 h-4 text-indigo-600" />
              <span>Room Dimensions</span>
            </div>
            <button
              onClick={() => setIsFloorDimensionModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 my-3.5">
            {/* Width Stepper */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Room Width</span>
                <span className="font-bold text-indigo-600 text-xs">
                  {floorPlan.roomWidth} {floorPlan.unit}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onUpdateFloorPlan?.({
                      roomWidth: Math.max(minAllowedWidth, floorPlan.roomWidth - 5)
                    })
                  }
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  title="Minus 5"
                >
                  -5
                </button>
                <button
                  onClick={() =>
                    onUpdateFloorPlan?.({
                      roomWidth: Math.max(minAllowedWidth, floorPlan.roomWidth - 1)
                    })
                  }
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  title="Minus 1"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={minAllowedWidth}
                  max={250}
                  value={floorPlan.roomWidth}
                  onChange={(e) =>
                    onUpdateFloorPlan?.({
                      roomWidth: Math.max(minAllowedWidth, Math.min(250, Number(e.target.value) || minAllowedWidth))
                    })
                  }
                  className="w-full text-center py-1 font-bold text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                />
                <button
                  onClick={() =>
                    onUpdateFloorPlan?.({
                      roomWidth: Math.min(250, floorPlan.roomWidth + 1)
                    })
                  }
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  title="Plus 1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onUpdateFloorPlan?.({
                      roomWidth: Math.min(250, floorPlan.roomWidth + 5)
                    })
                  }
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  title="Plus 5"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Height Stepper */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Room Length (Height)</span>
                <span className="font-bold text-indigo-600 text-xs">
                  {floorPlan.roomHeight} {floorPlan.unit}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onUpdateFloorPlan?.({
                      roomHeight: Math.max(minAllowedHeight, floorPlan.roomHeight - 5)
                    })
                  }
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  title="Minus 5"
                >
                  -5
                </button>
                <button
                  onClick={() =>
                    onUpdateFloorPlan?.({
                      roomHeight: Math.max(minAllowedHeight, floorPlan.roomHeight - 1)
                    })
                  }
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  title="Minus 1"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={minAllowedHeight}
                  max={250}
                  value={floorPlan.roomHeight}
                  onChange={(e) =>
                    onUpdateFloorPlan?.({
                      roomHeight: Math.max(minAllowedHeight, Math.min(250, Number(e.target.value) || minAllowedHeight))
                    })
                  }
                  className="w-full text-center py-1 font-bold text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                />
                <button
                  onClick={() =>
                    onUpdateFloorPlan?.({
                      roomHeight: Math.min(250, floorPlan.roomHeight + 1)
                    })
                  }
                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                  title="Plus 1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onUpdateFloorPlan?.({
                      roomHeight: Math.min(250, floorPlan.roomHeight + 5)
                    })
                  }
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  title="Plus 5"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Area & Capacity Stats */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Floor Area:</span>
                <span className="font-bold text-slate-900">
                  {(floorPlan.roomWidth * floorPlan.roomHeight).toLocaleString()} sq {floorPlan.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Est. Max Capacity:</span>
                <span className="font-bold text-indigo-600">
                  ~{Math.round((floorPlan.roomWidth * floorPlan.roomHeight) / (floorPlan.unit === 'ft' ? 15 : 1.5))} covers
                </span>
              </div>
            </div>

            {/* Standard Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Standard Venue Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Bistro Dining', w: 45, h: 32 },
                  { label: 'Cozy Cafe', w: 30, h: 22 },
                  { label: 'Banquet Hall', w: 60, h: 40 },
                  { label: 'Grand Ballroom', w: 80, h: 50 },
                  { label: 'Square Patio', w: 40, h: 40 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onUpdateFloorPlan?.({
                        roomWidth: Math.max(minAllowedWidth, preset.w),
                        roomHeight: Math.max(minAllowedHeight, preset.h)
                      });
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/70 text-left transition"
                  >
                    <div className="text-xs font-bold text-slate-800">{preset.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {preset.w} × {preset.h} {floorPlan.unit}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="italic">💡 Drag bottom-right corner anytime to resize directly</span>
          </div>
        </div>
      )}

      {/* Main SVG Floor Plan Canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isPanning || floorResize ? 'none' : 'transform 0.05s ease-out'
        }}
        className="inline-block relative"
      >
        {/* Draggable Room Canvas Header Bar */}
        <div
          id="room-canvas-header-bar"
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsPanning(true);
            setPanStart({
              x: e.clientX - pan.x,
              y: e.clientY - pan.y
            });
          }}
          className="absolute -top-10 left-0 flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-xs text-white px-3.5 py-1.5 rounded-t-xl text-xs font-semibold shadow-md cursor-grab active:cursor-grabbing select-none border-t border-x border-slate-700/80 transition z-10"
          title="Click and drag to pan the room canvas anywhere"
        >
          <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-bold">{floorPlan.name || 'Floor Plan'}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 font-mono font-bold">
            {effectiveRoomWidth} × {effectiveRoomHeight} {floorPlan.unit}
          </span>
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline-flex items-center gap-1 ml-1">
            <Move className="w-3 h-3 text-indigo-400" /> Drag to move canvas
          </span>
        </div>

        <svg
          ref={svgRef}
          id="floor-plan-svg"
          width={roomWidthPx}
          height={roomHeightPx}
          className="bg-white rounded-lg shadow-xl overflow-visible border-4 border-slate-800"
          style={{ minWidth: roomWidthPx, minHeight: roomHeightPx }}
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="grid-pattern-small" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
            <pattern id="grid-pattern-large" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#grid-pattern-small)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
            </pattern>

            {/* Parquet wood floor pattern for dance floors */}
            <pattern id="parquet-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#fef3c7" />
              <path d="M 0 0 L 40 40 M 40 0 L 0 40" stroke="#fde68a" strokeWidth="1" />
              <rect x="0" y="0" width="20" height="20" fill="#fde68a" opacity="0.3" />
              <rect x="20" y="20" width="20" height="20" fill="#fde68a" opacity="0.3" />
            </pattern>

            {/* Architectural wall diagonal hatching pattern */}
            <pattern id="wall-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#1e293b" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="2.5" />
            </pattern>

            {/* Glass sheen gradient */}
            <linearGradient id="glass-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.4" />
            </linearGradient>

            {/* Wood plank decking pattern */}
            <pattern id="wood-deck-pattern" width="60" height="24" patternUnits="userSpaceOnUse">
              <rect width="60" height="24" fill="#d97706" fillOpacity="0.25" />
              <line x1="0" y1="12" x2="60" y2="12" stroke="#92400e" strokeWidth="1" strokeOpacity="0.6" />
              <line x1="0" y1="24" x2="60" y2="24" stroke="#92400e" strokeWidth="1" strokeOpacity="0.6" />
              <line x1="30" y1="0" x2="30" y2="12" stroke="#92400e" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="60" y1="12" x2="60" y2="24" stroke="#92400e" strokeWidth="1" strokeOpacity="0.4" />
            </pattern>

            {/* Stone patio paver pattern */}
            <pattern id="stone-patio-pattern" width="36" height="36" patternUnits="userSpaceOnUse">
              <rect width="36" height="36" fill="#f1f5f9" />
              <rect x="1" y="1" width="16" height="16" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="19" y="1" width="16" height="16" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              <rect x="1" y="19" width="16" height="16" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
              <rect x="19" y="19" width="16" height="16" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
            </pattern>

            {/* Green living moss wall pattern */}
            <pattern id="green-wall-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#15803d" />
              <circle cx="5" cy="5" r="4" fill="#16a34a" />
              <circle cx="15" cy="15" r="5" fill="#22c55e" fillOpacity="0.7" />
              <circle cx="15" cy="5" r="3" fill="#14532d" />
              <circle cx="5" cy="15" r="3.5" fill="#15803d" />
            </pattern>
          </defs>

          {/* Room Base Floor Surface (Click & Drag to Pan Canvas) */}
          <rect
            id="room-floor-surface"
            data-floor-surface="true"
            x="0"
            y="0"
            width={roomWidthPx}
            height={roomHeightPx}
            fill={showGrid ? "url(#grid-pattern-large)" : "#ffffff"}
            onPointerDown={handleCanvasBackgroundPointerDown}
            className={
              activeTool === 'pan' || isSpacePressed
                ? 'cursor-grab active:cursor-grabbing'
                : 'cursor-default'
            }
          />

          {/* Perimeter measurement guides */}
          <g className="measurement-guides select-none opacity-40">
            {Array.from({ length: Math.floor(effectiveRoomWidth / 5) + 1 }).map((_, i) => (
              <g key={`x-${i}`} transform={`translate(${i * 5 * scaleRatio}, 0)`}>
                <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
                <text x="3" y="18" fontSize="9" fill="#64748b" fontWeight="600">
                  {i * 5}{floorPlan.unit}
                </text>
              </g>
            ))}
            {Array.from({ length: Math.floor(effectiveRoomHeight / 5) + 1 }).map((_, i) => (
              <g key={`y-${i}`} transform={`translate(0, ${i * 5 * scaleRatio})`}>
                <line x1="0" y1="0" x2="10" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                <text x="12" y="12" fontSize="9" fill="#64748b" fontWeight="600">
                  {i * 5}{floorPlan.unit}
                </text>
              </g>
            ))}
          </g>

          {/* Render Floor Elements */}
          {floorPlan.elements.map((el) => {
            const isSelected = el.id === selectedElementId;
            const isTable = el.type === 'table';
            const architecturalSubtype = !isTable ? getElementSubtype(el) : '';
            const isArchitectural = Boolean(architecturalSubtype);
            const chairs = isTable ? getChairPositions(el.shape, el.width, el.height, el.covers) : [];
            const effectiveCovers = isTable ? getEffectiveCovers(el.covers, el.removedChairs) : 0;

            // Check if another team collaborator is currently selecting this table
            const remoteSelector = collaborators.find((c) => c.selectedElementId === el.id);

            // Status colors
            const statusConfig = {
              available: { bg: '#ecfdf5', stroke: '#10b981', badge: 'Available', dot: '#10b981' },
              reserved: { bg: '#fffbeb', stroke: '#f59e0b', badge: 'Reserved', dot: '#f59e0b' },
              occupied: { bg: '#eff6ff', stroke: '#3b82f6', badge: 'Occupied', dot: '#3b82f6' },
              vip: { bg: '#faf5ff', stroke: '#a855f7', badge: 'VIP', dot: '#a855f7' },
              blocked: { bg: '#f8fafc', stroke: '#94a3b8', badge: 'Blocked', dot: '#64748b' }
            }[el.status || 'available'];

            const centerX = el.x + el.width / 2;
            const centerY = el.y + el.height / 2;

            return (
              <g
                key={el.id}
                id={`canvas-elem-${el.id}`}
                transform={`translate(${centerX}, ${centerY}) rotate(${el.rotation || 0})`}
                onPointerDown={(e) => handleElementPointerDown(e, el)}
                className="cursor-move group"
              >
                {/* 1. Chairs around table with corner removal & interactive click toggle */}
                {chairs.map((chair) => {
                  const isRemoved = el.removedChairs?.includes(chair.index);

                  // If chair is removed and table is not selected, completely hide it
                  if (isRemoved && !isSelected) {
                    return null;
                  }

                  // If chair is removed and table IS selected, show interactive ghost slot with + icon to restore
                  if (isRemoved && isSelected) {
                    return (
                      <g
                        key={`chair-ghost-${chair.index}`}
                        transform={`translate(${chair.x}, ${chair.y}) rotate(${chair.rotation})`}
                        onPointerDown={(e) => handleToggleChair(e, el, chair.index)}
                        className="cursor-pointer group/ghost"
                      >
                        <title>{`${chair.label || 'Seat ' + (chair.index + 1)} (Removed) - Click to restore seat`}</title>
                        <rect
                          x="-8"
                          y="-7"
                          width="16"
                          height="14"
                          rx="4"
                          fill="#f8fafc"
                          fillOpacity="0.75"
                          stroke="#cbd5e1"
                          strokeWidth="1.2"
                          strokeDasharray="2.5 2"
                          className="transition-colors group-hover/ghost:stroke-indigo-600 group-hover/ghost:fill-indigo-50"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fill="#94a3b8"
                          className="group-hover/ghost:fill-indigo-600 pointer-events-none"
                        >
                          +
                        </text>
                      </g>
                    );
                  }

                  // Active chair: fully rendered, with hover indicator and click-to-remove when table is selected
                  return (
                    <g
                      key={`chair-${chair.index}`}
                      transform={`translate(${chair.x}, ${chair.y}) rotate(${chair.rotation})`}
                      onPointerDown={isSelected ? (e) => handleToggleChair(e, el, chair.index) : undefined}
                      className={isSelected ? 'cursor-pointer group/chair' : undefined}
                    >
                      <title>
                        {isSelected
                          ? `${chair.label || 'Seat ' + (chair.index + 1)} - Click to remove chair`
                          : chair.label || `Seat ${chair.index + 1}`}
                      </title>
                      {/* Chair seat */}
                      <rect
                        x="-8"
                        y="-7"
                        width="16"
                        height="14"
                        rx="4"
                        fill={isSelected ? '#e0e7ff' : '#f1f5f9'}
                        stroke={isSelected ? '#6366f1' : '#94a3b8'}
                        strokeWidth="1.2"
                        className={isSelected ? 'transition-colors group-hover/chair:fill-rose-50 group-hover/chair:stroke-rose-500' : undefined}
                      />
                      {/* Chair backrest */}
                      <path
                        d="M -7 -6 Q 0 -9 7 -6"
                        fill="none"
                        stroke={isSelected ? '#4f46e5' : '#64748b'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        className={isSelected ? 'transition-colors group-hover/chair:stroke-rose-600' : undefined}
                      />
                      {/* Small hover removal badge when table is selected */}
                      {isSelected && (
                        <g className="opacity-0 group-hover/chair:opacity-100 transition-opacity pointer-events-none">
                          <circle cx="6" cy="-5" r="4" fill="#f43f5e" />
                          <text x="6" y="-2.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffffff">
                            ×
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 2. Main Element Body */}
                {isArchitectural ? (
                  <ArchitecturalElementRenderer
                    element={el}
                    isSelected={isSelected}
                    remoteSelector={remoteSelector}
                    statusConfig={statusConfig}
                    effectiveCovers={effectiveCovers}
                  />
                ) : el.shape === 'round' ? (
                  <circle
                    r={el.width / 2}
                    fill={el.color || (isTable ? statusConfig.bg : '#f8fafc')}
                    stroke={
                      remoteSelector
                        ? remoteSelector.color
                        : isSelected
                        ? '#4f46e5'
                        : isTable
                        ? statusConfig.stroke
                        : '#475569'
                    }
                    strokeWidth={isSelected || remoteSelector ? 3 : 2}
                    className="transition-all duration-100"
                  />
                ) : el.shape === 'oval' ? (
                  <ellipse
                    rx={el.width / 2}
                    ry={el.height / 2}
                    fill={el.color || (isTable ? statusConfig.bg : '#f8fafc')}
                    stroke={
                      remoteSelector
                        ? remoteSelector.color
                        : isSelected
                        ? '#4f46e5'
                        : isTable
                        ? statusConfig.stroke
                        : '#475569'
                    }
                    strokeWidth={isSelected || remoteSelector ? 3 : 2}
                    className="transition-all duration-100"
                  />
                ) : el.shape === 'booth' ? (
                  <g>
                    {/* Booth top bench */}
                    <rect
                      x={-el.width / 2}
                      y={-el.height / 2 - 12}
                      width={el.width}
                      height="12"
                      rx="3"
                      fill="#cbd5e1"
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />
                    {/* Table surface */}
                    <rect
                      x={-el.width / 2}
                      y={-el.height / 2}
                      width={el.width}
                      height={el.height}
                      rx="6"
                      fill={el.color || statusConfig.bg}
                      stroke={isSelected ? '#4f46e5' : statusConfig.stroke}
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    {/* Booth bottom bench */}
                    <rect
                      x={-el.width / 2}
                      y={el.height / 2}
                      width={el.width}
                      height="12"
                      rx="3"
                      fill="#cbd5e1"
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />
                  </g>
                ) : el.name === 'Dance Floor' ? (
                  <rect
                    x={-el.width / 2}
                    y={-el.height / 2}
                    width={el.width}
                    height={el.height}
                    rx="4"
                    fill="url(#parquet-pattern)"
                    stroke="#b45309"
                    strokeWidth="2.5"
                  />
                ) : (
                  <rect
                    x={-el.width / 2}
                    y={-el.height / 2}
                    width={el.width}
                    height={el.height}
                    rx={el.type === 'table' ? 8 : 4}
                    fill={el.color || (isTable ? statusConfig.bg : '#f8fafc')}
                    stroke={
                      remoteSelector
                        ? remoteSelector.color
                        : isSelected
                        ? '#4f46e5'
                        : isTable
                        ? statusConfig.stroke
                        : '#475569'
                    }
                    strokeWidth={isSelected || remoteSelector ? 3 : 2}
                    className="transition-all duration-100"
                  />
                )}

                {/* 3. Text Label & Covers Badge (For standard non-architectural elements) */}
                {!isArchitectural && (
                  <g className="select-none pointer-events-none text-center">
                    {/* Table / Element Name */}
                    <text
                      x="0"
                      y={isTable && el.covers > 0 ? -4 : 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.min(12, Math.max(9, el.width / 7))}
                      fontWeight="700"
                      fill={el.type === 'fixture' && el.color ? '#ffffff' : '#0f172a'}
                    >
                      {el.name}
                    </text>

                    {/* Covers Count Badge */}
                    {isTable && el.covers > 0 && (
                      <text
                        x="0"
                        y="11"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9.5"
                        fontWeight="600"
                        fill={statusConfig.stroke}
                      >
                        {effectiveCovers !== el.covers ? `${effectiveCovers}/${el.covers} seats` : `${el.covers} seats`}
                      </text>
                    )}

                    {/* Guest Name snippet */}
                    {el.guestName && (
                      <text
                        x="0"
                        y={el.height / 2 + 14}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="600"
                        fill="#475569"
                      >
                        👤 {el.guestName}
                      </text>
                    )}
                  </g>
                )}

                {/* 4. Remote Teammate Selection Tag */}
                {remoteSelector && (
                  <g transform={`translate(0, ${-el.height / 2 - 20})`}>
                    <rect
                      x="-45"
                      y="-10"
                      width="90"
                      height="18"
                      rx="9"
                      fill={remoteSelector.color}
                    />
                    <text
                      x="0"
                      y="2"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#ffffff"
                    >
                      {remoteSelector.name}
                    </text>
                  </g>
                )}

                {/* 5. Selection Bounding Box & Rotation Knob */}
                {isSelected && !el.locked && (
                  <g>
                    {/* Bounding box outline */}
                    <rect
                      x={-el.width / 2 - 6}
                      y={-el.height / 2 - 6}
                      width={el.width + 12}
                      height={el.height + 12}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      rx="6"
                    />

                    {/* Rotation stem & knob */}
                    <line
                      x1="0"
                      y1={-el.height / 2 - 6}
                      x2="0"
                      y2={-el.height / 2 - 24}
                      stroke="#4f46e5"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="0"
                      cy={-el.height / 2 - 24}
                      r="6"
                      fill="#ffffff"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                      onPointerDown={handleRotateStart}
                      className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Remote Collaborators Cursors */}
          {collaborators.map((collab) => {
            if (!collab.cursor) return null;
            return (
              <g
                key={`collab-cursor-${collab.id}`}
                transform={`translate(${collab.cursor.x}, ${collab.cursor.y})`}
                className="pointer-events-none z-50 transition-transform duration-75"
              >
                {/* Modern cursor arrow */}
                <path
                  d="M 0 0 L 0 16 L 4.5 12.5 L 9 20 L 12 18.5 L 7.5 11 L 13 11 Z"
                  fill={collab.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* User label pill */}
                <g transform="translate(14, 14)">
                  <rect
                    x="0"
                    y="-10"
                    width={collab.name.length * 6.8 + 20}
                    height="20"
                    rx="10"
                    fill={collab.color}
                    className="shadow-sm"
                  />
                  <text
                    x="8"
                    y="4"
                    fontSize="10"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {collab.avatar || '👤'} {collab.name}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Interactive Floor Canvas Resizing Handles & Guides */}
          <g id="floor-canvas-resize-controls" className="select-none">
            {/* Live resize dashed guide perimeter if actively dragging */}
            {floorResize && (
              <rect
                x={0}
                y={0}
                width={roomWidthPx}
                height={roomHeightPx}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="pointer-events-none"
              />
            )}

            {/* EAST HANDLE (Right border resize) */}
            <g
              id="handle-resize-east"
              className="cursor-ew-resize group"
              onPointerDown={(e) => handleFloorResizeStart(e, 'e')}
            >
              {/* Generous invisible hit test zone */}
              <rect
                x={roomWidthPx - 8}
                y={0}
                width={16}
                height={roomHeightPx}
                fill="transparent"
              />
              {/* Visual edge line indicator on hover/drag */}
              <line
                x1={roomWidthPx}
                y1={0}
                x2={roomWidthPx}
                y2={roomHeightPx}
                stroke="#4f46e5"
                strokeWidth={floorResize?.direction === 'e' ? 4 : 2}
                strokeOpacity={floorResize?.direction === 'e' ? 1 : 0.4}
                className="transition-opacity group-hover:stroke-opacity-100"
              />
              {/* East Handle Pill */}
              <g transform={`translate(${roomWidthPx - 7}, ${roomHeightPx / 2 - 20})`}>
                <rect
                  width="14"
                  height="40"
                  rx="7"
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  className="shadow-md group-hover:scale-110 transition-transform origin-center"
                />
                <line x1="5" y1="14" x2="5" y2="26" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="9" y1="14" x2="9" y2="26" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>

            {/* SOUTH HANDLE (Bottom border resize) */}
            <g
              id="handle-resize-south"
              className="cursor-ns-resize group"
              onPointerDown={(e) => handleFloorResizeStart(e, 's')}
            >
              {/* Generous invisible hit test zone */}
              <rect
                x={0}
                y={roomHeightPx - 8}
                width={roomWidthPx}
                height={16}
                fill="transparent"
              />
              {/* Visual edge line indicator on hover/drag */}
              <line
                x1={0}
                y1={roomHeightPx}
                x2={roomWidthPx}
                y2={roomHeightPx}
                stroke="#4f46e5"
                strokeWidth={floorResize?.direction === 's' ? 4 : 2}
                strokeOpacity={floorResize?.direction === 's' ? 1 : 0.4}
                className="transition-opacity group-hover:stroke-opacity-100"
              />
              {/* South Handle Pill */}
              <g transform={`translate(${roomWidthPx / 2 - 20}, ${roomHeightPx - 7})`}>
                <rect
                  width="40"
                  height="14"
                  rx="7"
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  className="shadow-md group-hover:scale-110 transition-transform origin-center"
                />
                <line x1="14" y1="5" x2="26" y2="5" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="14" y1="9" x2="26" y2="9" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>

            {/* SOUTH-EAST CORNER HANDLE (Both dimensions resize) */}
            <g
              id="handle-resize-southeast"
              className="cursor-nwse-resize group"
              onPointerDown={(e) => handleFloorResizeStart(e, 'se')}
            >
              {/* Generous invisible hit test circle */}
              <circle
                cx={roomWidthPx}
                cy={roomHeightPx}
                r={24}
                fill="transparent"
              />
              {/* Corner Badge */}
              <g transform={`translate(${roomWidthPx - 13}, ${roomHeightPx - 13})`}>
                <rect
                  width="26"
                  height="26"
                  rx="8"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-lg group-hover:scale-125 transition-transform origin-center"
                />
                {/* Diagonal resize arrows icon in white */}
                <path
                  d="M 8 18 L 18 8 M 12 8 L 18 8 L 18 14 M 14 18 L 8 18 L 8 12"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>

            {/* Live Dimensions Overlay HUD while actively resizing */}
            {floorResize && (
              <g
                transform={`translate(${roomWidthPx + 16}, ${roomHeightPx + 16})`}
                className="pointer-events-none drop-shadow-xl"
              >
                <rect
                  x="0"
                  y="0"
                  width="140"
                  height="54"
                  rx="10"
                  fill="#0f172a"
                  fillOpacity="0.95"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                />
                <text x="12" y="20" fill="#ffffff" fontSize="12" fontWeight="700">
                  {effectiveRoomWidth} × {effectiveRoomHeight} {floorPlan.unit}
                </text>
                <text x="12" y="36" fill="#94a3b8" fontSize="10">
                  {(effectiveRoomWidth * effectiveRoomHeight).toLocaleString()} sq {floorPlan.unit}
                </text>
                <text x="12" y="47" fill="#818cf8" fontSize="9" fontWeight="600">
                  Release to apply
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Empty Blank Canvas Quick-Start Guide */}
      {floorPlan.elements.length === 0 && (
        <div
          id="canvas-empty-state"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/90 text-center max-w-md w-[90%] sm:w-full select-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 mx-auto flex items-center justify-center mb-3">
            <Square className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Blank Canvas Ready
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Room dimensions: <span className="font-semibold text-slate-700">{floorPlan.roomWidth} × {floorPlan.roomHeight} {floorPlan.unit}</span>.
            Drag items from the left sidebar or click a quick-add table below to start designing:
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 text-left">
            <button
              id="btn-quick-add-round"
              onClick={() => onDropNewElement('tbl-round-4', floorPlan.roomWidth * 10, floorPlan.roomHeight * 10)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 transition flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>4-Top Round Table</span>
            </button>

            <button
              id="btn-quick-add-rect"
              onClick={() => onDropNewElement('tbl-rect-6', floorPlan.roomWidth * 10, floorPlan.roomHeight * 10 + 60)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 transition flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>6-Top Dining Table</span>
            </button>

            <button
              id="btn-quick-add-booth"
              onClick={() => onDropNewElement('tbl-booth-4', floorPlan.roomWidth * 10 - 70, floorPlan.roomHeight * 10)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 transition flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>4-Person Booth</span>
            </button>

            <button
              id="btn-quick-add-bar"
              onClick={() => onDropNewElement('bar-straight-8', floorPlan.roomWidth * 10, floorPlan.roomHeight * 10 - 70)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 transition flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Bar Station (8 Seats)</span>
            </button>
          </div>

          {onOpenTemplates && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center">
              <button
                onClick={onOpenTemplates}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Prefer a pre-built layout? Browse templates
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Inspector HUD for Selected Element (Bottom Center) */}
      {selectedElement && (
        <div
          id="canvas-quick-hud"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200"
        >
          {/* Element Name */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
            <span className="font-bold text-sm text-slate-900 truncate max-w-[120px]">
              {selectedElement.name}
            </span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {selectedElement.shape}
            </span>
          </div>

          {/* Quick Seat Adjuster (if Table) */}
          {selectedElement.type === 'table' && (
            <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
              <span className="text-xs text-slate-500 mr-1">Covers:</span>
              <button
                id="btn-hud-dec-covers"
                onClick={() => handleCoverDelta(-1)}
                disabled={selectedElement.covers <= 0}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-40"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-slate-800">
                {selectedElement.covers}
              </span>
              <button
                id="btn-hud-inc-covers"
                onClick={() => handleCoverDelta(1)}
                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Corner & End Chairs Toggle (if Table) */}
          {selectedElement.type === 'table' && selectedElement.covers >= 2 && (() => {
            const cornerIndices = getCornerChairIndices(selectedElement.shape, selectedElement.width, selectedElement.height, selectedElement.covers);
            const areCornersRemoved = cornerIndices.length > 0 && cornerIndices.every((idx) => selectedElement.removedChairs?.includes(idx));
            const endIndices = getEndChairIndices(selectedElement.shape, selectedElement.width, selectedElement.height, selectedElement.covers);
            const areEndsRemoved = endIndices.length > 0 && endIndices.every((idx) => selectedElement.removedChairs?.includes(idx));
            const hasRemovedChairs = (selectedElement.removedChairs?.length || 0) > 0;

            return (
              <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
                <button
                  id="btn-hud-toggle-corners"
                  onClick={() => handleToggleCornerChairs(selectedElement)}
                  title={areCornersRemoved ? 'Restore corner chairs' : 'Remove corner chairs'}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                    areCornersRemoved
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Armchair className="w-3.5 h-3.5" />
                  <span>{areCornersRemoved ? 'Corners: Off' : 'Corners'}</span>
                </button>

                {(selectedElement.shape === 'rectangle' || selectedElement.shape === 'oval' || selectedElement.shape === 'square') && endIndices.length > 0 && (
                  <button
                    id="btn-hud-toggle-ends"
                    onClick={() => handleToggleEndChairs(selectedElement)}
                    title={areEndsRemoved ? 'Restore end (head) chairs' : 'Remove end (head) chairs'}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                      areEndsRemoved
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{areEndsRemoved ? 'Ends: Off' : 'Ends'}</span>
                  </button>
                )}

                {hasRemovedChairs && (
                  <button
                    id="btn-hud-restore-chairs"
                    onClick={() => handleRestoreAllChairs(selectedElement)}
                    title="Restore all removed chairs"
                    className="px-1.5 py-1 rounded-md text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 border border-indigo-200"
                  >
                    Reset
                  </button>
                )}
              </div>
            );
          })()}

          {/* Quick Status Buttons (if Table) */}
          {selectedElement.type === 'table' && (
            <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
              {(['available', 'reserved', 'occupied', 'vip'] as TableStatus[]).map((status) => {
                const isCurrent = selectedElement.status === status;
                const colors = {
                  available: 'hover:bg-emerald-50 text-emerald-700',
                  reserved: 'hover:bg-amber-50 text-amber-700',
                  occupied: 'hover:bg-blue-50 text-blue-700',
                  vip: 'hover:bg-purple-50 text-purple-700'
                }[status];

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    title={`Set status: ${status.toUpperCase()}`}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase transition ${colors} ${
                      isCurrent ? 'bg-slate-900 text-white hover:bg-slate-800' : ''
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          )}

          {/* Rotate 45deg & 90deg */}
          <button
            id="btn-hud-rotate-45"
            onClick={() => handleRotateStep(45)}
            title="Rotate 45°"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition text-xs font-semibold flex items-center gap-0.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="text-[10px]">45°</span>
          </button>

          <button
            id="btn-hud-rotate-90"
            onClick={() => handleRotateStep(90)}
            title="Rotate 90° (Vertical / Horizontal alignment)"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition text-xs font-semibold flex items-center gap-0.5"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] text-indigo-600 font-bold">90°</span>
          </button>

          {/* Duplicate */}
          <button
            id="btn-hud-duplicate"
            onClick={() => onDuplicateElement(selectedElement.id)}
            title="Duplicate (Ctrl+D)"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Lock / Unlock */}
          <button
            id="btn-hud-lock"
            onClick={() => onUpdateElement({ ...selectedElement, locked: !selectedElement.locked })}
            title={selectedElement.locked ? 'Unlock element' : 'Lock position'}
            className={`p-1.5 rounded-lg transition ${
              selectedElement.locked ? 'text-amber-600 bg-amber-50' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {selectedElement.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          {/* Delete */}
          <button
            id="btn-hud-delete"
            onClick={() => onDeleteElement(selectedElement.id)}
            title="Delete element (Del)"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
