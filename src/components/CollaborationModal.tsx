import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Sparkles,
  Wifi,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Collaborator } from '../types';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Collaborator;
  onUpdateCurrentUser: (updates: Partial<Collaborator>) => void;
  collaborators: Collaborator[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  projectId: string;
  isSimulatedActive: boolean;
  onToggleSimulated: (active: boolean) => void;
}

const AVATARS = ['👨‍💼', '👩‍💼', '👨‍🍳', '👩‍🍳', '🤵', '🥂', '📋', '🎨', '💼'];
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateCurrentUser,
  collaborators,
  connectionStatus,
  projectId,
  isSimulatedActive,
  onToggleSimulated
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?project=${projectId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenSecondTab = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Team Real-Time Collaboration
              </h2>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : connectionStatus === 'connecting'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-slate-500 capitalize font-medium">
                  {connectionStatus === 'connected' ? 'Connected to Live Server' : connectionStatus}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Shareable Link Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Invite Link (Collaborate across multiple tabs or teammates)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-600 font-mono truncate"
            />
            <button
              id="btn-copy-collab-link"
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Anyone with this link can join this layout in real-time, see live cursors, and edit tables.
          </p>
        </div>

        {/* Your Profile Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Your Collaborator Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Your Display Name
              </label>
              <input
                id="input-user-display-name"
                type="text"
                value={currentUser.name}
                onChange={(e) => onUpdateCurrentUser({ name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Role Avatar
              </label>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    onClick={() => onUpdateCurrentUser({ avatar: av })}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                      currentUser.avatar === av
                        ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Cursor & Selection Color
            </label>
            <div className="flex items-center gap-2">
              {COLORS.map((col) => (
                <button
                  key={col}
                  onClick={() => onUpdateCurrentUser({ color: col })}
                  style={{ backgroundColor: col }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    currentUser.color === col ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Active Collaborators in Room */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Active Team in Room ({collaborators.length + 1})
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Sync Active
            </span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
            {/* You */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.avatar}
                </span>
                <span className="font-bold text-slate-900">{currentUser.name} (You)</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Host / Editor
              </span>
            </div>

            {/* Other Collaborators */}
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.avatar || '👤'}
                  </span>
                  <span className="font-bold text-slate-800">{c.name}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {c.selectedElementId ? 'Editing item' : 'Active on canvas'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Simulation Helper */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Simulate Team Teammates
            </h4>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Simulate 2 active colleagues moving cursors and editing in real-time.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
            <input
              type="checkbox"
              checked={isSimulatedActive}
              onChange={(e) => onToggleSimulated(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
