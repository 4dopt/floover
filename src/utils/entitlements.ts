import {
  PlanTierId,
  CollaboratorRole,
  FeatureKey,
  ActionKey,
  PlanDefinition,
  OrganizationRecord
} from '../types/entitlements';

/**
 * The 4 Official Floordone Subscription Tiers
 */
export const PLAN_TIERS: Record<PlanTierId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Essential 2D floor planning for individuals and one-off venue sketches.',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    includedEditorSeats: 0,
    extraSeatPriceMonthly: 0,
    maxActiveProjects: 1,
    badge: 'FREE FOREVER',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    ctaText: 'Current Plan',
    features: ['BASIC_2D_TOOLS', 'PUBLIC_VIEW_LINKS'],
    bulletPoints: [
      '1 active project limit',
      'Core 2D CAD drafting & table placement',
      'Real-time 3D orbit preview (with Floordone watermark)',
      'Standard PNG / SVG exports',
      'Public view-only sharing links'
    ],
    omittedBulletPoints: [
      'Unlimited projects',
      'Multiplayer live editing with clients',
      'Full unbranded 3D orbit & walkthrough',
      'Dynamic seating capacity calculator',
      'Venue master templates & 3D embed code'
    ]
  },
  planner: {
    id: 'planner',
    name: 'Planner / Pro',
    tagline: 'Complete professional toolkit for event planners, hospitality designers, and coordinators.',
    monthlyPrice: 29,
    annualMonthlyPrice: 24, // ~$288/year
    includedEditorSeats: 1,
    extraSeatPriceMonthly: 0,
    maxActiveProjects: null, // Unlimited
    badge: '⚡ MOST POPULAR',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    highlighted: true,
    ctaText: 'Upgrade to Planner ($29/mo)',
    features: [
      'BASIC_2D_TOOLS',
      'UNLIMITED_PROJECTS',
      'PUBLIC_VIEW_LINKS',
      'MULTIPLAYER_LIVE_EDIT',
      'FULL_3D_WALKTHROUGH',
      'REMOVE_3D_WATERMARK',
      'SEATING_CAPACITY_CALCULATOR',
      'HIGH_RES_PDF_EXPORT'
    ],
    bulletPoints: [
      'Unlimited active projects',
      '1 included editor seat',
      'Live multiplayer editing with clients (real-time cursors)',
      'Full unbranded 3D orbit & first-person walkthrough',
      'Dynamic seating capacity & table spacing calculators',
      'High-resolution vector PDF exports with seating manifests'
    ],
    omittedBulletPoints: [
      'Reusable venue master templates',
      'Guest eye-level sightline tool in 3D',
      'Lighting environments (Daylight vs. Evening)',
      'Embeddable 3D iframe for venue websites'
    ]
  },
  venue: {
    id: 'venue',
    name: 'Venue / Studio',
    tagline: 'The complete venue sales & operations platform with master templates and 3D web embeds.',
    monthlyPrice: 79,
    annualMonthlyPrice: 65, // ~$780/year
    includedEditorSeats: 3,
    extraSeatPriceMonthly: 15, // Extra seats at $15/mo
    maxActiveProjects: null,
    badge: '🏆 VENUE CHOICE',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ctaText: 'Upgrade to Venue ($79/mo)',
    features: [
      'BASIC_2D_TOOLS',
      'UNLIMITED_PROJECTS',
      'PUBLIC_VIEW_LINKS',
      'MULTIPLAYER_LIVE_EDIT',
      'FULL_3D_WALKTHROUGH',
      'REMOVE_3D_WATERMARK',
      'SEATING_CAPACITY_CALCULATOR',
      'HIGH_RES_PDF_EXPORT',
      'VENUE_MASTER_TEMPLATES',
      'MULTI_ROOM_FLOORS',
      '3D_EYE_LEVEL',
      'LIGHTING_ENVIRONMENTS',
      'EMBEDDABLE_3D_IFRAME',
      'EXTRA_EDITOR_SEATS_ADDON'
    ],
    bulletPoints: [
      'Everything in Planner, PLUS:',
      '3 included editor seats (extra seats at $15/mo)',
      'Reusable venue master templates (lock structural boundaries)',
      'Multi-room and multi-floor support',
      'Guest eye-level sightline tool in 3D (test views to stage/head table)',
      'Lighting environment toggles (Daylight vs. Evening Banquet)',
      'Embeddable 3D interactive iframe for your venue website'
    ],
    omittedBulletPoints: [
      'Custom 3D inventory/asset catalog uploading',
      'Client portal custom white-label branding'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Business / Enterprise',
    tagline: 'Turnkey hospitality groups, custom asset catalogs, and white-label client portals.',
    monthlyPrice: 199,
    annualMonthlyPrice: 169,
    includedEditorSeats: 10,
    extraSeatPriceMonthly: 15,
    maxActiveProjects: null,
    badge: '👑 ENTERPRISE',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    ctaText: 'Contact Sales / Upgrade ($199/mo)',
    features: [
      'BASIC_2D_TOOLS',
      'UNLIMITED_PROJECTS',
      'PUBLIC_VIEW_LINKS',
      'MULTIPLAYER_LIVE_EDIT',
      'FULL_3D_WALKTHROUGH',
      'REMOVE_3D_WATERMARK',
      'SEATING_CAPACITY_CALCULATOR',
      'HIGH_RES_PDF_EXPORT',
      'VENUE_MASTER_TEMPLATES',
      'MULTI_ROOM_FLOORS',
      '3D_EYE_LEVEL',
      'LIGHTING_ENVIRONMENTS',
      'EMBEDDABLE_3D_IFRAME',
      'EXTRA_EDITOR_SEATS_ADDON',
      'CUSTOM_INVENTORY_UPLOAD',
      'CLIENT_PORTAL_BRANDING',
      'GRANULAR_TEAM_PERMISSIONS',
      'PRIORITY_RENDERING',
      'DEDICATED_ACCOUNT_MANAGER'
    ],
    bulletPoints: [
      'Everything in Venue / Studio, PLUS:',
      '10 included editor seats (extra seats at $15/mo)',
      'Custom inventory & 3D asset catalog uploading',
      'Client portal branding (custom logo, custom domain, white-label)',
      'Granular team permissions & enterprise audit logs',
      'Priority hardware-accelerated rendering & dedicated SLA'
    ]
  }
};

/**
 * Metadata descriptions for each gated feature
 */
export const FEATURE_METADATA: Record<FeatureKey, { title: string; minTier: PlanTierId; description: string }> = {
  BASIC_2D_TOOLS: {
    title: 'Basic 2D Tools',
    minTier: 'free',
    description: 'Place tables, chairs, and standard room shapes.'
  },
  PUBLIC_VIEW_LINKS: {
    title: 'Public View Links',
    minTier: 'free',
    description: 'Share a read-only 3D/2D preview link with clients.'
  },
  UNLIMITED_PROJECTS: {
    title: 'Unlimited Projects',
    minTier: 'planner',
    description: 'Create unlimited floor plans and active venue layouts (Free is limited to 1).'
  },
  MULTIPLAYER_LIVE_EDIT: {
    title: 'Multiplayer Live Collaboration',
    minTier: 'planner',
    description: 'Figma-style real-time collaboration with team cursors and live object synchronization.'
  },
  FULL_3D_WALKTHROUGH: {
    title: 'First-Person 3D Walkthrough',
    minTier: 'planner',
    description: 'Step directly inside the room at human scale and walk through tables with WASD or arrow keys.'
  },
  REMOVE_3D_WATERMARK: {
    title: 'Unbranded 3D Mode',
    minTier: 'planner',
    description: 'Remove the Floordone watermark from 3D views and exports.'
  },
  SEATING_CAPACITY_CALCULATOR: {
    title: 'Dynamic Seating & Spacing Calculator',
    minTier: 'planner',
    description: 'Real-time calculation of aisle clearances, egress safety, and maximum guest density.'
  },
  HIGH_RES_PDF_EXPORT: {
    title: 'High-Resolution Vector PDF',
    minTier: 'planner',
    description: 'Export architectural 300+ DPI PDF sheets with guest manifests and table breakdowns.'
  },
  VENUE_MASTER_TEMPLATES: {
    title: 'Reusable Venue Master Templates',
    minTier: 'venue',
    description: 'Lock structural walls, service bars, and doors into reusable templates so teams only edit seating.'
  },
  MULTI_ROOM_FLOORS: {
    title: 'Multi-Room & Multi-Floor Layouts',
    minTier: 'venue',
    description: 'Manage interconnected event spaces, multiple floors, and outdoor terraces in a single venue.'
  },
  '3D_EYE_LEVEL': {
    title: 'Guest Eye-Level Sightline Tool',
    minTier: 'venue',
    description: 'Sit at any specific table in 3D and test sightlines to the stage, head table, or dance floor.'
  },
  LIGHTING_ENVIRONMENTS: {
    title: 'Lighting Environment Toggles',
    minTier: 'venue',
    description: 'Switch 3D scene between Daylight, Golden Hour, and Evening Banquet atmosphere.'
  },
  EMBEDDABLE_3D_IFRAME: {
    title: 'Embeddable 3D Venue iFrame',
    minTier: 'venue',
    description: 'Embed interactive 3D floor plans directly onto your venue website or client booking portal.'
  },
  EXTRA_EDITOR_SEATS_ADDON: {
    title: 'Additional Team Seats',
    minTier: 'venue',
    description: 'Add extra team editor seats on demand for $15/month each.'
  },
  CUSTOM_INVENTORY_UPLOAD: {
    title: 'Custom Inventory & Asset Upload',
    minTier: 'enterprise',
    description: 'Upload custom 3D furniture models, branded linens, and proprietary rental inventory.'
  },
  CLIENT_PORTAL_BRANDING: {
    title: 'Client Portal White-Labeling',
    minTier: 'enterprise',
    description: 'White-label the client portal with your company logo, custom domain, and primary colors.'
  },
  GRANULAR_TEAM_PERMISSIONS: {
    title: 'Granular Team Permissions',
    minTier: 'enterprise',
    description: 'Assign role-based access control per room, floor, or venue property.'
  },
  PRIORITY_RENDERING: {
    title: 'Priority Cloud Rendering',
    minTier: 'enterprise',
    description: 'Dedicated GPU clusters for instant high-DPI ray-traced renders and exports.'
  },
  DEDICATED_ACCOUNT_MANAGER: {
    title: 'Dedicated Account Manager',
    minTier: 'enterprise',
    description: 'Direct SLA, onboarding training, and dedicated architecture support.'
  }
};

/**
 * 1. Feature Gate Helper: canAccessFeature
 * Checks whether a given plan tier is entitled to use a specific feature
 */
export function canAccessFeature(
  planTier: PlanTierId = 'free',
  featureKey: FeatureKey
): {
  allowed: boolean;
  minPlan: PlanTierId;
  minPlanName: string;
  featureTitle: string;
  reason?: string;
} {
  const meta = FEATURE_METADATA[featureKey];
  const minPlan = meta?.minTier || 'free';
  const minPlanDef = PLAN_TIERS[minPlan];
  const currentPlanDef = PLAN_TIERS[planTier];

  const allowed = currentPlanDef.features.includes(featureKey);

  return {
    allowed,
    minPlan,
    minPlanName: minPlanDef.name,
    featureTitle: meta?.title || featureKey,
    reason: allowed
      ? undefined
      : `${meta?.title || 'This feature'} requires the ${minPlanDef.name} plan ($${minPlanDef.monthlyPrice}/mo).`
  };
}

/**
 * 2. Role & Live Collaboration Permission Gate: canPerformAction
 * Enforces the matrix separating internal team members from external clients
 */
export function canPerformAction(
  role: CollaboratorRole = 'editor',
  action: ActionKey,
  tempEditorOverride: boolean = false
): {
  allowed: boolean;
  reason?: string;
} {
  // If external client was granted temporary editor rights by owner
  const effectiveRole = (role === 'commenter' && tempEditorOverride) ? 'editor' : role;

  switch (action) {
    case 'manage_billing':
    case 'manage_workspace':
    case 'manage_templates':
      if (effectiveRole === 'owner') return { allowed: true };
      return {
        allowed: false,
        reason: 'Only the Workspace Owner / Admin has permission to modify billing, workspace, or master templates.'
      };

    case 'edit_structure': // Altering outer walls, building perimeter, room dimensions
      if (effectiveRole === 'owner' || effectiveRole === 'editor') return { allowed: true };
      return {
        allowed: false,
        reason: 'Structural walls and venue dimensions are protected. Live clients and commenters cannot modify venue architecture.'
      };

    case 'edit_objects': // Adding, moving, deleting tables/chairs/furniture
    case 'edit_floor_plan':
    case 'save_layout':
      if (effectiveRole === 'owner' || effectiveRole === 'editor') return { allowed: true };
      return {
        allowed: false,
        reason: role === 'commenter'
          ? 'Live Client Mode: You can view multiplayer cursors, explore in 3D, and leave pin comments. Layout edits are locked unless granted temporary editor rights by the host.'
          : 'View-Only Mode: You have read-only access to this floor plan.'
      };

    case 'comment': // Leaving pin-based annotations/comments
      if (effectiveRole !== 'viewer') return { allowed: true };
      return {
        allowed: false,
        reason: 'Viewers have read-only access. To leave comments, request an invite link with commenter permissions.'
      };

    case 'view_cursors':
    case 'view_3d':
    case 'export_documents':
      return { allowed: true };

    case 'manage_collaborators':
      if (effectiveRole === 'owner') return { allowed: true };
      return {
        allowed: false,
        reason: 'Only the Workspace Owner can invite team members or grant temporary editor rights.'
      };

    default:
      return { allowed: true };
  }
}

/**
 * 3. Project Creation Gate: canAddProject
 * Enforces the 1 active project limit on the Free tier
 */
export function canAddProject(
  currentActiveProjectCount: number,
  planTier: PlanTierId = 'free'
): {
  allowed: boolean;
  limit: number | null;
  minPlan: PlanTierId;
  reason?: string;
} {
  const planDef = PLAN_TIERS[planTier];
  if (planDef.maxActiveProjects === null) {
    return { allowed: true, limit: null, minPlan: 'planner' };
  }

  if (currentActiveProjectCount < planDef.maxActiveProjects) {
    return { allowed: true, limit: planDef.maxActiveProjects, minPlan: 'planner' };
  }

  return {
    allowed: false,
    limit: planDef.maxActiveProjects,
    minPlan: 'planner',
    reason: `The Free tier is limited to ${planDef.maxActiveProjects} active project. Upgrade to Planner / Pro ($29/mo) for unlimited floor plans.`
  };
}

/**
 * 4. Seat Allocation Gate: canAddSeat
 * Enforces seat quotas (Free = 0, Planner = 1, Venue = 3 + extra @ $15/mo, Enterprise = 10 + extra @ $15/mo)
 */
export function canAddSeat(
  currentEditorSeats: number,
  planTier: PlanTierId = 'free',
  extraSeatsPurchased: number = 0
): {
  allowed: boolean;
  includedSeats: number;
  totalAllowedSeats: number;
  extraCostPerSeat: number;
  upgradeRequired?: boolean;
  reason?: string;
} {
  const planDef = PLAN_TIERS[planTier];
  const includedSeats = planDef.includedEditorSeats;
  const totalAllowedSeats = includedSeats + extraSeatsPurchased;

  if (planTier === 'free') {
    return {
      allowed: false,
      includedSeats: 0,
      totalAllowedSeats: 0,
      extraCostPerSeat: 0,
      upgradeRequired: true,
      reason: 'The Free plan does not include team editor seats. Upgrade to Planner ($29/mo) or Venue ($79/mo) to add team editors.'
    };
  }

  if (planTier === 'planner') {
    if (currentEditorSeats < includedSeats) {
      return { allowed: true, includedSeats, totalAllowedSeats: 1, extraCostPerSeat: 0 };
    }
    return {
      allowed: false,
      includedSeats,
      totalAllowedSeats: 1,
      extraCostPerSeat: 15,
      upgradeRequired: true,
      reason: 'Planner / Pro includes 1 editor seat. Upgrade to Venue / Studio ($79/mo) for 3 included seats and extra seats at $15/mo.'
    };
  }

  // Venue ($79) & Enterprise ($199) allow extra seats at $15/mo
  const allowed = currentEditorSeats < totalAllowedSeats;
  return {
    allowed,
    includedSeats,
    totalAllowedSeats,
    extraCostPerSeat: planDef.extraSeatPriceMonthly,
    reason: allowed
      ? undefined
      : `You have assigned all ${totalAllowedSeats} editor seats. Additional seats can be purchased for $${planDef.extraSeatPriceMonthly}/mo each.`
  };
}

/**
 * Local state persistence helpers for active Plan and Role testing
 */
export const LOCAL_STORAGE_KEYS = {
  PLAN_TIER: 'floordone_plan_tier',
  COLLAB_ROLE: 'floordone_collab_role',
  TEMP_EDITOR_OVERRIDE: 'floordone_temp_editor_override',
  ORGANIZATION: 'floordone_org_record'
};

export function getStoredPlanTier(): PlanTierId {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.PLAN_TIER);
    if (stored === 'free' || stored === 'planner' || stored === 'venue' || stored === 'enterprise') {
      return stored;
    }
    // Backward compatibility with previous stored keys
    const legacy = localStorage.getItem('floordone_user_plan') || localStorage.getItem('floover_user_plan');
    if (legacy === 'pro' || legacy === 'lifetime') return 'planner';
    if (legacy === 'solo') return 'free';
  } catch (e) {
    // Ignore in SSR
  }
  return 'free';
}

export function setStoredPlanTier(tier: PlanTierId): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PLAN_TIER, tier);
    localStorage.setItem('floordone_user_plan', tier);
    window.dispatchEvent(new CustomEvent('floordone:tier-changed', { detail: { tier } }));
  } catch (e) {
    console.error('Failed to store plan tier', e);
  }
}

export function getStoredCollabRole(): CollaboratorRole {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.COLLAB_ROLE);
    if (stored === 'owner' || stored === 'editor' || stored === 'commenter' || stored === 'viewer') {
      return stored;
    }
  } catch (e) {
    // Ignore
  }
  return 'owner';
}

export function setStoredCollabRole(role: CollaboratorRole): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.COLLAB_ROLE, role);
    window.dispatchEvent(new CustomEvent('floordone:role-changed', { detail: { role } }));
  } catch (e) {
    console.error('Failed to store role', e);
  }
}

export function getStoredTempEditorOverride(): boolean {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.TEMP_EDITOR_OVERRIDE) === 'true';
  } catch (e) {
    return false;
  }
}

export function setStoredTempEditorOverride(enabled: boolean): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.TEMP_EDITOR_OVERRIDE, String(enabled));
    window.dispatchEvent(new CustomEvent('floordone:override-changed', { detail: { enabled } }));
  } catch (e) {
    console.error('Failed to store override', e);
  }
}
