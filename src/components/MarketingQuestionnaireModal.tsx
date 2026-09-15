import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Wine,
  HeartHandshake,
  Building2,
  Tent,
  UserCheck,
  TrendingUp,
  Clock,
  Crown,
  FileSpreadsheet,
  Users2,
  Search,
  Instagram,
  MessageSquare,
  Share2,
  Rocket
} from 'lucide-react';
import { FlooverLogo } from './FlooverLogo';
import { MarketingQuestionnaireData } from '../types';

interface MarketingQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (recommendedTemplateId?: string) => void;
}

export const MarketingQuestionnaireModal: React.FC<MarketingQuestionnaireModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Questionnaire responses state
  const [venueType, setVenueType] = useState<string>('restaurant');
  const [role, setRole] = useState<string>('owner');
  const [primaryChallenge, setPrimaryChallenge] = useState<string>('maximize_covers');
  const [capacityRange, setCapacityRange] = useState<string>('50_150');
  const [referralSource, setReferralSource] = useState<string>('google');
  const [businessName, setBusinessName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Map venue type to recommended template
  const getRecommendedTemplateId = (type: string) => {
    switch (type) {
      case 'wedding_banquet':
        return 'tmpl-wedding';
      case 'cafe_bakery':
        return 'tmpl-cafe';
      case 'bar_lounge':
        return 'tmpl-rooftop';
      case 'hotel_conference':
        return 'tmpl-gala';
      case 'fine_dining':
        return 'tmpl-fine-dining';
      case 'restaurant':
      default:
        return 'tmpl-bistro';
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);

    const leadData: MarketingQuestionnaireData = {
      venueType,
      role,
      primaryChallenge,
      capacityRange,
      referralSource,
      businessName: businessName.trim() || undefined,
      email: email.trim() || undefined,
      submittedAt: new Date().toISOString()
    };

    try {
      // Save locally
      localStorage.setItem('floover_marketing_lead', JSON.stringify(leadData));
      localStorage.setItem('floover_onboarding_completed', 'true');

      // Send to server
      await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
    } catch (e) {
      console.warn('Could not post lead to server, saved locally', e);
    } finally {
      setIsSubmitting(false);
      const recommendedId = getRecommendedTemplateId(venueType);
      onComplete(recommendedId);
    }
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkipToDesigner = () => {
    localStorage.setItem('floover_onboarding_completed', 'true');
    const recommendedId = getRecommendedTemplateId(venueType);
    onComplete(recommendedId);
  };

  return (
    <div
      id="modal-marketing-questionnaire"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <FlooverLogo size="sm" showBadge={false} />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Personalized Onboarding
              </span>
              <p className="text-xs text-slate-500">
                {step <= totalSteps ? `Question ${step} of ${totalSteps}` : 'Ready to Launch'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkipToDesigner}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded transition hover:bg-slate-100"
            >
              Skip to Designer
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Tracker Line */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-indigo-600 h-1 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, (step / totalSteps) * 100)}%` }}
          />
        </div>

        {/* Step Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: VENUE TYPE */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 mb-2">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Tailored Layout Engine
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  What type of venue or floor plan are you designing?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  We'll pre-configure your canvas with optimal table clearances and seating shapes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {[
                  {
                    id: 'restaurant',
                    title: 'Restaurant & Bistro',
                    desc: '2-tops, 4-tops, booths & bar seating',
                    icon: UtensilsCrossed
                  },
                  {
                    id: 'fine_dining',
                    title: 'Fine Dining & Tasting',
                    desc: 'Spacious banquettes, VIP chef tables',
                    icon: Sparkles
                  },
                  {
                    id: 'wedding_banquet',
                    title: 'Wedding & Banquet Hall',
                    desc: 'Rounds of 8-10, bridal head tables, dancefloor',
                    icon: HeartHandshake
                  },
                  {
                    id: 'bar_lounge',
                    title: 'Bar, Rooftop & Lounge',
                    desc: 'Cocktail tables, banquettes, high stools',
                    icon: Wine
                  },
                  {
                    id: 'cafe_bakery',
                    title: 'Cafe, Bakery & Deli',
                    desc: 'Communal benches, intimate 2-tops, counter',
                    icon: Coffee
                  },
                  {
                    id: 'hotel_conference',
                    title: 'Hotel & Conference',
                    desc: 'Ballroom galas, theater seating, podiums',
                    icon: Building2
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = venueType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setVenueType(item.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {item.title}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: USER ROLE */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 mb-2">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  Role Customization
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  What is your primary role or background?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Helps us highlight relevant features like reservation status, staff PDF manifests, or CAD scaling.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  {
                    id: 'owner',
                    title: 'Restaurateur / Venue Owner',
                    desc: 'Focused on cover optimization, guest experience & turnover'
                  },
                  {
                    id: 'manager',
                    title: 'General Manager / Maitre D’ / Host',
                    desc: 'Running daily floor shifts, table assignments & reservation manifests'
                  },
                  {
                    id: 'planner',
                    title: 'Event & Wedding Planner',
                    desc: 'Designing custom client seating diagrams & vendor layouts'
                  },
                  {
                    id: 'designer',
                    title: 'Interior Designer / Architect',
                    desc: 'Drafting architectural dimensions, fixtures, and furniture clearances'
                  },
                  {
                    id: 'caterer',
                    title: 'Caterer / Hospitality Consultant',
                    desc: 'Planning modular dining zones, buffet stations, and guest flow'
                  }
                ].map((item) => {
                  const isSelected = role === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setRole(item.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                          isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: BIGGEST CHALLENGE */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 mb-2">
                  <TrendingUp className="w-3 h-3 text-amber-600" />
                  Core Goal
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  What is your biggest floor planning challenge?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Floover is designed to solve hospitality friction. Select your main focus:
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  {
                    id: 'maximize_covers',
                    title: 'Maximizing seat capacity & revenue',
                    desc: 'Fitting maximum covers without sacrificing comfort or crowding aisles',
                    icon: TrendingUp
                  },
                  {
                    id: 'fast_proposals',
                    title: 'Speeding up client layout proposals',
                    desc: 'Sending quick professional floor visualizers to brides and corporate event clients',
                    icon: Clock
                  },
                  {
                    id: 'vip_status',
                    title: 'Managing reservations & VIP assignments',
                    desc: 'Color-coding tables (VIP, Occupied, Reserved) with guest names',
                    icon: Crown
                  },
                  {
                    id: 'pdf_handoff',
                    title: 'Crisp team & kitchen PDF manifests',
                    desc: 'One-click printable table manifests with seating schedules for staff',
                    icon: FileSpreadsheet
                  },
                  {
                    id: 'team_collab',
                    title: 'Live multi-person team collaboration',
                    desc: 'Letting managers, hosts, and planners coordinate changes simultaneously',
                    icon: Users2
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = primaryChallenge === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPrimaryChallenge(item.id)}
                      className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: CAPACITY SCALE */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/70 mb-2">
                  <Building2 className="w-3 h-3 text-violet-600" />
                  Scale & Sizing
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  How many seats or tables do you typically manage?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  We configure default room bounds and grid scales to match your footprint.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  {
                    id: 'under_50',
                    label: 'Intimate / Boutique',
                    seats: 'Under 50 seats',
                    sub: 'Cocktail bars, small cafes, private dining'
                  },
                  {
                    id: '50_150',
                    label: 'Standard Restaurant',
                    seats: '50 to 150 seats',
                    sub: 'Neighborhood bistros, mid-size eateries'
                  },
                  {
                    id: '150_350',
                    label: 'High-Volume Venue',
                    seats: '150 to 350 seats',
                    sub: 'Large event halls, wedding venues, clubs'
                  },
                  {
                    id: '350_plus',
                    label: 'Mega Banquet / Expo',
                    seats: '350+ seats',
                    sub: 'Convention ballrooms, hotel galas, stadiums'
                  }
                ].map((item) => {
                  const isSelected = capacityRange === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCapacityRange(item.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                          {item.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="font-extrabold text-slate-900 text-base mt-1">{item.seats}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: REFERRAL SOURCE (MARKETING ATTRIBUTION) */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 mb-2">
                  <Share2 className="w-3 h-3 text-rose-600" />
                  Marketing Insights
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  How did you hear about Floover?
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Helps our design team know where to share new templates and updates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {[
                  { id: 'google', title: 'Google / Web Search', icon: Search },
                  { id: 'instagram', title: 'Instagram / Social Media', icon: Instagram },
                  { id: 'colleague', title: 'Colleague / Word of Mouth', icon: MessageSquare },
                  { id: 'product_hunt', title: 'Product Hunt / Tech News', icon: Rocket },
                  { id: 'hospitality_forum', title: 'Hospitality Community', icon: Users2 },
                  { id: 'other', title: 'Other / Direct Link', icon: Sparkles }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = referralSource === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setReferralSource(item.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 flex-1">{item.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: PERSONALIZED RECOMMENDATION & LAUNCH */}
          {step === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Your Studio Workspace is Ready!
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  We have configured your Floover canvas with best-practice table presets and clearances for{' '}
                  <strong className="text-indigo-700 capitalize">
                    {venueType.replace(/_/g, ' ')}
                  </strong>
                  .
                </p>
              </div>

              {/* Recommendation Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">
                    Recommended Template Match:
                  </span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    High Affinity
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    F
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {venueType === 'wedding_banquet'
                        ? 'Imperial Ballroom Wedding'
                        : venueType === 'cafe_bakery'
                        ? 'Artisan Cafe & Bakery'
                        : venueType === 'bar_lounge'
                        ? 'Skyline Terrace & Lounge'
                        : venueType === 'hotel_conference'
                        ? 'Corporate Summit & Awards Gala'
                        : venueType === 'fine_dining'
                        ? 'The Grand Reserve (Fine Dining)'
                        : 'Le Bistro Parisien (Restaurant)'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Auto-loaded with 4-tops, booths, bar fixtures, and live cover calculations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional Contact Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Venue or Business Name <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Chez Madeleine or Sunset Hall"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(optional, for cloud sync backups)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@yourvenue.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <span className="text-xs text-slate-400">Takes &lt; 30 seconds</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-sm transition hover:shadow"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-extrabold shadow-md transition hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Launching...' : 'Launch Floor Designer'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingQuestionnaireModal;
