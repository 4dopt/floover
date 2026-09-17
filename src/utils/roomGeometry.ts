import { Point2D, RoomShapePreset, FloorPlan } from '../types';

/**
 * Returns the effective polygon boundary points in room units (ft or m).
 * If no boundaryPoints are set, defaults to a rectangle matching roomWidth & roomHeight.
 */
export function getEffectiveBoundaryPoints(
  floorPlan: Pick<FloorPlan, 'roomWidth' | 'roomHeight' | 'boundaryPoints'>
): Point2D[] {
  if (
    floorPlan.boundaryPoints &&
    Array.isArray(floorPlan.boundaryPoints) &&
    floorPlan.boundaryPoints.length >= 3
  ) {
    return floorPlan.boundaryPoints.map((p) => ({
      x: Math.round(p.x * 10) / 10,
      y: Math.round(p.y * 10) / 10
    }));
  }

  const w = Math.max(10, floorPlan.roomWidth || 40);
  const h = Math.max(10, floorPlan.roomHeight || 30);

  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h }
  ];
}

/**
 * Generates preset boundary points for common venue architecture shapes.
 */
export function getPresetBoundaryPoints(
  preset: RoomShapePreset,
  width: number,
  height: number
): Point2D[] {
  const w = Math.max(15, Math.round(width));
  const h = Math.max(15, Math.round(height));

  switch (preset) {
    case 'l-shape': {
      // L-Shape with main wing and side wing
      const cutW = Math.round(w * 0.45);
      const cutH = Math.round(h * 0.5);
      return [
        { x: 0, y: 0 },
        { x: w - cutW, y: 0 },
        { x: w - cutW, y: cutH },
        { x: w, y: cutH },
        { x: w, y: h },
        { x: 0, y: h }
      ];
    }

    case 't-shape': {
      // T-Shape with central stem
      const wingW = Math.round(w * 0.25);
      const crossH = Math.round(h * 0.45);
      return [
        { x: wingW, y: 0 },
        { x: w - wingW, y: 0 },
        { x: w - wingW, y: crossH },
        { x: w, y: crossH },
        { x: w, y: h },
        { x: 0, y: h },
        { x: 0, y: crossH },
        { x: wingW, y: crossH }
      ];
    }

    case 'u-shape': {
      // U-Shape with courtyard cutout in the top center
      const legW = Math.round(w * 0.32);
      const courtH = Math.round(h * 0.55);
      return [
        { x: 0, y: 0 },
        { x: legW, y: 0 },
        { x: legW, y: courtH },
        { x: w - legW, y: courtH },
        { x: w - legW, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h }
      ];
    }

    case 'angled': {
      // Angled/Chamfered room with a 45-degree diagonal wall at top-right
      const chamferX = Math.round(w * 0.28);
      const chamferY = Math.round(h * 0.28);
      return [
        { x: 0, y: 0 },
        { x: w - chamferX, y: 0 },
        { x: w, y: chamferY },
        { x: w, y: h },
        { x: 0, y: h }
      ];
    }

    case 'hexagon': {
      // Octagonal / Angled ballroom with 4 corner chamfers
      const cx = Math.round(w * 0.2);
      const cy = Math.round(h * 0.2);
      return [
        { x: cx, y: 0 },
        { x: w - cx, y: 0 },
        { x: w, y: cy },
        { x: w, y: h - cy },
        { x: w - cx, y: h },
        { x: cx, y: h },
        { x: 0, y: h - cy },
        { x: 0, y: cy }
      ];
    }

    case 'rectangle':
    case 'custom':
    default:
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h }
      ];
  }
}

/**
 * Calculates the polygon floor area in square units using the Shoelace formula.
 */
export function calculatePolygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area) / 2;
}

/**
 * Calculates bounding box extents for an array of 2D points.
 */
export function calculateBoundingBox(points: Point2D[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 40, maxY: 30, width: 40, height: 30 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(10, Math.round(maxX - minX)),
    height: Math.max(10, Math.round(maxY - minY))
  };
}

/**
 * Information about each wall segment between consecutive polygon vertices.
 */
export interface WallSegment {
  index: number;
  p1: Point2D;
  p2: Point2D;
  length: number; // in room unit
  mid: Point2D;
  angle: number; // in radians
  degrees: number;
}

/**
 * Decomposes polygon boundary points into wall segments.
 */
export function getWallSegments(points: Point2D[]): WallSegment[] {
  const segments: WallSegment[] = [];
  const n = points.length;
  if (n < 2) return segments;

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const angle = Math.atan2(dy, dx);
    const degrees = (angle * 180) / Math.PI;

    segments.push({
      index: i,
      p1,
      p2,
      length: Math.round(length * 10) / 10,
      mid,
      angle,
      degrees
    });
  }

  return segments;
}

/**
 * Tests whether a point (x, y in room coordinates) is inside the polygon (Ray Casting).
 */
export function isPointInsidePolygon(point: Point2D, vs: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x;
    const yi = vs[i].y;
    const xj = vs[j].x;
    const yj = vs[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Inserts a new vertex along the wall segment at edgeIndex, splitting it.
 */
export function insertVertexOnEdge(
  points: Point2D[],
  edgeIndex: number,
  newPoint?: Point2D
): Point2D[] {
  const n = points.length;
  if (edgeIndex < 0 || edgeIndex >= n) return points;

  const p1 = points[edgeIndex];
  const p2 = points[(edgeIndex + 1) % n];
  const midpoint = newPoint || {
    x: Math.round(((p1.x + p2.x) / 2) * 2) / 2,
    y: Math.round(((p1.y + p2.y) / 2) * 2) / 2
  };

  const nextPoints = [...points];
  nextPoints.splice(edgeIndex + 1, 0, midpoint);
  return nextPoints;
}

/**
 * Removes a vertex at vertexIndex if there are more than 3 vertices remaining.
 */
export function removeVertexAtIndex(
  points: Point2D[],
  vertexIndex: number
): Point2D[] {
  if (points.length <= 3) return points;
  return points.filter((_, idx) => idx !== vertexIndex);
}

/**
 * Formats points into an SVG polygon points attribute string scaled by scaleRatio.
 */
export function pointsToSvgPointsString(
  points: Point2D[],
  scaleRatio: number
): string {
  return points.map((p) => `${p.x * scaleRatio},${p.y * scaleRatio}`).join(' ');
}

/**
 * Formats points into an SVG path "M ... L ... Z" string scaled by scaleRatio.
 */
export function pointsToSvgPathD(points: Point2D[], scaleRatio: number): string {
  if (points.length === 0) return '';
  const first = points[0];
  const rest = points.slice(1);
  return (
    `M ${first.x * scaleRatio} ${first.y * scaleRatio} ` +
    rest.map((p) => `L ${p.x * scaleRatio} ${p.y * scaleRatio}`).join(' ') +
    ' Z'
  );
}
