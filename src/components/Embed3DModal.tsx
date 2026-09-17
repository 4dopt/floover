import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Eye,
  Sliders,
  Sparkles
} from 'lucide-react';
import { FloordoneLogo } from './FloordoneLogo';

interface Embed3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const Embed3DModal: React.FC<Embed3DModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName
}) => {
  const [copied, setCopied] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | 'responsive'>('16:9');
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [lighting, setLighting] = useState<'banquet' | 'daylight'>('banquet');
  const [showControls, setShowControls] = useState(true);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://floordone.com';
  const embedUrl = `${origin}?project=${projectId}&view=3d&embed=true&autoOrbit=${autoOrbit}&lighting=${lighting}&controls=${showControls}`;

  const iframeHeight = aspectRatio === '16:9' ? '540' : aspectRatio === '4:3' ? '600' : '100%';

  const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="${iframeHeight}"
  style="border: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);"
  allow="fullscreen; accelerometer; gyroscope"
  title="${projectName} - Interactive 3D Venue Walkthrough"
  loading="lazy"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Venue / Studio Feature
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                Embed Interactive 3D Venue View
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Configuration Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Aspect Ratio</label>
            <div className="flex rounded-lg bg-white border border-slate-200 p-0.5">
              {(['16:9', '4:3', 'responsive'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex-1 py-1 px-2 rounded-md font-semibold transition ${
                    aspectRatio === ratio
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Initial Atmosphere</label>
            <div className="flex rounded-lg bg-white border border-slate-200 p-0.5">
              {(['banquet', 'daylight'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLighting(mode)}
                  className={`flex-1 py-1 px-2 rounded-md font-semibold capitalize transition ${
                    lighting === mode
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Orbit Camera</label>
            <button
              onClick={() => setAutoOrbit(!autoOrbit)}
              className={`w-full py-1.5 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition ${
                autoOrbit
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {autoOrbit ? 'Auto-Rotate ON' : 'Manual Rotate'}
            </button>
          </div>
        </div>

        {/* Generated Code Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              HTML Embed Code
            </span>
            <span className="text-[11px] text-slate-500">
              Paste into WordPress, Squarespace, Webflow, or custom site
            </span>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-36">
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Embed Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview / Info Note */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Clients on your website can orbit, zoom, toggle daylight/banquet lights, and inspect table seating capacities in real time.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
