import { TableShape } from '../types';

export interface ChairPosition {
  x: number;
  y: number;
  rotation: number; // degrees
  side?: 'top' | 'right' | 'bottom' | 'left' | 'circle';
  index: number;
  isCorner?: boolean; // Chair is at or nearest to a corner
  isEnd?: boolean;    // Chair is on a short side / head of table
  label?: string;     // Friendly descriptive label e.g. "Top-Left", "Right Head", "Seat 3"
}

/**
 * Returns the effective number of occupied/usable covers considering removed chairs.
 */
export function getEffectiveCovers(covers: number, removedChairs?: number[]): number {
  if (!covers || covers <= 0) return 0;
  if (!removedChairs || removedChairs.length === 0) return covers;
  const validRemoved = removedChairs.filter((idx) => idx >= 0 && idx < covers);
  return Math.max(0, covers - validRemoved.length);
}

/**
 * Calculates realistic 2D chair coordinates and angles around a table shape.
 * Coordinates are relative to the center of the table (0, 0).
 */
export function getChairPositions(
  shape: TableShape,
  width: number,
  height: number,
  covers: number
): ChairPosition[] {
  if (covers <= 0) return [];

  const chairs: ChairPosition[] = [];
  const chairOffset = 18; // clearance distance from edge of table to chair center

  switch (shape) {
    case 'round': {
      const radius = width / 2;
      const chairRadius = radius + chairOffset;
      const angleStep = (Math.PI * 2) / covers;

      for (let i = 0; i < covers; i++) {
        // Start from top (-PI/2)
        const angle = -Math.PI / 2 + i * angleStep;
        const x = Math.cos(angle) * chairRadius;
        const y = Math.sin(angle) * chairRadius;
        const deg = (angle * 180) / Math.PI + 90;

        // Diagonal corners of bounding box: angles near 45°, 135°, 225°, 315°
        // sin(2 * angle) has magnitude near 1.0 at 45, 135, 225, 315 deg
        const isCorner = Math.abs(Math.sin(2 * angle)) > 0.65;

        chairs.push({
          x,
          y,
          rotation: deg,
          side: 'circle',
          index: i,
          isCorner,
          isEnd: i % 2 === 1,
          label: `Seat ${i + 1}${isCorner ? ' (Corner)' : ''}`
        });
      }
      break;
    }

    case 'oval': {
      const rx = width / 2 + chairOffset;
      const ry = height / 2 + chairOffset;
      const angleStep = (Math.PI * 2) / covers;

      for (let i = 0; i < covers; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;
        const deg = (angle * 180) / Math.PI + 90;
        const isCorner = Math.abs(Math.sin(2 * angle)) > 0.65;
        const isEnd = Math.abs(Math.cos(angle)) > 0.85; // extreme left or right

        chairs.push({
          x,
          y,
          rotation: deg,
          side: 'circle',
          index: i,
          isCorner,
          isEnd,
          label: `Seat ${i + 1}${isEnd ? ' (Head)' : isCorner ? ' (Corner)' : ''}`
        });
      }
      break;
    }

    case 'booth': {
      // Booths have seats facing inward from top and bottom benches
      const perSide = Math.ceil(covers / 2);
      const halfH = height / 2;
      const yOffset = halfH + chairOffset - 6;

      for (let i = 0; i < covers; i++) {
        const isTop = i < perSide;
        const sideIndex = isTop ? i : i - perSide;
        const sideTotal = isTop ? perSide : covers - perSide;
        const xSpan = width * 0.8;
        const step = sideTotal > 1 ? xSpan / (sideTotal - 1) : 0;
        const x = -xSpan / 2 + sideIndex * step;
        const isCorner = sideIndex === 0 || sideIndex === sideTotal - 1;

        chairs.push({
          x,
          y: isTop ? -yOffset : yOffset,
          rotation: isTop ? 180 : 0,
          side: isTop ? 'top' : 'bottom',
          index: i,
          isCorner,
          isEnd: isCorner,
          label: `${isTop ? 'Top' : 'Bottom'} Bench ${sideIndex + 1}${isCorner ? ' (Corner)' : ''}`
        });
      }
      break;
    }

    case 'bar': {
      // Stools lined up along bottom or front edge
      const spacing = width / (covers + 1);
      const y = height / 2 + chairOffset;
      for (let i = 0; i < covers; i++) {
        const x = -width / 2 + (i + 1) * spacing;
        const isCorner = i === 0 || i === covers - 1;
        chairs.push({
          x,
          y,
          rotation: 0,
          side: 'bottom',
          index: i,
          isCorner,
          isEnd: isCorner,
          label: `Stool ${i + 1}${isCorner ? ' (End)' : ''}`
        });
      }
      break;
    }

    case 'square':
    case 'rectangle':
    default: {
      const halfW = width / 2;
      const halfH = height / 2;

      if (covers === 1) {
        chairs.push({
          x: 0,
          y: halfH + chairOffset,
          rotation: 0,
          side: 'bottom',
          index: 0,
          label: 'Seat 1'
        });
        break;
      }

      if (covers === 2) {
        // If wider than tall, put on top and bottom; else left and right
        if (width >= height) {
          chairs.push({
            x: 0,
            y: -halfH - chairOffset,
            rotation: 180,
            side: 'top',
            index: 0,
            label: 'Top Center'
          });
          chairs.push({
            x: 0,
            y: halfH + chairOffset,
            rotation: 0,
            side: 'bottom',
            index: 1,
            label: 'Bottom Center'
          });
        } else {
          chairs.push({
            x: -halfW - chairOffset,
            y: 0,
            rotation: 90,
            side: 'left',
            index: 0,
            isEnd: true,
            label: 'Left End'
          });
          chairs.push({
            x: halfW + chairOffset,
            y: 0,
            rotation: 270,
            side: 'right',
            index: 1,
            isEnd: true,
            label: 'Right End'
          });
        }
        break;
      }

      // Distribute proportionally across sides
      // For rectangular tables, long sides get more chairs
      const perimeterRatio = width / (width + height);
      let longSideCount = Math.max(1, Math.round((covers / 2) * perimeterRatio));
      let shortSideCount = Math.max(0, Math.floor((covers - longSideCount * 2) / 2));

      // Reconcile if total doesn't match
      let totalAssigned = longSideCount * 2 + shortSideCount * 2;
      while (totalAssigned < covers) {
        if (longSideCount <= shortSideCount) longSideCount++;
        else shortSideCount++;
        totalAssigned = longSideCount * 2 + shortSideCount * 2;
      }

      // Top side (facing downward = 180 deg)
      const topStep = width / (longSideCount + 1);
      for (let i = 0; i < longSideCount && chairs.length < covers; i++) {
        const isCorner = longSideCount > 1 ? (i === 0 || i === longSideCount - 1) : false;
        chairs.push({
          x: -halfW + (i + 1) * topStep,
          y: -halfH - chairOffset,
          rotation: 180,
          side: 'top',
          index: chairs.length,
          isCorner,
          label: i === 0 ? 'Top-Left Corner' : i === longSideCount - 1 ? 'Top-Right Corner' : `Top Side ${i + 1}`
        });
      }

      // Right side (facing left = 270 deg) -> Short end / Head
      const rightStep = height / (shortSideCount + 1);
      for (let i = 0; i < shortSideCount && chairs.length < covers; i++) {
        chairs.push({
          x: halfW + chairOffset,
          y: -halfH + (i + 1) * rightStep,
          rotation: 270,
          side: 'right',
          index: chairs.length,
          isEnd: true,
          isCorner: true,
          label: shortSideCount === 1 ? 'Right Head (End)' : `Right End ${i + 1}`
        });
      }

      // Bottom side (facing upward = 0 deg)
      const bottomStep = width / (longSideCount + 1);
      for (let i = 0; i < longSideCount && chairs.length < covers; i++) {
        const isCorner = longSideCount > 1 ? (i === 0 || i === longSideCount - 1) : false;
        chairs.push({
          x: halfW - (i + 1) * bottomStep,
          y: halfH + chairOffset,
          rotation: 0,
          side: 'bottom',
          index: chairs.length,
          isCorner,
          label: i === 0 ? 'Bottom-Right Corner' : i === longSideCount - 1 ? 'Bottom-Left Corner' : `Bottom Side ${i + 1}`
        });
      }

      // Left side (facing right = 90 deg) -> Short end / Head
      const leftStep = height / (shortSideCount + 1);
      for (let i = 0; i < shortSideCount && chairs.length < covers; i++) {
        chairs.push({
          x: -halfW - chairOffset,
          y: halfH - (i + 1) * leftStep,
          rotation: 90,
          side: 'left',
          index: chairs.length,
          isEnd: true,
          isCorner: true,
          label: shortSideCount === 1 ? 'Left Head (End)' : `Left End ${i + 1}`
        });
      }
      break;
    }
  }

  return chairs;
}

/**
 * Returns chair indices identified as corner positions.
 */
export function getCornerChairIndices(
  shape: TableShape,
  width: number,
  height: number,
  covers: number
): number[] {
  const chairs = getChairPositions(shape, width, height, covers);
  return chairs.filter((c) => c.isCorner).map((c) => c.index);
}

/**
 * Returns chair indices identified as end positions (heads of table / short ends).
 */
export function getEndChairIndices(
  shape: TableShape,
  width: number,
  height: number,
  covers: number
): number[] {
  const chairs = getChairPositions(shape, width, height, covers);
  return chairs.filter((c) => c.isEnd).map((c) => c.index);
}

