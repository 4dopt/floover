export type TableShape = 'round' | 'rectangle' | 'square' | 'oval' | 'booth' | 'bar';

export type ElementType = 'table' | 'chair' | 'fixture' | 'architectural' | 'decor';

export type TableStatus = 'available' | 'reserved' | 'occupied' | 'vip' | 'blocked';

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
  category: 'tables' | 'seating' | 'fixtures' | 'architectural' | 'decor';
  type: ElementType;
  shape: TableShape;
  defaultCovers: number;
  defaultWidth: number;
  defaultHeight: number;
  description: string;
  icon: string;
  defaultColor?: string;
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
