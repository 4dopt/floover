import React from 'react';
import {
  Sparkles,
  Lock,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Crown,
  Tag,
  ExternalLink
} from 'lucide-react';
import { PlanTierId, FeatureKey } from '../types/entitlements';
import { PLAN_TIERS, FEATURE_METADATA } from '../utils/entitlements';
import { FloordoneLogo } from './FloordoneLogo';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureKey: FeatureKey | null;
  currentPlan: PlanTierId;
  onUpgradeSuccess: (newPlan: PlanTierId) => void;
  onOpenFullPricing?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  featureKey,
  currentPlan,
  onUpgradeSuccess,
  onOpenFullPricing
}) => {
  if (!isOpen || !featureKey) return null;

  const feature = FEATURE_METADATA[featureKey] || {
    title: 'Professional Feature',
    minTier: 'planner',
    description: 'Unlock higher tier capabilities for your venue layouts.'
  };

  const requiredPlanId = feature.minTier;
  const targetPlan = PLAN_TIERS[requiredPlanId] || PLAN_TIERS.planner;

  const getTierIcon = (tier: PlanTierId) => {
    switch (tier) {
      case 'enterprise':
        return <Crown className="w-6 h-6 text-amber-500" />;
      case 'venue':
        return <Building2 className="w-6 h-6 text-emerald-500" />;
      case 'planner':
        return <Zap className="w-6 h-6 text-indigo-500" />;
      default:
        return <Tag className="w-6 h-6 text-slate-500" />;
    }
  };

  const handleSimulateUpgrade = () => {
    onUpgradeSuccess(requiredPlanId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  Feature Gate
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Current: <strong className="text-slate-800 uppercase">{currentPlan}</strong>
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                {feature.title}
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

        {/* Feature description */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-slate-700 text-sm leading-relaxed">
          <p className="font-medium text-slate-900 mb-1">{feature.description}</p>
          <p className="text-slate-500 text-xs">
            This capability is gated to the{' '}
            <strong className="text-indigo-600 font-bold">{targetPlan.name}</strong> tier and above.
          </p>
        </div>

        {/* Target Plan Card */}
        <div className="border-2 border-indigo-600/30 bg-indigo-50/40 rounded-2xl p-5 relative">
          <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
            Recommended Tier
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              {getTierIcon(targetPlan.id)}
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {targetPlan.name}
                </h3>
                <p className="text-xs text-slate-500">{targetPlan.tagline}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                ${targetPlan.monthlyPrice}
              </span>
              <span className="text-xs text-slate-500 font-medium"> / month</span>
            </div>
          </div>

          {/* Bullet points */}
          <ul className="space-y-1.5 mt-4 pt-3 border-t border-indigo-100 text-xs text-slate-700">
            {targetPlan.bulletPoints.slice(0, 4).map((bp, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{bp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleSimulateUpgrade}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-200 transition"
            >
              <Zap className="w-4 h-4 fill-white" />
              Activate {targetPlan.name}
            </button>

            {onOpenFullPricing ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenFullPricing();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-bold text-sm flex items-center justify-center gap-2 border border-slate-300 transition"
              >
                Compare All 4 Plans
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
              >
                Continue on {currentPlan}
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Instant Entitlement Unlock
            </span>
            <span>•</span>
            <span>Cancel Anytime</span>
            <span>•</span>
            <span>30-Day Money Back</span>
          </div>
        </div>
      </div>
    </div>
  );
};
