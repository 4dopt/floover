import React, { useState, useEffect } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Tag,
  Coffee,
  HeartHandshake,
  Award,
  Crown,
  CheckCircle2,
  Lock,
  ChevronRight,
  Flame,
  KeyRound,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { FloordoneLogo } from './FloordoneLogo';
import { ActivateAccessModal } from './ActivateAccessModal';
import {
  LEMON_SQUEEZY_CHECKOUT_URL,
  openLemonSqueezyCheckout,
  setupLemonSqueezyEvents,
  activatePaidPlanLocally
} from '../utils/lemonSqueezy';

export type PlanId = 'free' | 'planner' | 'venue' | 'enterprise' | 'solo' | 'pro' | 'lifetime';

export interface PlanConfig {
  id: PlanId;
  name: string;
  tagline: string;
  badge?: string;
  badgeColor?: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  oneTimePrice?: number;
  includedSeats?: number;
  extraSeatPrice?: number;
  highlighted?: boolean;
  features: string[];
  omittedFeatures?: string[];
  ctaText: string;
  accentColor: string;
  icon: React.ReactNode;
}

const PRICING_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Essential 2D floor planning for individuals and one-off venue sketches.',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    includedSeats: 0,
    features: [
      '1 active floor plan project',
      'Basic 2D CAD drafting & element placement',
      'Real-time 3D orbit preview with watermark',
      'Standard PNG / SVG canvas exports',
      'Public view-only sharing links',
      'Local in-browser auto-save'
    ],
    omittedFeatures: [
      'Unlimited active floor plans',
      'Multiplayer live editing with clients (real-time cursors)',
      'Full unbranded 3D orbit & first-person walkthrough',
      'Dynamic seating capacity & table spacing calculators',
      'Venue master templates & 3D embed code'
    ],
    ctaText: 'Use Free Forever',
    accentColor: 'slate',
    icon: <Tag className="w-5 h-5 text-slate-600" />
  },
  {
    id: 'planner',
    name: 'Planner / Pro',
    tagline: 'High-speed professional planning for event coordinators and designers.',
    badge: '⚡ MOST POPULAR',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    monthlyPrice: 29,
    annualMonthlyPrice: 24, // ~$288/year
    includedSeats: 1,
    highlighted: true,
    features: [
      'Unlimited active floor plan projects',
      '1 included team editor seat',
      'Live multiplayer editing with clients (real-time cursors)',
      'Full unbranded 3D orbit & first-person walkthrough',
      'Dynamic seating capacity & table spacing calculators',
      'High-resolution vector PDF exports with seating manifests',
      'Table assignment tracking & guest notes'
    ],
    omittedFeatures: [
      'Reusable venue master templates',
      'Guest eye-level sightline tool in 3D',
      'Daylight vs. Evening Banquet lighting toggles',
      'Embeddable 3D iframe for venue websites'
    ],
    ctaText: 'Upgrade to Planner ($29/mo)',
    accentColor: 'indigo',
    icon: <Crown className="w-5 h-5 text-indigo-600" />
  },
  {
    id: 'venue',
    name: 'Venue / Studio',
    tagline: 'Turnkey sales & operations platform for wedding halls, hotels, and venues.',
    badge: '🏆 VENUE CHOICE',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    monthlyPrice: 79,
    annualMonthlyPrice: 65, // ~$780/year
    includedSeats: 3,
    extraSeatPrice: 15,
    features: [
      'Everything in Planner / Pro, PLUS:',
      '3 included editor seats (extra seats at $15/mo)',
      'Reusable venue master templates (lock structural walls)',
      'Multi-room & multi-floor event layout support',
      'Guest eye-level sightline tool in 3D (test views to stage)',
      'Lighting environment toggles (Daylight vs. Evening Banquet)',
      'Embeddable 3D interactive iframe for your website'
    ],
    omittedFeatures: [
      'Custom 3D inventory & proprietary asset uploading',
      'Client portal white-label branding'
    ],
    ctaText: 'Upgrade to Venue ($79/mo)',
    accentColor: 'emerald',
    icon: <Coffee className="w-5 h-5 text-emerald-600" />
  },
  {
    id: 'enterprise',
    name: 'Business / Enterprise',
    tagline: 'Turnkey multi-venue hospitality groups, custom 3D inventory, and client white-labeling.',
    badge: '👑 ENTERPRISE',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    monthlyPrice: 199,
    annualMonthlyPrice: 169, // ~$2,028/year
    includedSeats: 10,
    extraSeatPrice: 15,
    features: [
      'Everything in Venue / Studio, PLUS:',
      '10 included editor seats (extra seats at $15/mo)',
      'Custom 3D inventory & asset catalog uploading',
      'Client portal branding (custom domain & white-label logo)',
      'Granular team permissions & enterprise audit logs',
      'Priority hardware-accelerated cloud rendering & SLA',
      'Dedicated account manager & staff onboarding'
    ],
    ctaText: 'Contact Sales ($199/mo)',
    accentColor: 'amber',
    icon: <Flame className="w-5 h-5 text-amber-600" />
  }
];

interface PricingPageProps {
  onBackToEditor: () => void;
  onOpenTemplates: () => void;
  onOpenDashboard: () => void;
  currentPlan?: PlanId;
  onSelectPlan?: (planId: PlanId) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBackToEditor,
  onOpenTemplates,
  onOpenDashboard,
  currentPlan: initialCurrentPlan,
  onSelectPlan
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [activePlan, setActivePlan] = useState<PlanId>(() => {
    if (initialCurrentPlan) return initialCurrentPlan;
    const stored = (localStorage.getItem('floordone_user_plan') || localStorage.getItem('floover_user_plan')) as PlanId;
    return stored || 'free';
  });

  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialCurrentPlan) {
      setActivePlan(initialCurrentPlan);
    }
  }, [initialCurrentPlan]);

  // Listen for Lemon Squeezy overlay checkout success
  useEffect(() => {
    const cleanup = setupLemonSqueezyEvents((data) => {
      const orderId = data?.order?.id || data?.data?.id || `ls-order-${Date.now()}`;
      activatePaidPlanLocally('pro', String(orderId));
      setActivePlan('pro');
      if (onSelectPlan) {
        onSelectPlan('pro');
      }
      setShowSuccessToast('🎉 Payment Confirmed! Pro features unlocked immediately.');
      setTimeout(() => setShowSuccessToast(null), 5000);
    });
    return cleanup;
  }, [onSelectPlan]);

  const handleChoosePlan = (plan: PlanConfig) => {
    if (plan.id === activePlan) {
      setShowSuccessToast(`You are currently on the ${plan.name} plan.`);
      setTimeout(() => setShowSuccessToast(null), 3500);
      return;
    }

    setActivePlan(plan.id);
    localStorage.setItem('floordone_plan_tier', plan.id);
    localStorage.setItem('floordone_user_plan', plan.id);
    window.dispatchEvent(new CustomEvent('floordone:tier-changed', { detail: { tier: plan.id } }));
    if (onSelectPlan) {
      onSelectPlan(plan.id);
    }
    setShowSuccessToast(`Plan switched to ${plan.name}! Features unlocked.`);
    setTimeout(() => setShowSuccessToast(null), 3500);
  };

  return (
    <div id="pricing-page-container" className="min-h-full bg-slate-50 text-slate-900 font-sans pb-24">
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToEditor}>
            <FloordoneLogo size="sm" showWordmark={true} />
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Honest Micro-Pricing
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsActivateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-bold transition shadow-2xs"
              title="Already bought via Lemon Squeezy? Activate on this device"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Already Paid? Activate</span>
            </button>
            <button
              onClick={onOpenTemplates}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition hidden sm:inline-flex"
            >
              Templates
            </button>
            <button
              onClick={onOpenDashboard}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition hidden sm:inline-flex"
            >
              My Projects
            </button>
            <button
              onClick={onBackToEditor}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition"
            >
              Open Floor Designer
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{showSuccessToast}</p>
        </div>
      )}

      {/* 3. Hero Introduction */}
      <section className="pt-12 pb-10 sm:pt-16 sm:pb-14 px-4 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>No $100/mo Corporate Bloat • Transparent Pocket-Friendly Pricing</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Professional Floor Plans for Less Than the Price of a{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-800">
            Single Espresso.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Why do legacy floor plan tools charge $80 to $150 a month? We built Floordone with modern, ultra-efficient tech so we can offer full-featured seating design starting at just <strong>$1.19/mo</strong>, or <strong>$9.99 once</strong> for life.
        </p>

        {/* Billing Interval Switcher */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <div className="inline-flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/80 shadow-inner">
            <button
              id="billing-toggle-annual"
              onClick={() => setBillingCycle('annual')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Billing
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                Save 40%
              </span>
            </button>

            <button
              id="billing-toggle-monthly"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
          </div>
        </div>
      </section>

      {/* 3b. Quick Activation Banner for Paid Customers */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">Already completed checkout on Lemon Squeezy?</p>
              <p className="text-[11px] text-slate-600">
                Unlock instant access across any computer: Enter your Lemon Squeezy Order # or purchase email to activate Pro.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsActivateModalOpen(true)}
            className="w-full sm:w-auto whitespace-nowrap px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
          >
            Activate Order Access
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Pricing Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = activePlan === plan.id;
            const isLifetime = plan.id === 'lifetime';
            const displayPrice = isLifetime
              ? plan.oneTimePrice
              : billingCycle === 'annual'
              ? plan.annualMonthlyPrice
              : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl bg-white p-6 transition-all duration-200 border ${
                  plan.highlighted
                    ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/20 md:-translate-y-1'
                    : isLifetime
                    ? 'border-amber-300 shadow-lg bg-gradient-to-b from-amber-50/40 to-white'
                    : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Optional Top Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-2xs ${
                        plan.badgeColor || 'bg-slate-900 text-white'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                        {plan.icon}
                      </div>
                      <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                    </div>

                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 min-h-[36px] leading-relaxed mb-4">
                    {plan.tagline}
                  </p>

                  {/* Price Tag */}
                  <div className="py-3 border-y border-slate-100 flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      ${displayPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {isLifetime
                        ? 'one-time forever'
                        : plan.monthlyPrice === 0
                        ? '/ forever'
                        : billingCycle === 'annual'
                        ? '/ mo (billed $14.28/yr)'
                        : '/ month'}
                    </span>
                  </div>

                  {/* Feature list */}
                  <div className="pt-4 space-y-2.5 text-xs">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Included Features:
                    </p>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}

                    {/* Excluded features (if any) */}
                    {plan.omittedFeatures && plan.omittedFeatures.length > 0 && (
                      <div className="pt-2 space-y-2 text-slate-400">
                        {plan.omittedFeatures.map((omit, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">
                              ✕
                            </span>
                            <span className="leading-snug line-through opacity-75">{omit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="pt-6 mt-6 border-t border-slate-100">
                  {plan.id === 'free' ? (
                    <button
                      id={`btn-select-plan-${plan.id}`}
                      onClick={() => handleChoosePlan(plan)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Active Plan
                        </>
                      ) : (
                        <>
                          {plan.ctaText}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <a
                      id={`btn-select-plan-${plan.id}`}
                      href={LEMON_SQUEEZY_CHECKOUT_URL}
                      onClick={(e) => {
                        e.preventDefault();
                        openLemonSqueezyCheckout(LEMON_SQUEEZY_CHECKOUT_URL);
                      }}
                      className={`lemonsqueezy-button w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-default'
                          : plan.highlighted
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                          : isLifetime
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md hover:shadow-lg'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Active Plan
                        </>
                      ) : (
                        <>
                          Buy Pricing plans
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </a>
                  )}

                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    {isLifetime
                      ? 'No recurring charge • Instant activation'
                      : plan.monthlyPrice === 0
                      ? 'No credit card required'
                      : 'Checkout securely via Lemon Squeezy'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Competitor Price Comparison Table */}
      <section className="max-w-4xl mx-auto px-4 mt-16 sm:mt-24">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Why We Are 95% Cheaper
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Floordone vs. Traditional Floor Plan Software
            </h2>
            <p className="text-xs text-slate-500">
              Legacy enterprise tools charge bloated fees for features small and medium hospitality businesses never use.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Feature</th>
                  <th className="py-3 px-3 text-emerald-700 font-black">Floordone (Solo/Pro)</th>
                  <th className="py-3 px-3">Legacy CAD Tools</th>
                  <th className="py-3 px-3">Enterprise Seating SaaS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3.5 px-3 font-semibold">Monthly Cost</td>
                  <td className="py-3.5 px-3 text-emerald-600 font-black text-sm">$1.19 – $3.99 / mo</td>
                  <td className="py-3.5 px-3 text-rose-500 font-semibold">$65.00 / mo</td>
                  <td className="py-3.5 px-3 text-rose-500 font-semibold">$120.00 / mo</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold">Lifetime Option</td>
                  <td className="py-3.5 px-3 text-emerald-600 font-bold">Yes ($9.99 once)</td>
                  <td className="py-3.5 px-3 text-slate-400">No (Subscription only)</td>
                  <td className="py-3.5 px-3 text-slate-400">No (Subscription only)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold">Corner Chair Toggling</td>
                  <td className="py-3.5 px-3 text-emerald-600 font-bold">1-Click Visual Toggle</td>
                  <td className="py-3.5 px-3 text-slate-400">Manual CAD Drafting</td>
                  <td className="py-3.5 px-3 text-slate-400">Fixed Templates Only</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold">Real-Time Team Sync</td>
                  <td className="py-3.5 px-3 text-emerald-600 font-bold">Included in Pro</td>
                  <td className="py-3.5 px-3 text-slate-400">Desktop files via email</td>
                  <td className="py-3.5 px-3 text-slate-400">Extra $25/user/mo</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold">PDF Seating Manifests</td>
                  <td className="py-3.5 px-3 text-emerald-600 font-bold">Included (Vector HD)</td>
                  <td className="py-3.5 px-3 text-slate-400">Separate plugin needed</td>
                  <td className="py-3.5 px-3 text-slate-400">Watermarked on entry tier</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-3 font-semibold">Contract Lock-in</td>
                  <td className="py-3.5 px-3 text-emerald-600 font-bold">None (Cancel in 1-click)</td>
                  <td className="py-3.5 px-3 text-slate-400">12-month minimum</td>
                  <td className="py-3.5 px-3 text-slate-400">Annual commitment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Pricing FAQ */}
      <section className="max-w-3xl mx-auto px-4 mt-16 space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-black text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Everything you need to know about our super cheap rates.</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Why are Floordone prices so ridiculously cheap?',
              a: 'Floordone was designed from the ground up to run directly in your browser with SVG and WebSockets. We do not have high cloud compute rendering overhead, and we don’t pay enterprise sales teams. We pass every cent of efficiency back to independent restaurateurs, wedding coordinators, and hospitality heroes.'
            },
            {
              q: 'How does the Lifetime Founder pass work?',
              a: 'You pay $9.99 once, and your account receives all current and future Pro features with no recurring charges ever. It is ideal for independent consultants or venue owners who hate recurring monthly fees.'
            },
            {
              q: 'Can I cancel my subscription at any time?',
              a: 'Yes, with zero friction. You can switch back to the Free Starter plan whenever you like. Your existing floor plans remain stored and safe in your account.'
            },
            {
              q: 'Are there any limits on the number of tables or chairs I can draw?',
              a: 'On all paid plans (Solo, Pro, Lifetime), there are zero limits on tables, chairs, walls, doors, or covers. Design massive 500-seat banquets or cozy 10-table bistros freely.'
            },
            {
              q: 'Do you offer a money-back guarantee?',
              a: 'Yes, 100% money-back guarantee within 30 days. If Floordone isn’t the fastest floor plan designer you’ve used, just send us an email for a prompt refund.'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {item.q}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-5">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6b. How Access Works After Payment Guide */}
      <section className="max-w-4xl mx-auto px-4 mt-16">
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                How You Get Access When You Pay
              </h3>
              <p className="text-xs text-slate-500">
                We support 4 seamless ways to unlock your plan with zero waiting
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>1. Instant In-App Overlay</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When you click <strong>Buy Pricing plans</strong>, the checkout opens right here. Lemon Squeezy signals payment completion to the app in real time, upgrading your active browser session on the spot.
              </p>
            </div>

            {/* Method 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <KeyRound className="w-4 h-4" />
                <span>2. Order # / Email Activation</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lemon Squeezy emails you a receipt with an <strong>Order Number</strong>. Click <strong>Already Paid? Activate</strong> anytime to unlock Pro on your work laptop, tablet, or phone.
              </p>
            </div>

            {/* Method 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                <ExternalLink className="w-4 h-4" />
                <span>3. One-Click Redirect URL</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Returning to Floordone from Lemon Squeezy's thank-you page automatically activates your Pro plan with your order token.
              </p>
            </div>

            {/* Method 4 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <RefreshCw className="w-4 h-4" />
                <span>4. Permanent Server Sync</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transactions sync through our backend webhook endpoint (<code className="text-[11px] bg-slate-200 px-1 py-0.5 rounded text-slate-800">/api/webhook/lemonsqueezy</code>) so your access is always recorded.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Need to unlock your purchase right now?
            </span>
            <button
              onClick={() => setIsActivateModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Open Order Activation Dialog
            </button>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 mt-16 text-center">
        <div className="p-8 sm:p-10 rounded-2xl bg-slate-900 text-white space-y-4 shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-black">
            Ready to design your venue with complete precision?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Try the Free Starter plan right now, or jump straight into Solo for just $1.19/month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onBackToEditor}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md"
            >
              Launch Floor Designer
            </button>
            <button
              onClick={onOpenTemplates}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
            >
              Explore Ready-Made Templates
            </button>
          </div>
        </div>
      </section>

      {/* 8. Activate Access Modal */}
      <ActivateAccessModal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        onSuccess={(activatedPlan) => {
          setActivePlan(activatedPlan);
          if (onSelectPlan) {
            onSelectPlan(activatedPlan);
          }
          setShowSuccessToast(`🎉 ${activatedPlan.toUpperCase()} access verified and active!`);
          setTimeout(() => setShowSuccessToast(null), 4000);
        }}
      />
    </div>
  );
};
