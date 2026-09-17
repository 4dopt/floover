/**
 * Core Product Tiering, Feature Flags, and Live Collaboration Permission Matrix
 * Floordone - Venue Layout & Floor Planning Platform
 */

export type PlanTierId = 'free' | 'planner' | 'venue' | 'enterprise';

export type CollaboratorRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export type BillingCycle = 'monthly' | 'annual';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'lifetime';

export type FeatureKey =
  // 1. Core & Project Capacity
  | 'BASIC_2D_TOOLS'
  | 'UNLIMITED_PROJECTS'
  | 'PUBLIC_VIEW_LINKS'
  // 2. Pro / Planner ($29/mo) Features
  | 'MULTIPLAYER_LIVE_EDIT'
  | 'FULL_3D_WALKTHROUGH'
  | 'REMOVE_3D_WATERMARK'
  | 'SEATING_CAPACITY_CALCULATOR'
  | 'HIGH_RES_PDF_EXPORT'
  // 3. Venue / Studio ($79/mo) Features
  | 'VENUE_MASTER_TEMPLATES'
  | 'MULTI_ROOM_FLOORS'
  | '3D_EYE_LEVEL'
  | 'LIGHTING_ENVIRONMENTS'
  | 'EMBEDDABLE_3D_IFRAME'
  | 'EXTRA_EDITOR_SEATS_ADDON'
  // 4. Enterprise ($199+/mo) Features
  | 'CUSTOM_INVENTORY_UPLOAD'
  | 'CLIENT_PORTAL_BRANDING'
  | 'GRANULAR_TEAM_PERMISSIONS'
  | 'PRIORITY_RENDERING'
  | 'DEDICATED_ACCOUNT_MANAGER';

export type ActionKey =
  | 'manage_billing'
  | 'manage_workspace'
  | 'manage_templates'
  | 'edit_floor_plan'
  | 'edit_structure' // altering outer walls, room boundary, dimensions
  | 'edit_objects' // adding, moving, deleting tables/furniture
  | 'save_layout'
  | 'comment' // leaving pin-based annotations/comments
  | 'view_cursors' // seeing multiplayer presence
  | 'view_3d' // opening 3D visualization
  | 'export_documents'
  | 'manage_collaborators';

export interface PlanDefinition {
  id: PlanTierId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  includedEditorSeats: number;
  extraSeatPriceMonthly: number;
  maxActiveProjects: number | null; // null = unlimited
  badge?: string;
  badgeColor?: string;
  highlighted?: boolean;
  ctaText: string;
  features: FeatureKey[];
  bulletPoints: string[];
  omittedBulletPoints?: string[];
}

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  planTierId: PlanTierId;
  billingCycle: BillingCycle;
  billingStatus: SubscriptionStatus;
  customerId?: string;
  subscriptionId?: string;
  includedEditorSeats: number;
  extraSeatsPurchased: number;
  totalEditorSeats: number;
  customBranding?: {
    logoUrl?: string;
    portalTitle?: string;
    primaryColor?: string;
    hideFloordoneBadge?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SeatRecord {
  id: string;
  orgId: string;
  userId: string;
  userEmail: string;
  userName: string;
  seatType: 'included' | 'additional';
  status: 'active' | 'invited' | 'revoked';
  assignedAt: string;
  revokedAt?: string;
}

export interface CollaboratorPermissionRecord {
  id: string;
  projectId: string;
  userId?: string;
  name: string;
  email?: string;
  avatar: string;
  color: string;
  role: CollaboratorRole;
  isExternalClient: boolean;
  tempEditorOverride?: boolean; // Granted by owner to client for current session
  joinedAt: string;
  lastActiveAt: string;
}

export interface PinComment {
  id: string;
  projectId: string;
  authorName: string;
  authorRole: CollaboratorRole;
  authorColor: string;
  authorAvatar: string;
  x: number; // 2D room coordinate (ft or m)
  y: number; // 2D room coordinate (ft or m)
  elementId?: string; // Optional attached element (e.g. Table 4)
  text: string;
  resolved: boolean;
  createdAt: string;
  replies?: Array<{
    id: string;
    authorName: string;
    text: string;
    createdAt: string;
  }>;
}

export interface SightlinePoint {
  tableId: string;
  tableName: string;
  targetName: string;
  tablePosition: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  clearanceScore: number; // 0 to 100%
  status: 'clear' | 'partially_blocked' | 'blocked';
  obstructions?: string[];
}
