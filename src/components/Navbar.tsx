import React from 'react';
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
  Crown
} from 'lucide-react';
import { Collaborator, FloorPlan, PricingPlanId } from '../types';
import { getEffectiveCovers } from '../utils/chairLayout';
import { FloordoneLogo } from './FloordoneLogo';

interface NavbarProps {
  activeView: 'landing' | 'editor' | 'dashboard' | 'templates' | 'pricing';
  setActiveView: (view: 'landing' | 'editor' | 'dashboard' | 'templates' | 'pricing') => void;
  floorPlan: FloorPlan;
  onNewProject: () => void;
  onSaveProject: () => void;
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
  const tableCount = floorPlan.elements.filter((e) => e.type === 'table').length;
  const totalCovers = floorPlan.elements
    .filter((e) => e.type === 'table')
    .reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);

  return (
    <header id="app-navbar" className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Brand & Navigation */}
      <div className="flex items-center gap-4">
        <div
          id="navbar-brand-button"
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setActiveView('landing')}
          title="Floordone - Home & Overview"
        >
          <FloordoneLogo size="md" showWordmark={true} />
          <div className="hidden lg:block border-l border-slate-200 pl-3">
            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] xl:max-w-[280px]">
              {floorPlan.name} • <span className="text-slate-700 font-semibold">{tableCount}</span> tables ({totalCovers} seats)
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg ml-3 border border-slate-200/80">
          <button
            id="nav-tab-landing"
            onClick={() => setActiveView('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'landing'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Floordone Overview & Landing"
          >
            <Home className="w-3.5 h-3.5 text-indigo-600" />
            Home
          </button>
          <button
            id="nav-tab-editor"
            onClick={() => setActiveView('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'pricing'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Pricing Plans (From $1.19/mo)"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            Pricing
            <span className="hidden xl:inline-block px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              $1.19/mo
            </span>
          </button>
        </div>

        {/* New Plan Button */}
        <button
          id="btn-nav-new-plan"
          onClick={onNewProject}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 border border-indigo-200 text-xs font-bold transition shadow-2xs"
          title="Create a new blank or templated floor plan"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">New Plan</span>
        </button>
      </div>

      {/* Center: Editor Utilities (visible when in editor view) */}
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

      {/* Right: Cloud Sync, Collaboration, Actions */}
      <div className="flex items-center gap-3">
        {/* Cloud Sync Status */}
        <div
          onClick={onSaveProject}
          title={syncStatus === 'saving' ? 'Syncing to cloud...' : 'Synced to Cloud'}
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer px-2 py-1 rounded hover:bg-slate-100 transition"
        >
          {syncStatus === 'saving' ? (
            <>
              <Cloud className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-amber-600 font-medium">Syncing...</span>
            </>
          ) : (
            <>
              <CloudCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600">Saved to Cloud</span>
            </>
          )}
        </div>

        {/* Real-time Team Collaboration Badge */}
        <button
          id="btn-collaboration"
          onClick={onOpenCollaboration}
          className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition text-xs font-medium text-slate-700"
          title="Team Collaboration"
        >
          <div className="flex -space-x-1.5 overflow-hidden items-center">
            {/* Current user */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white"
              style={{ backgroundColor: currentUser.color }}
              title={`You (${currentUser.name})`}
            >
              {currentUser.avatar || '👤'}
            </div>
            {/* Collaborators */}
            {collaborators.slice(0, 3).map((collab) => (
              <div
                key={collab.id}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white"
                style={{ backgroundColor: collab.color }}
                title={collab.name}
              >
                {collab.avatar || '👤'}
              </div>
            ))}
          </div>
          <span className="ml-0.5 font-semibold text-slate-800">
            {collaborators.length + 1}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse" />
        </button>

        {/* User Plan Badge */}
        <button
          id="btn-user-plan-badge"
          onClick={() => setActiveView('pricing')}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
            userPlan === 'lifetime'
              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              : userPlan === 'pro'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              : userPlan === 'solo'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Manage Plan & Billing (Plans start at $1.19/mo)"
        >
          {userPlan === 'lifetime' ? (
            <>
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Lifetime Pass</span>
            </>
          ) : userPlan === 'pro' ? (
            <>
              <Crown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pro Studio</span>
            </>
          ) : userPlan === 'solo' ? (
            <>
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Solo Plan</span>
            </>
          ) : (
            <>
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upgrade</span>
              <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100/80 px-1 rounded">
                $1.19
              </span>
            </>
          )}
        </button>

        {/* Figma-Style Share Button */}
        <button
          id="btn-share-link"
          onClick={onOpenCollaboration}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          title="Share Figma-style live collaboration link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* Export PDF */}
        <button
          id="btn-export-pdf"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
