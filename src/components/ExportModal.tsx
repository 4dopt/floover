import React, { useState } from 'react';
import {
  Download,
  FileText,
  Image,
  FileCode,
  Check,
  Loader2,
  Printer,
  Table as TableIcon
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
  const [includeManifest, setIncludeManifest] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage('Preparing floor plan vector data...');

    try {
      const container = document.getElementById('floorplan-canvas-container');
      if (!container) {
        throw new Error('Canvas container not found');
      }

      if (exportType === 'pdf') {
        setStatusMessage('Generating high-res PDF and seating manifest...');
        await exportFloorPlanToPdf(container, floorPlan, {
          includeManifest,
          includeStats,
          orientation
        });
        setStatusMessage('PDF downloaded successfully!');
      } else if (exportType === 'png') {
        setStatusMessage('Rendering high-resolution image...');
        await exportFloorPlanToPng(container, floorPlan.name, floorPlan);
        setStatusMessage('Image downloaded successfully!');
      } else if (exportType === 'json') {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(floorPlan, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `${floorPlan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-backup.json`);
        downloadAnchor.click();
        setStatusMessage('Project JSON downloaded!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Export & Print Floor Plan
              </h2>
              <p className="text-xs text-slate-500">
                High-resolution ready for print, client sharing, or archive.
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
        <div className="grid grid-cols-3 gap-2">
          <button
            id="export-opt-pdf"
            onClick={() => setExportType('pdf')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition ${
              exportType === 'pdf'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="text-xs">Printable PDF</span>
          </button>

          <button
            id="export-opt-png"
            onClick={() => setExportType('png')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition ${
              exportType === 'png'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Image className="w-5 h-5 text-blue-600" />
            <span className="text-xs">PNG Image</span>
          </button>

          <button
            id="export-opt-json"
            onClick={() => setExportType('json')}
            className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition ${
              exportType === 'json'
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCode className="w-5 h-5 text-slate-600" />
            <span className="text-xs">Project JSON</span>
          </button>
        </div>

        {/* PDF-Specific Options */}
        {exportType === 'pdf' && (
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              PDF Print Options
            </h4>

            {/* Checkbox: Table Manifest */}
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                id="chk-include-manifest"
                type="checkbox"
                checked={includeManifest}
                onChange={(e) => setIncludeManifest(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold">Include Seating Manifest Table (Page 2)</span>
            </label>

            {/* Checkbox: Include Stats Bar */}
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                id="chk-include-stats"
                type="checkbox"
                checked={includeStats}
                onChange={(e) => setIncludeStats(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Include Capacity Summary & Legend</span>
            </label>

            {/* Orientation */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Page Orientation:</span>
              <div className="flex rounded-lg bg-slate-200/70 p-0.5">
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    orientation === 'landscape' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Landscape
                </button>
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                    orientation === 'portrait' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Portrait
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status notice */}
        {statusMessage && (
          <div className="text-xs text-center font-semibold text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
            {statusMessage}
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
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download {exportType.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
