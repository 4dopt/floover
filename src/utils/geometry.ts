/**
 * Geometry and rotation helper utilities for floor plan elements.
 */

export interface RotatedExtents {
  halfW: number;
  halfH: number;
  bboxWidth: number;
  bboxHeight: number;
}

/**
 * Computes the axis-aligned bounding box half-extents of a rectangle rotated around its center.
 */
export function getElementRotatedExtents(
  width: number,
  height: number,
  rotation: number = 0
): RotatedExtents {
  const rad = (((rotation || 0) % 360) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const halfW = (width / 2) * cos + (height / 2) * sin;
  const halfH = (width / 2) * sin + (height / 2) * cos;

  return {
    halfW,
    halfH,
    bboxWidth: halfW * 2,
    bboxHeight: halfH * 2
  };
}

/**
 * Clamps an element's position so that its rotated visual bounding box stays within room boundaries.
 */
export function clampElementPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number = 0,
  roomWidthPx: number,
  roomHeightPx: number,
  pad: number = 8
): { x: number; y: number } {
  const { halfW, halfH } = getElementRotatedExtents(width, height, rotation);
  const currentCenterX = x + width / 2;
  const currentCenterY = y + height / 2;

  const minCenterX = halfW + pad;
  const maxCenterX = Math.max(minCenterX, roomWidthPx - halfW - pad);
  const clampedCenterX = Math.max(minCenterX, Math.min(maxCenterX, currentCenterX));

  const minCenterY = halfH + pad;
  const maxCenterY = Math.max(minCenterY, roomHeightPx - halfH - pad);
  const clampedCenterY = Math.max(minCenterY, Math.min(maxCenterY, currentCenterY));

  return {
    x: Math.round(clampedCenterX - width / 2),
    y: Math.round(clampedCenterY - height / 2)
  };
}

/**
 * Clamps and snaps an element during drag operations, accounting for rotation around its center.
 */
export function dragClampElementPosition(
  rawX: number,
  rawY: number,
  width: number,
  height: number,
  rotation: number = 0,
  roomWidthPx: number,
  roomHeightPx: number,
  snapToGrid: boolean = false,
  snapStep: number = 10,
  pad: number = 8
): { x: number; y: number } {
  const { halfW, halfH } = getElementRotatedExtents(width, height, rotation);
  const rawCenterX = rawX + width / 2;
  const rawCenterY = rawY + height / 2;

  const minCenterX = halfW + pad;
  const maxCenterX = Math.max(minCenterX, roomWidthPx - halfW - pad);
  const minCenterY = halfH + pad;
  const maxCenterY = Math.max(minCenterY, roomHeightPx - halfH - pad);

  const targetCenterX = Math.max(minCenterX, Math.min(maxCenterX, rawCenterX));
  const targetCenterY = Math.max(minCenterY, Math.min(maxCenterY, rawCenterY));

  let targetX = targetCenterX - width / 2;
  let targetY = targetCenterY - height / 2;

  if (snapToGrid) {
    let snappedX = Math.round(targetX / snapStep) * snapStep;
    let snappedY = Math.round(targetY / snapStep) * snapStep;

    const finalCenterX = snappedX + width / 2;
    const finalCenterY = snappedY + height / 2;

    if (finalCenterX - halfW < pad) {
      snappedX = Math.ceil(minCenterX - width / 2);
      snappedX = Math.ceil(snappedX / snapStep) * snapStep;
    } else if (finalCenterX + halfW > roomWidthPx - pad && maxCenterX >= minCenterX) {
      snappedX = Math.floor(maxCenterX - width / 2);
      snappedX = Math.floor(snappedX / snapStep) * snapStep;
    }

    if (finalCenterY - halfH < pad) {
      snappedY = Math.ceil(minCenterY - height / 2);
      snappedY = Math.ceil(snappedY / snapStep) * snapStep;
    } else if (finalCenterY + halfH > roomHeightPx - pad && maxCenterY >= minCenterY) {
      snappedY = Math.floor(maxCenterY - height / 2);
      snappedY = Math.floor(snappedY / snapStep) * snapStep;
    }

    return { x: snappedX, y: snappedY };
  }

  return {
    x: Math.round(targetX),
    y: Math.round(targetY)
  };
}
