import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Download,
  Users,
  Cloud,
  CloudCheck,
  RotateCcw,
  RotateCw,
  Grid3X3,
  Ruler,
  Share2,
  FolderOpen,
  Plus,
  Home,
  Tag,
  Crown,
  BookOpen,
  Menu,
  X,
  ChevronLeft,
  Edit2,
  Check
} from 'lucide-react';
import { Collaborator, FloorPlan, PricingPlanId } from '../types';
import { getEffectiveCovers } from '../utils/chairLayout';
import { FloordoneLogo } from './FloordoneLogo';

interface NavbarProps {
  activeView: 'landing' | 'editor' | 'dashboard' | 'templates' | 'pricing' | 'blogs';
  setActiveView: (view: 'landing' | 'editor' | 'dashboard' | 'templates' | 'pricing' | 'blogs') => void;
  floorPlan: FloorPlan;
  onNewProject: () => void;
  onSaveProject: () => void;
  onRenameProject?: (newName: string) => void;
  isSaving: boolean;
  syncStatus: 'synced' | 'saving' | 'offline';
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  snapToGrid: boolean;
  setSnapToGrid: (val: boolean) => void;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  collaborators: Collaborator[];
  currentUser: Collaborator;
  onOpenCollaboration: () => void;
  onOpenExport: () => void;
  userPlan?: PricingPlanId;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  floorPlan,
  onNewProject,
  onSaveProject,
  onRenameProject,
  isSaving,
  syncStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  snapToGrid,
  setSnapToGrid,
  showGrid,
  setShowGrid,
  collaborators,
  currentUser,
  onOpenCollaboration,
  onOpenExport,
  userPlan = 'free'
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(floorPlan.name);

  // Sync title input when floorPlan changes
  useEffect(() => {
    setTitleInput(floorPlan.name);
  }, [floorPlan.name]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== floorPlan.name) {
      onRenameProject?.(trimmed);
    } else {
      setTitleInput(floorPlan.name);
    }
  };

  const tableCount = floorPlan.elements.filter((e) => e.type === 'table').length;
  const totalCovers = floorPlan.elements
    .filter((e) => e.type === 'table')
    .reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);

  return (
    <>
      <header id="app-navbar" className="h-14 sm:h-16 bg-white border-b border-slate-200 px-2 sm:px-4 flex items-center justify-between select-none shrink-0 z-30">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
          {/* Back to Projects button when in Editor view */}
          {activeView === 'editor' && (
            <button
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
              title="Return to Projects dashboard"
            >
              <ChevronLeft className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="hidden xs:inline">Projects</span>
            </button>
          )}

          <div
            id="navbar-brand-button"
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => setActiveView('landing')}
            title="Floordone - Home & Overview"
          >
            <FloordoneLogo size="md" showWordmark={true} />
          </div>

          {/* Editable Project Name in Designer */}
          {activeView === 'editor' ? (
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 sm:pl-3 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSubmit();
                      if (e.key === 'Escape') {
                        setTitleInput(floorPlan.name);
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="px-2 py-0.5 text-xs font-bold bg-slate-50 border border-indigo-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-36 sm:w-56"
                  />
                  <button
                    onClick={handleTitleSubmit}
                    className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 px-1.5 py-1 rounded-lg transition min-w-0 group"
                  title="Click to rename project"
                >
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[200px] xl:max-w-[260px]">
                    {floorPlan.name}
                  </p>
                  <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  <span className="hidden xl:inline text-[11px] text-slate-400">
                    ({tableCount} tbls • {totalCovers} seats)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:block border-l border-slate-200 pl-3">
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] xl:max-w-[280px]">
                {floorPlan.name} • <span className="text-slate-700 font-semibold">{tableCount}</span> tables ({totalCovers} seats)
              </p>
            </div>
          )}

          {/* Desktop View Switcher Tabs */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg ml-2 border border-slate-200/80">
            <button
              id="nav-tab-landing"
              onClick={() => setActiveView('landing')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'landing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              Home
            </button>
            <button
              id="nav-tab-editor"
              onClick={() => setActiveView('editor')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Designer
            </button>
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Projects
            </button>
            <button
              id="nav-tab-templates"
              onClick={() => setActiveView('templates')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'templates'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Templates
            </button>
            <button
              id="nav-tab-pricing"
              onClick={() => setActiveView('pricing')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'pricing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Pricing
            </button>
            <button
              id="nav-tab-blogs"
              onClick={() => setActiveView('blogs')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'blogs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Blog
            </button>
          </div>
        </div>

        {/* Center: Editor Utilities (visible on desktop) */}
        {activeView === 'editor' && (
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <button
              id="btn-undo"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="btn-redo"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <button
              id="btn-toggle-grid"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid Lines"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                showGrid ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Grid
            </button>

            <button
              id="btn-toggle-snap"
              onClick={() => setSnapToGrid(!snapToGrid)}
              title="Toggle Snap to Grid"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                snapToGrid ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              Snap
            </button>
          </div>
        )}

        {/* Right: Actions, Save, Share, Export */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Undo & Redo (for touch devices without keyboards) */}
          {activeView === 'editor' && (
            <div className="flex lg:hidden items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo"
                className="p-1 rounded text-slate-700 disabled:opacity-30 active:bg-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo"
                className="p-1 rounded text-slate-700 disabled:opacity-30 active:bg-slate-200"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* PROMINENT SAVE BUTTON (Visible everywhere) */}
          <button
            id="btn-save-project"
            onClick={onSaveProject}
            disabled={isSaving}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
              syncStatus === 'saving'
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            title="Save changes to Projects"
          >
            {syncStatus === 'saving' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="hidden xs:inline">Saving</span>
              </>
            ) : (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save</span>
              </>
            )}
          </button>

          {/* New Plan (Desktop) */}
          <button
            id="btn-nav-new-plan"
            onClick={onNewProject}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition"
            title="Create a new blank or templated floor plan"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>New</span>
          </button>

          {/* Live Collaborators Facepile Stack */}
          {collaborators.length > 0 && (
            <button
              id="btn-nav-collaborators"
              onClick={onOpenCollaboration}
              className="hidden sm:flex items-center -space-x-1.5 px-1 py-1 hover:opacity-90 transition cursor-pointer"
              title={`${collaborators.length} team collaborator(s) live in this floor plan`}
            >
              {collaborators.slice(0, 3).map((c) => (
                <span
                  key={c.id}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-xs transition-transform hover:scale-110"
                  style={{ backgroundColor: c.color }}
                  title={`${c.name} (${c.role || 'editor'})`}
                >
                  {c.avatar || '👤'}
                </span>
              ))}
              {collaborators.length > 3 && (
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-700 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-xs">
                  +{collaborators.length - 3}
                </span>
              )}
            </button>
          )}

          {/* Share Button (Figma-style collaboration) */}
          <button
            id="btn-share-link"
            onClick={onOpenCollaboration}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
            title="Share live collaboration link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>

          {/* Export PDF */}
          <button
            id="btn-export-pdf"
            onClick={onOpenExport}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            id="btn-mobile-menu"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-1.5 md:hidden rounded-lg text-slate-700 hover:bg-slate-100 transition"
            title="Open Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-down Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-xl z-50 p-4 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveView('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition ${
                activeView === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-indigo-600" />
              Projects
            </button>

            <button
              onClick={() => {
                setActiveView('editor');
                setIsMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition ${
                activeView === 'editor'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              Designer
            </button>

            <button
              onClick={() => {
                setActiveView('templates');
                setIsMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition ${
                activeView === 'templates'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Templates
            </button>

            <button
              onClick={() => {
                setActiveView('pricing');
                setIsMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition ${
                activeView === 'pricing'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Tag className="w-4 h-4 text-indigo-600" />
              Pricing
            </button>

            <button
              id="mobile-nav-blog"
              onClick={() => {
                setActiveView('blogs');
                setIsMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition ${
                activeView === 'blogs'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Blog
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenExport();
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-300" />
              Export PDF
            </button>

            <button
              onClick={() => {
                onOpenCollaboration();
                setIsMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Link
            </button>
          </div>

          {activeView === 'editor' && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Show Grid Lines
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                Snap to Grid
              </label>
            </div>
          )}
        </div>
      )}
    </>
  );
};
