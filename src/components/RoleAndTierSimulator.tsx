import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Building2,
  Crown,
  Tag,
  UserCheck,
  MessageSquare,
  Eye,
  Settings,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles
} from 'lucide-react';
import { PlanTierId, CollaboratorRole } from '../types/entitlements';
import { PLAN_TIERS } from '../utils/entitlements';

interface RoleAndTierSimulatorProps {
  currentPlan: PlanTierId;
  onChangePlan: (plan: PlanTierId) => void;
  currentRole: CollaboratorRole;
  onChangeRole: (role: CollaboratorRole) => void;
  tempEditorOverride: boolean;
  onToggleTempEditorOverride: (enabled: boolean) => void;
  onOpenPaywall?: (featureKey: any) => void;
}

export const RoleAndTierSimulator: React.FC<RoleAndTierSimulatorProps> = ({
  currentPlan,
  onChangePlan,
  currentRole,
  onChangeRole,
  tempEditorOverride,
  onToggleTempEditorOverride
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const planDef = PLAN_TIERS[currentPlan];

  const getRoleBadge = (role: CollaboratorRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Admin / Owner',
          color: 'bg-indigo-600 text-white',
          desc: 'Full workspace & billing rights, master templates'
        };
      case 'editor':
        return {
          label: 'Editor (Paid Seat)',
          color: 'bg-emerald-600 text-white',
          desc: 'Full 2D floor manipulation & saving layouts'
        };
      case 'commenter':
        return {
          label: 'Live Client (Restricted)',
          color: 'bg-amber-600 text-white',
          desc: 'Multiplayer cursors, 3D walkthrough, pin comments (walls locked)'
        };
      case 'viewer':
        return {
          label: 'Viewer (Read-Only)',
          color: 'bg-slate-700 text-white',
          desc: 'Interactive 3D orbit & camera inspection only'
        };
    }
  };

  const currentRoleMeta = getRoleBadge(currentRole);

  return (
    <div
      id="role-tier-simulator-bar"
      className="bg-slate-900 text-white text-xs border-b border-slate-800 px-3 py-1.5 transition-all select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Quick status indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">
              Architecture Gate Simulator
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/80">
            <span className="text-slate-400">Plan:</span>
            <span className="font-extrabold text-indigo-400">{planDef.name}</span>
            <span className="text-slate-500 font-mono">(${planDef.monthlyPrice}/mo)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/80">
            <span className="text-slate-400">Role:</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${currentRoleMeta.color}`}>
              {currentRoleMeta.label}
            </span>
          </div>

          {currentRole === 'commenter' && tempEditorOverride && (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              Temporary Editor Rights Granted
            </span>
          )}
        </div>

        {/* Right: Toggle controls & Expand Button */}
        <div className="flex items-center gap-2">
          {/* Plan Selector Buttons */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {(['free', 'planner', 'venue', 'enterprise'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => onChangePlan(tier)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize transition ${
                  currentPlan === tier
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={`Switch active plan to ${PLAN_TIERS[tier].name}`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Role Selector Buttons */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {(['owner', 'editor', 'commenter', 'viewer'] as const).map((role) => (
              <button
                key={role}
                onClick={() => onChangeRole(role)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize transition ${
                  currentRole === role
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={`Simulate session as ${getRoleBadge(role).label}`}
              >
                {role === 'commenter' ? 'Client' : role}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            title="Toggle details"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded breakdown drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto pt-2.5 mt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <span className="font-bold text-indigo-300 block mb-1">Active Entitlements:</span>
            <ul className="space-y-0.5 text-slate-300">
              <li>• Max Active Projects: <strong className="text-white">{planDef.maxActiveProjects ?? 'Unlimited'}</strong></li>
              <li>• Included Editor Seats: <strong className="text-white">{planDef.includedEditorSeats}</strong> ($15/mo extra)</li>
              <li>• 3D Watermark: <strong className={currentPlan === 'free' ? 'text-amber-400' : 'text-emerald-400'}>{currentPlan === 'free' ? 'Enabled (Watermarked)' : 'Removed (Unbranded)'}</strong></li>
            </ul>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <span className="font-bold text-amber-300 block mb-1">Role Permissions:</span>
            <p className="text-slate-300 mb-1.5">{currentRoleMeta.desc}</p>
            {currentRole === 'commenter' && (
              <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 p-1.5 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  checked={tempEditorOverride}
                  onChange={(e) => onToggleTempEditorOverride(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="text-[10px] font-semibold text-slate-200">
                  Grant Client Temporary 2D Editor Rights
                </span>
              </label>
            )}
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
            <span className="font-bold text-emerald-300 block mb-1">Live Gating Test:</span>
            <p className="text-slate-300">
              Try clicking the 3D Lighting Toggles, Eye-Level Sightline, or Embed button to see custom paywall prompts for locked tiers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
