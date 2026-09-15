import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  CloudCheck,
  Cloud,
  Calendar,
  Layers,
  Armchair,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { ProjectSummary } from '../types';
import { NewPlanModal } from './NewPlanModal';
import { FlooverLogo } from './FlooverLogo';

interface DashboardProps {
  projects: ProjectSummary[];
  onOpenProject: (id: string) => void;
  onCreateProject: (name: string, venueType: string, width: number, height: number, templateId?: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onRefreshProjects: () => void;
  isSyncing: boolean;
  onOpenTemplates: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onOpenProject,
  onCreateProject,
  onDuplicateProject,
  onDeleteProject,
  onRefreshProjects,
  isSyncing,
  onOpenTemplates
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [venueFilter, setVenueFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVenue = venueFilter === 'all' || proj.venueType === venueFilter;
    return matchesSearch && matchesVenue;
  });

  const totalCapacity = projects.reduce((sum, p) => sum + (p.totalCovers || 0), 0);
  const totalTables = projects.reduce((sum, p) => sum + (p.tableCount || 0), 0);

  return (
    <div id="projects-dashboard" className="flex-1 h-full overflow-y-auto bg-slate-50/80 p-6 lg:p-10 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Stats Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <FlooverLogo size="lg" showWordmark={false} showBadge={false} className="mt-1" />
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <CloudCheck className="w-4 h-4 text-emerald-600" />
                Cloud Synchronized Workspace
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-0.5">
                Floor Plan Projects
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Manage multi-room layouts, seating arrangements, and live team plans with Floover.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-dashboard-refresh"
              onClick={onRefreshProjects}
              title="Sync with cloud"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>

            <button
              id="btn-dashboard-templates"
              onClick={onOpenTemplates}
              className="px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              Browse Templates
            </button>

            <button
              id="btn-dashboard-new-project"
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Floor Plan
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Projects</span>
              <FolderOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{projects.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Capacity (Covers)</span>
              <Armchair className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{totalCapacity} seats</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Tables</span>
              <Layers className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{totalTables} tables</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Cloud Status</span>
              <CloudCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Real-Time Synced
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-projects"
              type="text"
              placeholder="Search projects by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Venues' },
              { id: 'restaurant', label: 'Restaurants' },
              { id: 'banquet', label: 'Banquets' },
              { id: 'lounge', label: 'Lounges' },
              { id: 'cafe', label: 'Cafes' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setVenueFilter(v.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition ${
                  venueFilter === v.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Card Preview Banner */}
              <div
                onClick={() => onOpenProject(proj.id)}
                className="h-32 bg-radial from-slate-800 to-slate-950 p-4 flex flex-col justify-between relative cursor-pointer overflow-hidden"
              >
                {/* Visual grid watermark */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
                    {proj.venueType}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300">
                    {proj.roomWidth} × {proj.roomHeight} {proj.unit}
                  </span>
                </div>

                <div className="z-10">
                  <h3 className="text-white font-bold text-base truncate group-hover:text-indigo-300 transition">
                    {proj.name}
                  </h3>
                  <p className="text-slate-400 text-xs truncate mt-0.5">
                    {proj.description || 'Custom venue layout'}
                  </p>
                </div>
              </div>

              {/* Card Metrics */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">CAPACITY</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {proj.totalCovers} covers
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">TABLES</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {proj.tableCount} tables
                    </strong>
                  </div>
                </div>

                {/* Last modified & Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(proj.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-dup-${proj.id}`}
                      onClick={() => onDuplicateProject(proj.id)}
                      title="Duplicate project"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      id={`btn-del-${proj.id}`}
                      onClick={() => {
                        if (window.confirm(`Delete "${proj.name}"? This cannot be undone.`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      title="Delete project"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`btn-open-${proj.id}`}
                      onClick={() => onOpenProject(proj.id)}
                      className="ml-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1"
                    >
                      Open
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <FolderOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No projects found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a new floor plan from scratch or apply one of our pre-built room templates.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Create First Project
            </button>
          </div>
        )}
      </div>

      {/* New Project Modal (Start Blank or Template) */}
      <NewPlanModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onStartBlank={(name, venueType, width, height) => {
          onCreateProject(name, venueType, width, height);
          setShowNewModal(false);
        }}
        onOpenTemplates={() => {
          setShowNewModal(false);
          onOpenTemplates();
        }}
      />
    </div>
  );
};
