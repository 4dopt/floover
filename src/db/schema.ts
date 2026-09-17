/**
 * Database Schema: Production Relational Architecture
 * Designed for PostgreSQL / Supabase / Cloud SQL / Neon
 *
 * Tables Defined:
 * 1. `plan_tiers` - The 4 official subscription packages & entitlement flags
 * 2. `organizations` - Multi-tenant accounts, subscription status & seats
 * 3. `seats` - Provisioned internal team editor licenses ($15/mo extra addons)
 * 4. `projects` - Floor plans, master templates, watermark & embedding rules
 * 5. `collaborators` - Team members & live external clients (owner/editor/commenter/viewer)
 * 6. `pin_comments` - Figma-style real-time canvas pin annotations
 * 7. `feature_audit_logs` - Compliance & billing enforcement audit trails
 */

export const DATABASE_MIGRATION_SQL = `
-- ============================================================================
-- 1. PLAN TIERS TABLE
-- Stores tier limits, pricing, included editor seats, and baseline entitlement flags
-- ============================================================================
CREATE TABLE IF NOT EXISTS plan_tiers (
  id VARCHAR(32) PRIMARY KEY, -- 'free', 'planner', 'venue', 'enterprise'
  name VARCHAR(64) NOT NULL,
  tagline TEXT,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  price_annual_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  included_editor_seats INT NOT NULL DEFAULT 1,
  extra_seat_price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  max_active_projects INT NULL, -- NULL indicates unlimited projects
  can_multiplayer_live_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_full_3d_walkthrough BOOLEAN NOT NULL DEFAULT FALSE,
  can_remove_3d_watermark BOOLEAN NOT NULL DEFAULT FALSE,
  can_seating_capacity_calc BOOLEAN NOT NULL DEFAULT FALSE,
  can_high_res_pdf_export BOOLEAN NOT NULL DEFAULT FALSE,
  can_venue_master_templates BOOLEAN NOT NULL DEFAULT FALSE,
  can_multi_room_floors BOOLEAN NOT NULL DEFAULT FALSE,
  can_3d_eye_level_sightline BOOLEAN NOT NULL DEFAULT FALSE,
  can_lighting_environments BOOLEAN NOT NULL DEFAULT FALSE,
  can_embed_3d_iframe BOOLEAN NOT NULL DEFAULT FALSE,
  can_custom_inventory BOOLEAN NOT NULL DEFAULT FALSE,
  can_client_portal_branding BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. ORGANIZATIONS (WORKSPACES) TABLE
-- Tracks billing lifecycle, subscription seats, and custom white-labeling
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  plan_tier_id VARCHAR(32) NOT NULL REFERENCES plan_tiers(id) ON UPDATE CASCADE,
  billing_cycle VARCHAR(16) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  billing_status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (billing_status IN ('active', 'trialing', 'past_due', 'canceled', 'lifetime')),
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  extra_seats_purchased INT NOT NULL DEFAULT 0 CHECK (extra_seats_purchased >= 0),
  custom_logo_url TEXT,
  custom_portal_title VARCHAR(255),
  custom_primary_color VARCHAR(32),
  hide_floordone_badge BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_plan_status ON organizations(plan_tier_id, billing_status);

-- ============================================================================
-- 3. SEATS TABLE
-- Tracks internal team members holding paid editor licenses in the organization
-- ============================================================================
CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  seat_type VARCHAR(16) NOT NULL DEFAULT 'included' CHECK (seat_type IN ('included', 'additional')),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'revoked')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT unique_active_org_user_seat UNIQUE (org_id, user_id, status)
);

CREATE INDEX IF NOT EXISTS idx_seats_org_status ON seats(org_id, status);

-- ============================================================================
-- 4. PROJECTS (FLOOR PLANS & VENUES) TABLE
-- Stores spatial dimensions, room layouts, master template flags, and share controls
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  venue_type VARCHAR(64) NOT NULL DEFAULT 'restaurant',
  style_category VARCHAR(64),
  room_width NUMERIC(8, 2) NOT NULL DEFAULT 50.00,
  room_height NUMERIC(8, 2) NOT NULL DEFAULT 35.00,
  unit VARCHAR(8) NOT NULL DEFAULT 'ft' CHECK (unit IN ('ft', 'm')),
  grid_size INT NOT NULL DEFAULT 20,
  room_shape VARCHAR(32) NOT NULL DEFAULT 'rectangle',
  boundary_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_master_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  watermark_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  allow_public_view BOOLEAN NOT NULL DEFAULT TRUE,
  allow_client_comments BOOLEAN NOT NULL DEFAULT TRUE,
  allow_embed_iframe BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_projects_org_active ON projects(org_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_projects_master_template ON projects(org_id, is_master_template);

-- ============================================================================
-- 5. COLLABORATORS TABLE
-- Separates internal team members (owner, editor) from temporary external clients
-- ============================================================================
CREATE TABLE IF NOT EXISTS collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  client_session_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar VARCHAR(32) NOT NULL DEFAULT '👨‍💼',
  color VARCHAR(32) NOT NULL DEFAULT '#3b82f6',
  role VARCHAR(16) NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')),
  is_external_client BOOLEAN NOT NULL DEFAULT FALSE,
  temp_editor_override BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_collaborator_identity CHECK (user_id IS NOT NULL OR client_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_collab_project_role ON collaborators(project_id, role);

-- ============================================================================
-- 6. PIN COMMENTS TABLE
-- Figma-style pin annotations dropped on specific 2D coordinates / furniture items
-- ============================================================================
CREATE TABLE IF NOT EXISTS pin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(16) NOT NULL,
  author_color VARCHAR(32) NOT NULL,
  author_avatar VARCHAR(32) NOT NULL,
  x NUMERIC(8, 2) NOT NULL, -- Room coordinate x
  y NUMERIC(8, 2) NOT NULL, -- Room coordinate y
  element_id VARCHAR(64),   -- Attached floor element (optional)
  text TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pin_comments_project ON pin_comments(project_id, resolved);

-- ============================================================================
-- 7. SEED DATA: OFFICIAL 4 TIERS
-- ============================================================================
INSERT INTO plan_tiers (
  id, name, tagline, price_monthly, price_annual_monthly,
  included_editor_seats, extra_seat_price_monthly, max_active_projects,
  can_multiplayer_live_edit, can_full_3d_walkthrough, can_remove_3d_watermark,
  can_seating_capacity_calc, can_high_res_pdf_export, can_venue_master_templates,
  can_multi_room_floors, can_3d_eye_level_sightline, can_lighting_environments,
  can_embed_3d_iframe, can_custom_inventory, can_client_portal_branding
) VALUES
  (
    'free',
    'Free Starter',
    'Essential 2D floor planning for individuals and one-off venue sketches.',
    0.00, 0.00,
    0, 0.00, 1,
    FALSE, FALSE, FALSE,
    FALSE, FALSE, FALSE,
    FALSE, FALSE, FALSE,
    FALSE, FALSE, FALSE
  ),
  (
    'planner',
    'Planner / Pro',
    'High-speed planning for event planners, hospitality designers, and coordinators.',
    29.00, 24.00,
    1, 0.00, NULL, -- Unlimited projects
    TRUE, TRUE, TRUE,
    TRUE, TRUE, FALSE,
    FALSE, FALSE, FALSE,
    FALSE, FALSE, FALSE
  ),
  (
    'venue',
    'Venue / Studio',
    'The complete venue sales & operations platform with master templates and 3D web embeds.',
    79.00, 65.00,
    3, 15.00, NULL, -- 3 seats included, extra seats $15/mo
    TRUE, TRUE, TRUE,
    TRUE, TRUE, TRUE,
    TRUE, TRUE, TRUE,
    TRUE, FALSE, FALSE
  ),
  (
    'enterprise',
    'Business / Enterprise',
    'Turnkey multi-venue hospitality groups, custom 3D inventory, and client portal white-labeling.',
    199.00, 169.00,
    10, 15.00, NULL,
    TRUE, TRUE, TRUE,
    TRUE, TRUE, TRUE,
    TRUE, TRUE, TRUE,
    TRUE, TRUE, TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  price_monthly = EXCLUDED.price_monthly,
  price_annual_monthly = EXCLUDED.price_annual_monthly,
  included_editor_seats = EXCLUDED.included_editor_seats,
  extra_seat_price_monthly = EXCLUDED.extra_seat_price_monthly,
  max_active_projects = EXCLUDED.max_active_projects,
  can_multiplayer_live_edit = EXCLUDED.can_multiplayer_live_edit,
  can_full_3d_walkthrough = EXCLUDED.can_full_3d_walkthrough,
  can_remove_3d_watermark = EXCLUDED.can_remove_3d_watermark,
  can_seating_capacity_calc = EXCLUDED.can_seating_capacity_calc,
  can_high_res_pdf_export = EXCLUDED.can_high_res_pdf_export,
  can_venue_master_templates = EXCLUDED.can_venue_master_templates,
  can_multi_room_floors = EXCLUDED.can_multi_room_floors,
  can_3d_eye_level_sightline = EXCLUDED.can_3d_eye_level_sightline,
  can_lighting_environments = EXCLUDED.can_lighting_environments,
  can_embed_3d_iframe = EXCLUDED.can_embed_3d_iframe,
  can_custom_inventory = EXCLUDED.can_custom_inventory,
  can_client_portal_branding = EXCLUDED.can_client_portal_branding;
`;

export default DATABASE_MIGRATION_SQL;
