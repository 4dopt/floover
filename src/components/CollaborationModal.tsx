import React, { useState, useMemo } from 'react';
import {
  Users,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Eye,
  MessageSquare,
  Edit3,
  Code,
  Link2,
  ChevronDown,
  Info,
  Layers,
  Crown,
  Share2
} from 'lucide-react';
import { Collaborator, FloorElement } from '../types';
import { CollaboratorRole } from '../types/entitlements';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Collaborator;
  onUpdateCurrentUser: (updates: Partial<Collaborator>) => void;
  collaborators: Collaborator[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  projectId: string;
  projectName?: string;
  selectedElement?: FloorElement | null;
  elements?: FloorElement[];
  isSimulatedActive: boolean;
  onToggleSimulated: (active: boolean) => void;
  activeRole?: CollaboratorRole;
  onChangeActiveRole?: (role: CollaboratorRole) => void;
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
  projectName = 'Main Floor Plan',
  selectedElement = null,
  elements = [],
  isSimulatedActive,
  onToggleSimulated,
  activeRole = 'owner',
  onChangeActiveRole
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');
  const [shareRole, setShareRole] = useState<CollaboratorRole>('commenter');
  const [linkToSelection, setLinkToSelection] = useState<boolean>(!!selectedElement);
  const [selectedElementIdForLink, setSelectedElementIdForLink] = useState<string>(
    selectedElement ? selectedElement.id : ''
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  if (!isOpen) return null;

  // Build the Figma-style dynamic live link
  const targetElementId = linkToSelection ? (selectedElement?.id || selectedElementIdForLink) : null;
  const queryParams = new URLSearchParams();
  queryParams.set('view', 'editor');
  queryParams.set('project', projectId);
  queryParams.set('role', shareRole);
  if (targetElementId) {
    queryParams.set('element', targetElementId);
  }
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : '';
  const shareUrl = `${baseUrl}?${queryParams.toString()}`;

  // Build embeddable iframe snippet
  const embedSnippet = `<iframe src="${baseUrl}?view=editor&project=${projectId}&role=viewer&embed=1" width="100%" height="600" frameborder="0" style="border:1px solid #e2e8f0;border-radius:12px;" allowfullscreen></iframe>`;

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      // Fallback for sandboxed iframes
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        console.warn('Fallback copy error:', err);
        return false;
      }
    }
  };

  const handleCopyLink = async () => {
    await copyToClipboard(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyEmbed = async () => {
    await copyToClipboard(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2200);
  };

  const currentSelectedEl = elements.find((e) => e.id === (selectedElement?.id || selectedElementIdForLink));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Share &quot;{projectName}&quot;
                </h2>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Figma Link
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : connectionStatus === 'connecting'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="capitalize font-medium">
                  {connectionStatus === 'connected' ? 'Connected to Real-Time Cloud Room' : connectionStatus}
                </span>
                <span className="text-slate-300">•</span>
                <span>{collaborators.length + 1} present in file</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Selector (Invite Link vs Embed) */}
        <div className="flex items-center border-b border-slate-200">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Invite Link (Live Collaboration)</span>
          </button>

          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'embed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Embed HTML Code</span>
          </button>
        </div>

        {activeTab === 'link' ? (
          <>
            {/* Permission Selector ("Anyone with the link can...") */}
            <div className="space-y-3 bg-slate-50/90 border border-slate-200 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Anyone with the link
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Control what recipients can see and do when opening this URL
                  </p>
                </div>

                {/* Role Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition min-w-[140px] cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      {shareRole === 'commenter' ? (
                        <>
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                          <span>Can comment</span>
                        </>
                      ) : shareRole === 'editor' ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Can edit</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Can view</span>
                        </>
                      )}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isRoleDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-30 space-y-1 animate-in fade-in zoom-in-95">
                      {/* Can comment (Figma client review style) */}
                      <button
                        type="button"
                        onClick={() => {
                          setShareRole('commenter');
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-start gap-2.5 transition cursor-pointer ${
                          shareRole === 'commenter' ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Can comment (Recommended)</span>
                            {shareRole === 'commenter' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Client Reviewer mode: leave pin comments, navigate 3D and test sightlines, cannot move tables.
                          </p>
                        </div>
                      </button>

                      {/* Can edit */}
                      <button
                        type="button"
                        onClick={() => {
                          setShareRole('editor');
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-start gap-2.5 transition cursor-pointer ${
                          shareRole === 'editor' ? 'bg-blue-50 text-blue-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Edit3 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Can edit</span>
                            {shareRole === 'editor' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Co-design seat: add, move, rotate tables and fixtures in real time with live cursor sync.
                          </p>
                        </div>
                      </button>

                      {/* Can view */}
                      <button
                        type="button"
                        onClick={() => {
                          setShareRole('viewer');
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-start gap-2.5 transition cursor-pointer ${
                          shareRole === 'viewer' ? 'bg-slate-100 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Eye className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Can view</span>
                            {shareRole === 'viewer' && <Check className="w-3.5 h-3.5 text-slate-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Read-only guest link: navigate 2D and 3D walkthrough with zero editing or comments.
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Link to Selected Object Checkbox (Figma feature) */}
              <div className="pt-2 border-t border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkToSelection}
                    onChange={(e) => setLinkToSelection(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Link to selected item{' '}
                    {currentSelectedEl ? (
                      <span className="text-blue-600 font-bold">({currentSelectedEl.name})</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(none selected)</span>
                    )}
                  </span>
                </label>
                {linkToSelection && !currentSelectedEl && elements.length > 0 && (
                  <div className="mt-1.5 pl-5.5">
                    <select
                      value={selectedElementIdForLink}
                      onChange={(e) => setSelectedElementIdForLink(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                    >
                      <option value="">Select an element to focus...</option>
                      {elements.map((el) => (
                        <option key={el.id} value={el.id}>
                          {el.name} ({el.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Live URL Display and Copy Button */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full px-3 py-2 pr-8 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-mono select-all truncate focus:outline-hidden"
                  />
                </div>

                <button
                  id="btn-copy-figma-link"
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied Link!' : 'Copy link'}
                </button>
              </div>

              {/* Quick Multi-Tab Testing Action */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Links auto-authenticate and connect via live WebSockets.
                </span>

                <a
                  id="btn-test-in-new-tab"
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Test in new tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Active Teammates in this File */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Active in this file ({collaborators.length + 1})</span>
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-Time Sync
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
                {/* You */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shadow-2xs"
                      style={{ backgroundColor: currentUser.color }}
                    >
                      {currentUser.avatar || '👤'}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{currentUser.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Current Session</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                      {activeRole === 'owner' ? '👑 Host / Owner' : activeRole}
                    </span>
                  </div>
                </div>

                {/* Other Collaborators */}
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shadow-2xs"
                        style={{ backgroundColor: c.color }}
                      >
                        {c.avatar || '👤'}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {c.selectedElementId ? 'Selecting table' : 'Navigating canvas'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.role === 'commenter'
                        ? 'bg-amber-50 text-amber-700'
                        : c.role === 'viewer'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {c.role === 'commenter'
                        ? '💬 Commenter'
                        : c.role === 'viewer'
                        ? '👁️ Viewer'
                        : '✏️ Editor'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Teammate Cursor Simulation Toggle */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Simulate Live Colleagues
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Simulate 2 active users (Lead Designer & Client Reviewer) with live cursors and comments.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={isSimulatedActive}
                  onChange={(e) => onToggleSimulated(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </>
        ) : (
          /* Embed HTML Tab (Figma style) */
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Embed Interactive 2D/3D Floor Plan
                </h3>
                <p className="text-[11px] text-slate-500">
                  Paste this snippet into your client proposal, Notion doc, or venue website.
                </p>
              </div>

              <button
                onClick={handleCopyEmbed}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEmbed ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <textarea
              readOnly
              rows={4}
              value={embedSnippet}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all focus:outline-hidden"
            />

            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/60">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                Embedded viewers render in read-only 3D walkthrough &amp; 2D floor mode with real-time room capacity data.
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-400">
            Figma Live Sync • WebSocket Encrypted
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
