import React, { useState } from 'react';
import {
  Download,
  FileText,
  Image,
  FileCode,
  Check,
  Loader2,
  Printer,
  Sparkles,
  Sliders,
  Compass,
  FileSpreadsheet,
  Layers,
  Award
} from 'lucide-react';
import { FloorPlan } from '../types';
import { exportFloorPlanToPdf, exportFloorPlanToPng } from '../utils/pdfExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorPlan: FloorPlan;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  floorPlan
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'png' | 'json'>('pdf');
  const [dpiQuality, setDpiQuality] = useState<'standard' | 'high' | 'ultra'>('high');
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [includeManifest, setIncludeManifest] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeTitleBlock, setIncludeTitleBlock] = useState(true);
  const [includeCompass, setIncludeCompass] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage('Preparing vector floor plan geometry...');

    try {
      const container = document.getElementById('floorplan-canvas-container');
      if (!container) {
        throw new Error('Canvas container not found');
      }

      if (exportType === 'pdf') {
        const dpiLabel = dpiQuality === 'ultra' ? '450 DPI Ultra' : dpiQuality === 'high' ? '300 DPI HD' : '150 DPI';
        setStatusMessage(`Rasterizing vector geometry at ${dpiLabel} precision...`);

        await exportFloorPlanToPdf(container, floorPlan, {
          includeManifest,
          includeStats,
          paperSize,
          orientation,
          dpiQuality,
          includeTitleBlock,
          includeCompass,
          includeLegend
        });
        setStatusMessage('Ultra HD PDF generated & downloaded!');
      } else if (exportType === 'png') {
        const scale = dpiQuality === 'ultra' ? 5.0 : dpiQuality === 'high' ? 3.5 : 2.0;
        setStatusMessage(`Rendering high-resolution raster image (${Math.round(floorPlan.roomWidth * 20 * scale)}px)...`);
        await exportFloorPlanToPng(container, floorPlan.name, floorPlan, scale);
        setStatusMessage('High-resolution PNG downloaded!');
      } else if (exportType === 'json') {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(floorPlan, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `${floorPlan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-backup.json`);
        downloadAnchor.click();
        setStatusMessage('Project backup JSON downloaded!');
      }

      setTimeout(() => {
        setIsExporting(false);
        setStatusMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export failed:', err);
      setStatusMessage('Export encountered an issue. Please try again.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Export High-Definition Plan
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-2.5 h-2.5" /> 300+ DPI HD
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Architectural presentation blueprint & maître d' seating manifest.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Format Selection Cards */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="export-opt-pdf"
              onClick={() => setExportType('pdf')}
              className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition ${
                exportType === 'pdf'
                  ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="text-xs">Printable PDF</span>
              <span className="text-[10px] text-slate-400 font-normal">CAD Blueprint</span>
            </button>

            <button
              id="export-opt-png"
              onClick={() => setExportType('png')}
              className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition ${
                exportType === 'png'
                  ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Image className="w-5 h-5 text-blue-600" />
              <span className="text-xs">Ultra HD PNG</span>
              <span className="text-[10px] text-slate-400 font-normal">Direct Vector</span>
            </button>

            <button
              id="export-opt-json"
              onClick={() => setExportType('json')}
              className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition ${
                exportType === 'json'
                  ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileCode className="w-5 h-5 text-slate-600" />
              <span className="text-xs">Project JSON</span>
              <span className="text-[10px] text-slate-400 font-normal">Full Backup</span>
            </button>
          </div>
        </div>

        {/* Quality / Resolution Selector */}
        {(exportType === 'pdf' || exportType === 'png') && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Export Clarity & Resolution
                </span>
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                {dpiQuality === 'ultra' ? '450 DPI Archival' : dpiQuality === 'high' ? '300 DPI Crisp HD' : '150 DPI Standard'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                {
                  id: 'high',
                  label: 'Ultra HD 300 DPI',
                  sub: 'Razor sharp, print-ready',
                  tag: 'Recommended'
                },
                {
                  id: 'ultra',
                  label: 'Super HD 450 DPI',
                  sub: 'Archival blueprint grade',
                  tag: 'Max Detail'
                },
                {
                  id: 'standard',
                  label: 'Standard 150 DPI',
                  sub: 'Lightweight for email',
                  tag: 'Fast'
                }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDpiQuality(opt.id as any)}
                  className={`p-2 rounded-xl text-left border transition ${
                    dpiQuality === opt.id
                      ? 'bg-white border-indigo-500 shadow-xs text-indigo-950 font-bold'
                      : 'bg-slate-100/70 border-slate-200/70 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-bold block">{opt.label}</span>
                  </div>
                  <span className="text-[9.5px] text-slate-500 block leading-tight">{opt.sub}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>
                <strong>Zero Blur Guarantee:</strong> Vectors are rasterized at native {dpiQuality === 'ultra' ? '450 DPI' : dpiQuality === 'high' ? '300 DPI' : '150 DPI'} with antialiased typography and geometric precision.
              </span>
            </div>
          </div>
        )}

        {/* PDF-Specific Options */}
        {exportType === 'pdf' && (
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Architectural Sheet Layout</span>
              <span className="text-[10px] font-normal text-slate-500">A-101 / A-102</span>
            </h4>

            {/* Paper Size & Orientation Controls */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">Paper Format:</span>
                <div className="flex rounded-lg bg-slate-200/70 p-0.5">
                  <button
                    onClick={() => setPaperSize('a4')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold transition text-center ${
                      paperSize === 'a4' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    A4 (297×210mm)
                  </button>
                  <button
                    onClick={() => setPaperSize('letter')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold transition text-center ${
                      paperSize === 'letter' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    US Letter
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">Orientation:</span>
                <div className="flex rounded-lg bg-slate-200/70 p-0.5">
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold transition text-center ${
                      orientation === 'landscape' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Landscape
                  </button>
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold transition text-center ${
                      orientation === 'portrait' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Portrait
                  </button>
                </div>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  id="chk-include-manifest"
                  type="checkbox"
                  checked={includeManifest}
                  onChange={(e) => setIncludeManifest(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-900">Include Seating Manifest & Maître D' Schedule (Page 2)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  id="chk-include-stats"
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Include Capacity & Covers Metric Bar</span>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTitleBlock}
                    onChange={(e) => setIncludeTitleBlock(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span>CAD Title Block</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCompass}
                    onChange={(e) => setIncludeCompass(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span>North Compass Rose</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Status notice */}
        {statusMessage && (
          <div className="text-xs text-center font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-export"
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting HD {exportType.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {exportType === 'pdf' ? 'Ultra HD PDF' : exportType === 'png' ? 'High-Res PNG' : 'Project JSON'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
