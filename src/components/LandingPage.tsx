import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Users2,
  FileSpreadsheet,
  CheckCircle2,
  Maximize2,
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Star,
  Clock,
  Play,
  RotateCcw,
  Zap,
  FolderOpen,
  Calendar,
  DollarSign,
  HelpCircle,
  Utensils,
  Tag,
  Crown,
  Lock
} from 'lucide-react';
import { FloordoneLogo } from './FloordoneLogo';
import { ROOM_TEMPLATES } from '../data/roomTemplates';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenEditor: (templateId?: string) => void;
  onOpenDashboard: () => void;
  onOpenTemplates: () => void;
  onOpenPricing?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenEditor,
  onOpenDashboard,
  onOpenTemplates,
  onOpenPricing
}) => {
  // Interactive Hero Preview state
  const [activeTableId, setActiveTableId] = useState<string>('t-01');
  const [heroTables, setHeroTables] = useState([
    { id: 't-01', name: 'Table 1', shape: 'round', covers: 4, status: 'reserved', guest: 'Dupont Party (4)', x: 60, y: 50 },
    { id: 't-02', name: 'Table 2', shape: 'round', covers: 4, status: 'available', guest: '', x: 190, y: 50 },
    { id: 't-03', name: 'Booth A', shape: 'booth', covers: 6, status: 'occupied', guest: 'Kaufman (6)', x: 60, y: 150 },
    { id: 't-04', name: 'VIP Chef', shape: 'rectangle', covers: 8, status: 'vip', guest: 'Mayor Dining (8)', x: 190, y: 150 },
  ]);

  // Interactive ROI Calculator state
  const [tableCountInput, setTableCountInput] = useState<number>(24);
  const [avgCoversInput, setAvgCoversInput] = useState<number>(4);
  const [checkSizeInput, setCheckSizeInput] = useState<number>(48);
  const [turnsInput, setTurnsInput] = useState<number>(2.2);

  // Computed ROI
  const totalCovers = tableCountInput * avgCoversInput;
  const nightlyRevenue = Math.round(totalCovers * turnsInput * checkSizeInput);
  const monthlyRevenue = Math.round(nightlyRevenue * 30);
  const extraFourCoversMonthly = Math.round(4 * turnsInput * checkSizeInput * 30);

  // Interactive Table Status Toggle
  const toggleTableStatus = (id: string) => {
    setHeroTables((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus: Record<string, 'available' | 'reserved' | 'occupied' | 'vip'> = {
          available: 'reserved',
          reserved: 'occupied',
          occupied: 'vip',
          vip: 'available'
        };
        const updatedStatus = nextStatus[t.status] || 'available';
        return {
          ...t,
          status: updatedStatus,
          guest: updatedStatus === 'available' ? '' : t.guest || 'Walk-in Guest'
        };
      })
    );
  };

  const selectedHeroTable = heroTables.find((t) => t.id === activeTableId) || heroTables[0];
  const heroTotalCovers = heroTables.reduce((acc, t) => acc + t.covers, 0);

  return (
    <div id="floordone-landing-page" className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. TOP ANNOUNCEMENT & BRAND HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <div
            className="cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <FloordoneLogo size="md" showWordmark={true} />
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">
              Features
            </a>
            <a href="#live-demo" className="hover:text-slate-900 transition">
              Interactive Canvas
            </a>
            <a href="#roi-calculator" className="hover:text-slate-900 transition">
              Cover Calculator
            </a>
            <a href="#templates" className="hover:text-slate-900 transition">
              Templates
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition flex items-center gap-1 text-emerald-600 font-bold">
              Pricing
              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                $1.19
              </span>
            </a>
            <a href="#testimonials" className="hover:text-slate-900 transition">
              Reviews
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenEditor()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Open Studio
            </button>
            <button
              id="btn-landing-get-started"
              onClick={onGetStarted}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-extrabold shadow-sm transition hover:shadow-md hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
        {/* Subtle grid pattern backdrop */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Floordone 2.0 • Precision Hospitality Seating & Floor Studio</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Design Profitable Floor Plans in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900">
                Minutes, Not Hours.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              The modern floor plan software built for restaurants, wedding venues, and event planners.
              Calculate dynamic covers, toggle corner seating, collaborate live with team members, and export production-ready PDF manifests.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                id="hero-cta-get-started"
                onClick={onGetStarted}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-base shadow-lg shadow-indigo-600/20 transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                Get Started Free
                <ArrowRight className="w-4.5 h-4.5" />
              </button>

              <button
                id="hero-cta-open-canvas"
                onClick={() => onOpenEditor()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-base border border-slate-200 shadow-sm transition hover:border-slate-300"
              >
                <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                Launch Live Canvas
              </button>
            </div>

            {/* Social Proof Pill */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-slate-700 font-bold">4.9 / 5</span>
                <span>(850+ hospitality venues)</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No CAD or training needed</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <Users2 className="w-4 h-4 text-indigo-600" />
                <span>Multiplayer real-time editing</span>
              </div>
            </div>
          </div>

          {/* 3. HERO INTERACTIVE FLOOR PLAN CANVAS PREVIEW */}
          <div id="live-demo" className="mt-14 relative max-w-5xl mx-auto">
            {/* Ambient Back Glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-70" />

            {/* Software Frame Container */}
            <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden">
              {/* Window Bar */}
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-slate-400 font-medium font-mono text-[11px] hidden sm:inline">
                    floordone://studio/le-bistro-main-dining
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Interactive Live Preview
                  </span>
                  <button
                    onClick={() => onOpenEditor()}
                    className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-indigo-300 hover:text-white transition"
                  >
                    Open Full Studio
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sub-toolbar */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Demo Canvas:</span>
                  <span className="text-slate-500">
                    Click any table to inspect or change reservation status:
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                    {heroTables.length} Tables • {heroTotalCovers} Covers Active
                  </span>
                  <button
                    onClick={() => onOpenEditor()}
                    className="px-3 py-1 rounded-md bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
                  >
                    Launch in Designer
                  </button>
                </div>
              </div>

              {/* Interactive Canvas Stage */}
              <div className="p-6 bg-slate-100/70 min-h-[340px] flex flex-col md:flex-row gap-6 items-center justify-between">
                {/* Visual Floor Area with Tables */}
                <div className="w-full md:w-2/3 h-72 bg-white rounded-xl border border-slate-200/90 shadow-inner relative p-4 overflow-hidden select-none">
                  {/* Grid background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />

                  {/* Architectural Entrance Marker */}
                  <div className="absolute top-2 left-6 px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    Main Entrance
                  </div>

                  {/* Interactive Table Nodes */}
                  <div className="relative w-full h-full">
                    {heroTables.map((t) => {
                      const isSelected = activeTableId === t.id;
                      const statusColor = {
                        available: 'border-emerald-500 bg-emerald-50/80 text-emerald-900',
                        reserved: 'border-amber-500 bg-amber-50/80 text-amber-900',
                        occupied: 'border-rose-500 bg-rose-50/80 text-rose-900',
                        vip: 'border-purple-600 bg-purple-50/80 text-purple-900'
                      }[t.status];

                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setActiveTableId(t.id);
                            toggleTableStatus(t.id);
                          }}
                          style={{
                            left: `${t.x}px`,
                            top: `${t.y}px`
                          }}
                          className={`absolute cursor-pointer transition-all duration-150 p-2 text-center rounded-xl border-2 shadow-sm hover:scale-105 ${statusColor} ${
                            isSelected ? 'ring-3 ring-indigo-500/40 shadow-md scale-105' : ''
                          }`}
                        >
                          <div className="text-[11px] font-black uppercase tracking-tight flex items-center justify-center gap-1">
                            {t.name}
                            <span className="text-[9px] px-1 rounded bg-white/70 font-mono">
                              {t.covers}c
                            </span>
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-80">
                            {t.status}
                          </div>
                          {t.guest && (
                            <div className="text-[9px] text-slate-600 truncate max-w-[80px] mt-0.5">
                              {t.guest}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Floating click hint */}
                  <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-semibold bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                    💡 Click tables to cycle status (Available ➔ Reserved ➔ Occupied ➔ VIP)
                  </div>
                </div>

                {/* Side Inspector Details for Selected Table */}
                <div className="w-full md:w-1/3 bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Selected Inspector
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        selectedHeroTable.status === 'vip'
                          ? 'bg-purple-100 text-purple-800'
                          : selectedHeroTable.status === 'occupied'
                          ? 'bg-rose-100 text-rose-800'
                          : selectedHeroTable.status === 'reserved'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedHeroTable.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-base text-slate-900">
                      {selectedHeroTable.name} ({selectedHeroTable.shape})
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Capacity: <strong className="text-slate-900">{selectedHeroTable.covers} covers</strong>
                    </p>
                    {selectedHeroTable.guest ? (
                      <p className="text-xs text-indigo-700 font-semibold mt-1">
                        Assigned: {selectedHeroTable.guest}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">No guest assigned yet</p>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => toggleTableStatus(selectedHeroTable.id)}
                      className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                      Toggle Reservation Status
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onOpenEditor()}
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      Open in Full Designer
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LOGO MARQUEE / INDUSTRY CLIENT PROOF */}
      <section className="py-12 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-6">
            Empowering floor plans for leading restaurants, event spaces & hotel banquets
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all">
            <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-800">
              Le Petit Bistro Paris
            </span>
            <span className="font-sans text-base sm:text-lg font-black tracking-widest uppercase text-slate-700">
              THE GRAND BALLROOM
            </span>
            <span className="font-serif italic text-lg sm:text-xl font-medium text-slate-800">
              Atelier Lumière
            </span>
            <span className="font-sans text-base sm:text-lg font-extrabold tracking-wider text-slate-800">
              SOHO SOCIAL CLUB
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-slate-700">
              BELLAGIO SUITES
            </span>
            <span className="font-sans text-base sm:text-lg font-bold tracking-tight text-slate-800">
              Horizon Event Group
            </span>
          </div>
        </div>
      </section>

      {/* 5. BENTO GRID FEATURES SHOWCASE */}
      <section id="features" className="py-20 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Comprehensive Seating Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered specifically for hospitality & event workflows.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Say goodbye to clunky CAD tools, paper scratchpads, and static spreadsheets. Floordone gives you precision layouts with zero learning curve.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Corner Chair & Seating Engine */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Utensils className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Corner & Head Chair Precision
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Click directly on any chair around rectangular, square, or round tables to remove corner seats or head ends. Effective covers recalculate automatically in real time.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-indigo-600">
                <span>1-click corner & end toggles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2: Live Reservation Color Coding */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                VIP, Reserved & Occupied Status
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Assign guest party names, dietary notes, and real-time status badges. Floor captains and hosts can visually scan the floor in a fraction of a second.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-600">
                <span>Color-coded table indicators</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3: Real-Time Team Collaboration */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Simultaneous Team Multiplayer
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Work alongside your banquet manager, head host, and event planners with live multiplayer cursors, instant sync, and active presence tracking.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-purple-600">
                <span>WebSocket sync engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4: Production PDF Manifests */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Production-Ready PDF Manifests
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate high-resolution vector PDF floor plans coupled with complete table-by-table seating manifests, guest name rosters, and capacity breakdowns for your staff.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-600">
                <span>One-click printable handoffs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 5: Pre-Engineered Venue Templates */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Instant Turnkey Room Templates
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Start immediately with pre-built room layouts for French Bistros, Imperial Wedding Banquets, Skyline Rooftops, Artisan Cafes, and Corporate Galas.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-rose-600">
                <span>6+ venue archetypes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 6: Multi-Project Cloud Sync */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Multi-Room Project Hub
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Manage separate dining rooms, patio layouts, mezzanine bars, and seasonal setups in one unified project workspace with instant duplication.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-600">
                <span>Centralized project dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE REVENUE & COVER ROI CALCULATOR */}
      <section id="roi-calculator" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left explanation */}
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Revenue & Seating Calculator
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                How much revenue is hidden in your floor plan?
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                In hospitality, floor plan optimization directly impacts your bottom line. Just by arranging banquettes smarter, removing tight corners, or adding a 4-top, venues gain thousands in extra revenue every month.
              </p>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  The Floordone Optimization Impact:
                </div>
                <p className="text-xs text-emerald-900 font-medium">
                  Optimizing just 4 extra seats in your dining room generates an estimated{' '}
                  <strong className="font-extrabold text-emerald-950">
                    +${extraFourCoversMonthly.toLocaleString()} / month
                  </strong>{' '}
                  in unlocked revenue at your current check size and turns!
                </p>
              </div>

              <div>
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold shadow-sm transition"
                >
                  Start Optimizing With Floordone
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Interactive Sliders Widget */}
            <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    Interactive Venue Capacity Modeler
                  </h4>
                  <p className="text-xs text-slate-500">Adjust the sliders to match your venue</p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700">
                  Live Calculator
                </span>
              </div>

              {/* Sliders */}
              <div className="space-y-5">
                {/* 1. Table Count */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Number of Tables:</span>
                    <span className="text-indigo-600 font-mono text-sm">{tableCountInput} tables</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="80"
                    step="1"
                    value={tableCountInput}
                    onChange={(e) => setTableCountInput(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>

                {/* 2. Avg Covers */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Average Seats per Table:</span>
                    <span className="text-indigo-600 font-mono text-sm">{avgCoversInput} seats</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={avgCoversInput}
                    onChange={(e) => setAvgCoversInput(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>

                {/* 3. Check Size */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Average Check / Spend per Guest:</span>
                    <span className="text-emerald-600 font-mono text-sm">${checkSizeInput}</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="5"
                    value={checkSizeInput}
                    onChange={(e) => setCheckSizeInput(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>

                {/* 4. Table Turns */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Daily Table Turns:</span>
                    <span className="text-purple-600 font-mono text-sm">{turnsInput}x turns</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={turnsInput}
                    onChange={(e) => setTurnsInput(Number(e.target.value))}
                    className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Calculated Outputs Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total Covers
                  </span>
                  <p className="text-xl font-black text-slate-900 mt-1">{totalCovers}</p>
                  <span className="text-[10px] text-slate-500">seated capacity</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Est. Nightly Gross
                  </span>
                  <p className="text-xl font-black text-indigo-600 mt-1">
                    ${nightlyRevenue.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-500">per dinner service</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-emerald-300 bg-emerald-50/40 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Monthly Potential
                  </span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    ${monthlyRevenue.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">30-day run rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRE-CONFIGURED TEMPLATES GALLERY */}
      <section id="templates" className="py-20 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Ready-To-Use Schematics
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Explore Turnkey Venue Archetypes
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Every layout is pre-built with certified clearances, tables, and fixtures.
              </p>
            </div>
            <button
              onClick={() => onOpenTemplates()}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Browse All Templates
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROOM_TEMPLATES.slice(0, 3).map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
              >
                <div
                  className="h-32 relative flex items-center justify-center p-4"
                  style={{ backgroundColor: tmpl.thumbnailColor + '15' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm"
                    style={{ backgroundColor: tmpl.thumbnailColor }}
                  >
                    {tmpl.name[0]}
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/90 text-slate-800 shadow-2xs">
                    {tmpl.venueType}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <span className="font-semibold">
                      {tmpl.tableCount} Tables • {tmpl.capacity} Seats
                    </span>
                    <button
                      onClick={() => onOpenEditor(tmpl.id)}
                      className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Use Template
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      <section id="testimonials" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              User Testimonials
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Loved by hospitality managers & event directors.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "Floordone changed how we manage Friday night service. Being able to toggle corner seats and export crisp PDF manifests for the host stand takes minutes instead of hours on paper."
              </p>
              <div>
                <p className="font-bold text-sm text-slate-900">Marcus Sterling</p>
                <p className="text-xs text-slate-500">General Manager, The Oak & Barrel NYC</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "Wedding couples love seeing exact seating schematics with their bridal head tables and dance floors clearly mapped. Floordone helps us close event contracts so much faster."
              </p>
              <div>
                <p className="font-bold text-sm text-slate-900">Elena Rostova</p>
                <p className="text-xs text-slate-500">Director of Events, Imperial Ballroom</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic leading-relaxed">
                "The live multiplayer collaboration is seamless. My host team on iPads and our banquet captains at the desktop are always in sync when table numbers shuffle during large buyouts."
              </p>
              <div>
                <p className="font-bold text-sm text-slate-900">Julian Moreau</p>
                <p className="text-xs text-slate-500">Operations Partner, Atelier Dining Group</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8b. PRICING SECTION */}
      <section id="pricing" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-2xs">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pocket-Friendly Micro Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Hospitality Grade Software at Everyday Prices
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              No contracts. No per-seat extortion. Plans start at less than a single morning coffee, or grab the one-time Lifetime deal and never pay a subscription again.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Free */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">Starter Free</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">Free</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">$0</span>
                  <span className="text-xs text-slate-500 font-semibold">/ forever</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Best for quick table sketches and occasional dining arrangements.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ 1 Active floor plan</li>
                  <li className="flex items-center gap-2">✓ Up to 30 tables & chairs</li>
                  <li className="flex items-center gap-2">✓ Corner chair removal</li>
                  <li className="flex items-center gap-2">✓ Standard SVG/PNG exports</li>
                </ul>
              </div>
              <button
                onClick={onGetStarted}
                className="mt-6 w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition"
              >
                Start Free
              </button>
            </div>

            {/* Solo Host */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-300 shadow-sm flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                  ⚡ CHEAPEST PRO
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">Solo Host</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Recommended</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-700">$1.19</span>
                  <span className="text-xs text-slate-500 font-semibold">/ mo (billed yearly)</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ideal for single restaurants, cafes, pop-ups, and private dining rooms.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ <strong>Unlimited</strong> floor plans</li>
                  <li className="flex items-center gap-2">✓ All walls, doors & decks</li>
                  <li className="flex items-center gap-2">✓ Botanical plants & decor</li>
                  <li className="flex items-center gap-2">✓ High-res vector PDF export</li>
                  <li className="flex items-center gap-2">✓ Guest seating manifest</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  if (onOpenPricing) onOpenPricing();
                  else onGetStarted();
                }}
                className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                Upgrade to Solo ($1.19)
              </button>
            </div>

            {/* Pro Studio */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-600 shadow-lg flex flex-col justify-between relative md:-translate-y-1">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                  🔥 MOST POPULAR
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">Pro Studio</h3>
                  <Crown className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-indigo-600">$2.49</span>
                  <span className="text-xs text-slate-500 font-semibold">/ mo (billed yearly)</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  For thriving venues, wedding coordinators, and hospitality teams.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ <strong>Everything in Solo</strong></li>
                  <li className="flex items-center gap-2">✓ Live team multiplayer cursors</li>
                  <li className="flex items-center gap-2">✓ Custom venue logo on PDFs</li>
                  <li className="flex items-center gap-2">✓ Table status reservations sync</li>
                  <li className="flex items-center gap-2">✓ Unlimited revisions & history</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  if (onOpenPricing) onOpenPricing();
                  else onGetStarted();
                }}
                className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition shadow-md"
              >
                Upgrade to Pro ($2.49)
              </button>
            </div>

            {/* Lifetime */}
            <div className="bg-gradient-to-b from-amber-50/60 to-white rounded-2xl p-6 border border-amber-300 shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs">
                  ⭐ LIFETIME DEAL
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">Lifetime Pass</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">One-Time</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">$9.99</span>
                  <span className="text-xs text-slate-500 font-semibold">one-time payment</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pay once, use forever. No recurring monthly or annual billing.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">✓ All Pro features unlocked</li>
                  <li className="flex items-center gap-2">✓ Lifetime free updates</li>
                  <li className="flex items-center gap-2">✓ No recurring charges ever</li>
                  <li className="flex items-center gap-2">✓ VIP Founder badge</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  if (onOpenPricing) onOpenPricing();
                  else onGetStarted();
                }}
                className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shadow-md"
              >
                Get Lifetime Pass ($9.99)
              </button>
            </div>
          </div>

          {/* Dedicated full page link */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                if (onOpenPricing) onOpenPricing();
                else onGetStarted();
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-2xs hover:shadow-xs transition"
            >
              <span>See Full Plan Comparison & FAQ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION */}
      <section className="py-16 bg-slate-50/50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Everything you need to know about Floordone
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Can I remove chairs on corners or short ends of tables?',
                a: 'Yes! Floordone includes a custom seating engine. You can click directly on any chair around a selected table to remove it, or use the one-click Corners and Ends toggles in the table toolbar.'
              },
              {
                q: 'Can I export clean PDFs for my floor staff and kitchen?',
                a: 'Yes. The 1-click Export generates vector PDFs with an architectural overview, total covers count, and an optional 2-page detailed seating schedule with guest names and table statuses.'
              },
              {
                q: 'Does it support real-time team collaboration?',
                a: 'Floordone features full live multiplayer sync. When your colleagues or event planners open the same floor plan, you see their live cursor presence and real-time element movements.'
              },
              {
                q: 'Is there any software installation needed?',
                a: 'None! Floordone runs entirely in modern web browsers on desktop, laptop, and iPad touch screens with full offline capability and local persistence.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA BANNER */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            Join 850+ Hospitality Venues Worldwide
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to design your venue floor plan?
          </h2>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Answer a few quick questions to personalize your workspace and start placing tables immediately.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-extrabold shadow-lg shadow-indigo-600/30 transition hover:scale-105"
            >
              Start Free Onboarding
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenEditor()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-base font-bold transition"
            >
              Direct Canvas Access
            </button>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="py-8 bg-slate-950 text-slate-500 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FloordoneLogo size="sm" showBadge={false} />
            <span>© {new Date().getFullYear()} Floordone Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="hover:text-slate-300 transition"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={(e) => {
                if (onOpenPricing) {
                  e.preventDefault();
                  onOpenPricing();
                }
              }}
              className="hover:text-emerald-400 text-emerald-500 font-bold transition flex items-center gap-1"
            >
              Pricing ($1.19/mo)
            </a>
            <a
              href="#roi-calculator"
              className="hover:text-slate-300 transition"
            >
              ROI Modeler
            </a>
            <button
              onClick={() => onOpenDashboard()}
              className="hover:text-slate-300 transition"
            >
              Project Dashboard
            </button>
            <button
              onClick={() => onOpenEditor()}
              className="hover:text-slate-300 transition font-bold text-indigo-400"
            >
              Open Floor Designer →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
