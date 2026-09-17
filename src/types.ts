export type TableShape = 'round' | 'rectangle' | 'square' | 'oval' | 'booth' | 'bar';

export type ElementType = 'table' | 'chair' | 'fixture' | 'architectural' | 'decor';

export type TableStatus = 'available' | 'reserved' | 'occupied' | 'vip' | 'blocked';

export interface Point2D {
  x: number; // in room coordinates (ft or m)
  y: number; // in room coordinates (ft or m)
}

export type RoomShapePreset =
  | 'rectangle'
  | 'l-shape'
  | 't-shape'
  | 'u-shape'
  | 'angled'
  | 'hexagon'
  | 'custom';

export interface FloorElement {
  id: string;
  type: ElementType;
  name: string;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees 0-360
  covers: number; // chair count
  status: TableStatus;
  guestName?: string;
  notes?: string;
  color?: string;
  locked?: boolean;
  category?: string;
  iconName?: string;
  removedChairs?: number[]; // indices of chairs removed/hidden from this table
  subtype?: string; // specific architectural/decor subtype (e.g. wall-solid, door-single, plant-potted, deck-wood)
}

export interface FloorPlan {
  id: string;
  name: string;
  description?: string;
  venueType: 'restaurant' | 'banquet' | 'cafe' | 'conference' | 'lounge' | 'outdoor';
  styleCategory?: string;
  roomWidth: number; // e.g. 50 (in unit)
  roomHeight: number; // e.g. 35 (in unit)
  unit: 'ft' | 'm';
  gridSize: number; // pixels per foot/meter (default 16 or 20)
  roomShape?: RoomShapePreset;
  boundaryPoints?: Point2D[]; // Polygon vertices in room coordinates (e.g. [{x:0, y:0}, ...])
  wallHeight?: number; // Wall height in room unit (default 10 ft / 3 m)
  wallThickness?: number; // Wall thickness (default 0.75 ft / 0.25 m)
  elements: FloorElement[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  role?: 'owner' | 'editor' | 'commenter' | 'viewer';
  cursor?: { x: number; y: number };
  selectedElementId?: string | null;
  lastActive?: number;
}

export interface RoomTemplate {
  id: string;
  name: string;
  style: string;
  venueType: string;
  dimensions: {
    width: number;
    height: number;
    unit: 'ft' | 'm';
  };
  capacity: number;
  tableCount: number;
  description: string;
  tags: string[];
  thumbnailColor: string;
  elements: FloorElement[];
}

export interface FurniturePreset {
  id: string;
  name: string;
  category: 'tables' | 'seating' | 'fixtures' | 'architectural' | 'decor' | 'outdoor';
  type: ElementType;
  shape: TableShape;
  defaultCovers: number;
  defaultWidth: number;
  defaultHeight: number;
  description: string;
  icon: string;
  defaultColor?: string;
  subtype?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  venueType: string;
  styleCategory?: string;
  roomWidth: number;
  roomHeight: number;
  unit: 'ft' | 'm';
  tableCount: number;
  totalCovers: number;
  elementCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MarketingQuestionnaireData {
  venueType: string;
  role: string;
  primaryChallenge: string;
  capacityRange: string;
  referralSource: string;
  businessName?: string;
  email?: string;
  submittedAt: string;
}

export type PricingPlanId = 'free' | 'planner' | 'venue' | 'enterprise' | 'solo' | 'pro' | 'lifetime';
