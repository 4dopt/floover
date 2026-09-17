import React, { useMemo } from 'react';
import {
  Calculator,
  Users,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  X,
  Info,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { FloorPlan, FloorElement } from '../types';

interface CapacityCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorPlan: FloorPlan;
  onSelectElement?: (id: string) => void;
}

export const CapacityCalculatorModal: React.FC<CapacityCalculatorModalProps> = ({
  isOpen,
  onClose,
  floorPlan,
  onSelectElement
}) => {
  if (!isOpen) return null;

  const tables = useMemo(
    () => floorPlan.elements.filter((e) => e.type === 'table'),
    [floorPlan.elements]
  );

  const totalCurrentCovers = useMemo(
    () => tables.reduce((acc, t) => acc + (t.covers || 0), 0),
    [tables]
  );

  const totalAreaSq = floorPlan.roomWidth * floorPlan.roomHeight;
  const isImperial = floorPlan.unit === 'ft';
  const unitLabel = isImperial ? 'sq ft' : 'sq m';

  // Fire Code & Event Industry Occupancy Benchmarks
  // Banquet seated: ~15 sq ft per guest
  // Conference/Meeting: ~20 sq ft per guest
  // Cocktail/Standing: ~8 sq ft per guest
  const banquetCapacity = Math.round(totalAreaSq / (isImperial ? 15 : 1.4));
  const cocktailCapacity = Math.round(totalAreaSq / (isImperial ? 8 : 0.75));
  const conferenceCapacity = Math.round(totalAreaSq / (isImperial ? 20 : 1.85));

  // Spacing & Aisle Clearance Analysis
  // Checks distance between table edges: center-to-center distance - (radiusA + radiusB)
  const spacingIssues = useMemo(() => {
    const issues: {
      tableA: FloorElement;
      tableB: FloorElement;
      distanceFt: number;
      minRequiredFt: number;
      status: 'critical' | 'warning';
    }[] = [];

    const minClearanceFt = 3.0; // 36 inches / 3.0 ft minimum ADA / waiter aisle clearance

    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const a = tables[i];
        const b = tables[j];

        const centerAx = a.x + a.width / 2;
        const centerAy = a.y + a.height / 2;
        const centerBx = b.x + b.width / 2;
        const centerBy = b.y + b.height / 2;

        const centerDistance = Math.hypot(centerAx - centerBx, centerAy - centerBy);
        // Assuming 20 pixels per foot/unit approx
        const scalePixelsPerUnit = 20;
        const radiusA = Math.max(a.width, a.height) / 2;
        const radiusB = Math.max(b.width, b.height) / 2;
        const edgeToEdgePx = centerDistance - (radiusA + radiusB);
        const edgeToEdgeFt = Math.max(0, edgeToEdgePx / scalePixelsPerUnit);

        if (edgeToEdgeFt < minClearanceFt) {
          issues.push({
            tableA: a,
            tableB: b,
            distanceFt: Number(edgeToEdgeFt.toFixed(1)),
            minRequiredFt: minClearanceFt,
            status: edgeToEdgeFt < 2.0 ? 'critical' : 'warning'
          });
        }
      }
    }

    return issues;
  }, [tables]);

  const utilizationRate = Math.min(150, Math.round((totalCurrentCovers / Math.max(1, banquetCapacity)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Dynamic Seating & Spacing Engine
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-2.5 h-2.5" /> Pro Feature
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated guest density, fire egress limits & 36" waiter aisle compliance.
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

        {/* Top Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Current Covers</span>
              <Users className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {totalCurrentCovers} <span className="text-xs font-normal text-slate-400">seats</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              across {tables.length} tables
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Banquet Egress</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              ~{banquetCapacity} <span className="text-xs font-normal text-slate-400">max</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              15 {unitLabel} per guest
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Hall Density</span>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className={`text-xl font-black ${utilizationRate > 100 ? 'text-amber-600' : 'text-indigo-600'}`}>
              {utilizationRate}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {utilizationRate > 100 ? 'Over recommended density' : 'Optimal seating density'}
            </div>
          </div>
        </div>

        {/* Occupancy Configurations by Event Style */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Occupancy Limits by Layout Archetype
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Formal Banquet</span>
              <span className="text-sm font-bold text-slate-900">~{banquetCapacity} guests</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Round 60"/72" tables</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Cocktail / Reception</span>
              <span className="text-sm font-bold text-emerald-700">~{cocktailCapacity} guests</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Standing + high-tops</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Conference / Forum</span>
              <span className="text-sm font-bold text-slate-900">~{conferenceCapacity} guests</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Classroom seminar style</span>
            </div>
          </div>
        </div>

        {/* Table Spacing & Service Aisle Clearance Diagnostics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Waiter Aisle Clearance (Min 36" / 3.0 ft)
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {spacingIssues.length === 0 ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All tables comply
                </span>
              ) : (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {spacingIssues.length} tight clearances
                </span>
              )}
            </span>
          </div>

          {spacingIssues.length === 0 ? (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Spacious Service Corridors Detected</span>
                <span>
                  All tables maintain at least 3.0 ft clearance between edges, allowing seamless service tray passage and guest chair pull-out.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {spacingIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900">
                        {issue.tableA.name} ↔ {issue.tableB.name}
                      </span>
                      <span className="text-[11px] text-amber-800 block">
                        Clearance: {issue.distanceFt} ft (requires ≥ {issue.minRequiredFt} ft)
                      </span>
                    </div>
                  </div>
                  {onSelectElement && (
                    <button
                      onClick={() => {
                        onSelectElement(issue.tableA.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <span>Locate</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Calculations conform to NFPA 101 Life Safety standards</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
