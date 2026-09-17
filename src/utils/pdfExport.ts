import jsPDF from 'jspdf';
import { FloorPlan, FloorElement } from '../types';
import { getEffectiveCovers } from './chairLayout';

export interface ExportPdfOptions {
  includeManifest?: boolean;
  includeStats?: boolean;
  paperSize?: 'a4' | 'letter';
  orientation?: 'landscape' | 'portrait';
  dpiQuality?: 'standard' | 'high' | 'ultra'; // standard: 2x (150 DPI), high: 3.5x (300 DPI), ultra: 5x (450 DPI)
  includeTitleBlock?: boolean;
  includeCompass?: boolean;
  includeLegend?: boolean;
}

/**
 * Draws the official Floordone geometric logomark in pure vector primitives.
 * Features the signature obsidian squircle with the centered radiant completion checkmark.
 */
function drawFloordoneVectorLogo(pdf: jsPDF, x: number, y: number, size: number) {
  // 1. Squircle Base Container
  pdf.setFillColor(15, 23, 42); // slate-900 / obsidian
  pdf.roundedRect(x, y, size, size, size * 0.22, size * 0.22, 'F');

  // Subtle border outline
  pdf.setDrawColor(51, 65, 85); // slate-700
  pdf.setLineWidth(0.18);
  pdf.roundedRect(x, y, size, size, size * 0.22, size * 0.22, 'D');

  // 2. The Centered Floordone "Done" Checkmark - Bold & Thick
  const lw = Math.max(0.75, size * 0.14);
  pdf.setDrawColor(99, 102, 241); // indigo-500
  pdf.setLineWidth(lw);
  pdf.line(x + size * 0.25, y + size * 0.52, x + size * 0.43, y + size * 0.70);
  pdf.line(x + size * 0.43, y + size * 0.70, x + size * 0.75, y + size * 0.30);

  // Luminous white inner core
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(lw * 0.32);
  pdf.line(x + size * 0.25, y + size * 0.52, x + size * 0.43, y + size * 0.70);
  pdf.line(x + size * 0.43, y + size * 0.70, x + size * 0.75, y + size * 0.30);
}

/**
 * Draws the signature Floordone Architectural Branding Banner at the bottom of a sheet.
 * Includes vector logomark, "floor" + "done." brand wordmark, tagline, website,
 * verification label, dynamic sheet numbering, and archival resolution stamp.
 */
function drawFloordoneFooter(
  pdf: jsPDF,
  pageNumber: number,
  totalPages: number,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  const footerH = 10;
  const footerY = pageHeight - margin - 1.2 - footerH;
  const footerW = pageWidth - (margin + 1.2) * 2;
  const footerX = margin + 1.2;

  // 1. Subtle Architectural Ribbon Background
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.roundedRect(footerX, footerY, footerW, footerH, 1.2, 1.2, 'F');

  // Delicate Outer Border
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.25);
  pdf.roundedRect(footerX, footerY, footerW, footerH, 1.2, 1.2, 'D');

  // Top Indigo Accent Line
  pdf.setFillColor(79, 70, 229); // indigo-600
  pdf.rect(footerX + 1.5, footerY, footerW - 3, 0.5, 'F');

  // 2. Floordone Brand Wordmark on Left: "floor" + "done"
  const brandStartX = footerX + 2.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text('floor', brandStartX, footerY + 5.0);
  const floorW = pdf.getTextWidth('floor');

  pdf.setTextColor(79, 70, 229); // indigo-600
  pdf.text('done', brandStartX + floorW, footerY + 5.0);
  const doneW = pdf.getTextWidth('done');

  // 3. Floordone Vector Logomark placed directly after "floordone", sized to harmonize with text
  const logoSize = 4.6;
  const logoX = brandStartX + floorW + doneW + 1.6;
  const logoY = footerY + 1.2;
  drawFloordoneVectorLogo(pdf, logoX, logoY, logoSize);

  // Subtitle / Tagline below wordmark
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.6);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text('FLOOR PLANS, DONE. ', brandStartX, footerY + 8.3);
  const tagW = pdf.getTextWidth('FLOOR PLANS, DONE. ');

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text('•  PRECISION HOSPITALITY SEATING & CAD STUDIO  •  ', brandStartX + tagW, footerY + 8.3);
  const midW = pdf.getTextWidth('•  PRECISION HOSPITALITY SEATING & CAD STUDIO  •  ');

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229); // indigo-600
  pdf.text('floordone.com', brandStartX + tagW + midW, footerY + 8.3);

  // 4. Right Side: Dynamic Sheet Pill & Verification Status
  const rightMargin = footerX + footerW - 2.5;
  const pillW = 28;
  const pillH = 4.8;
  const pillX = rightMargin - pillW;
  const pillY = footerY + 1.5;

  // Dark slate sheet counter badge
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.roundedRect(pillX, pillY, pillW, pillH, 1, 1, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`SHEET ${pageNumber} OF ${totalPages}`, pillX + pillW / 2, pillY + 3.4, { align: 'center' });

  // Verification & Confidentiality Note below sheet pill
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(4.6);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text('CONFIDENTIAL • CERTIFIED SPECIFICATION', rightMargin, footerY + 8.3, { align: 'right' });
}

/**
 * Renders the floor plan SVG directly onto an HTML Canvas at ultra-high DPI.
 * Bypasses html2canvas completely to avoid CSS oklab errors, and renders native vector
 * geometry at 300-450 DPI for crystal-clear HD printing and retina displays.
 */
export async function renderFloorPlanToCanvas(
  containerOrSvg: HTMLElement | SVGSVGElement | null,
  floorPlan: FloorPlan,
  scale: number = 3.5
): Promise<HTMLCanvasElement> {
  let svgElement: SVGSVGElement | null = null;

  if (containerOrSvg instanceof SVGSVGElement) {
    svgElement = containerOrSvg;
  } else if (containerOrSvg) {
    svgElement = containerOrSvg.querySelector('svg#floor-plan-svg') || containerOrSvg.querySelector('svg');
  }

  if (!svgElement) {
    const el = document.getElementById('floor-plan-svg');
    if (el instanceof SVGSVGElement) {
      svgElement = el;
    }
  }

  if (!svgElement) {
    throw new Error('Floor plan canvas element not found. Please ensure the floor plan editor is visible.');
  }

  // Clone SVG so we do not mutate the live interactive DOM
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // 1. Remove collaborator cursors and live presence overlays
  const cursors = clone.querySelectorAll('[class*="collab-cursor"], [id*="collab"], [class*="z-50"]');
  cursors.forEach((c) => c.remove());

  // 2. Remove interactive selection outlines, rotation stems, and knobs safely
  // (Do not remove parents of arbitrary stroke-dasharrays to preserve doors/patterns)
  const selectionBoxes = clone.querySelectorAll('rect[stroke="#4f46e5"][stroke-dasharray]');
  selectionBoxes.forEach((el) => {
    const parent = el.parentElement;
    if (parent && parent.tagName.toLowerCase() === 'g') {
      parent.remove();
    } else {
      el.remove();
    }
  });

  const rotateKnobs = clone.querySelectorAll('circle[r="6"]');
  rotateKnobs.forEach((k) => {
    const parent = k.parentElement;
    if (parent && parent.tagName.toLowerCase() === 'g') {
      parent.remove();
    } else {
      k.remove();
    }
  });

  // Remove ghost chair placeholder slots
  const ghostChairs = clone.querySelectorAll('[class*="group/ghost"], [class*="chair-ghost"]');
  ghostChairs.forEach((g) => g.remove());

  // Reset any active selection borders from blue editing state to standard presentation colors
  const activeSelectedRects = clone.querySelectorAll('rect[stroke="#4f46e5"]');
  activeSelectedRects.forEach((r) => {
    r.setAttribute('stroke', '#334155');
    r.setAttribute('stroke-width', '2');
  });

  // 3. Remove resize controls and guidelines
  const resizeControls = clone.querySelector('#floor-canvas-resize-controls');
  if (resizeControls) resizeControls.remove();

  // 4. Calculate exact pixel dimensions and target high-DPI raster resolution
  const scaleRatio = 20;
  const roomWidthPx = floorPlan.roomWidth * scaleRatio;
  const roomHeightPx = floorPlan.roomHeight * scaleRatio;
  const targetWidth = Math.max(1200, Math.round(roomWidthPx * scale));
  const targetHeight = Math.max(900, Math.round(roomHeightPx * scale));

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `0 0 ${roomWidthPx} ${roomHeightPx}`);
  clone.setAttribute('width', `${targetWidth}`);
  clone.setAttribute('height', `${targetHeight}`);
  clone.style.backgroundColor = '#ffffff';
  clone.style.transform = 'none';
  clone.style.margin = '0';

  // 5. Ensure defs exists and embed typography styles for razor-sharp text rendering
  let defs = clone.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    clone.insertBefore(defs, clone.firstChild);
  }

  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      text-rendering: geometricPrecision;
      -webkit-font-smoothing: antialiased;
      shape-rendering: geometricPrecision;
    }
  `;
  defs.appendChild(styleEl);

  // 6. Ensure solid pure-white background rect at base
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', `${roomWidthPx}`);
  bgRect.setAttribute('height', `${roomHeightPx}`);
  bgRect.setAttribute('fill', '#ffffff');
  clone.insertBefore(bgRect, clone.firstChild);

  // 7. Serialize clean SVG to Blob URL
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(blobUrl);
        reject(new Error('Failed to obtain canvas 2D context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Pure white base
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw SVG at high DPI
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(blobUrl);
      console.error('Error rasterizing floor plan SVG:', err);
      reject(new Error('Could not render floor plan vector into image format.'));
    };

    img.src = blobUrl;
  });
}

/**
 * Generates an executive, high-definition architectural PDF floor plan and seating manifest.
 * Guarantees proper Floordone branding at the bottom of all sheets.
 */
export async function exportFloorPlanToPdf(
  containerElement: HTMLElement | SVGSVGElement | null,
  floorPlan: FloorPlan,
  options: ExportPdfOptions = {}
): Promise<void> {
  const {
    includeManifest = true,
    includeStats = true,
    paperSize = 'a4',
    orientation = 'landscape',
    dpiQuality = 'high',
    includeTitleBlock = true,
    includeCompass = true,
    includeLegend = true
  } = options;

  // DPI Multiplier: Standard = 2x (~150 DPI), High = 3.5x (~300 DPI), Ultra = 5x (~450 DPI)
  const scale = dpiQuality === 'ultra' ? 5.0 : dpiQuality === 'high' ? 3.5 : 2.0;

  // Render high-res canvas directly from SVG
  const canvas = await renderFloorPlanToCanvas(containerElement, floorPlan, scale);
  const imgData = canvas.toDataURL('image/png');

  // Paper dimensions in mm
  const format = paperSize === 'letter' ? 'letter' : 'a4';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const isPortrait = orientation === 'portrait';

  // Sort tables naturally (e.g. Table 1, Table 2, Table 10)
  const tableElements = floorPlan.elements
    .filter((e) => e.type === 'table')
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  // Calculate Seating Stats
  const totalCovers = tableElements.reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);
  const reservedCovers = tableElements
    .filter((e) => e.status === 'reserved' || e.status === 'occupied')
    .reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);
  const availableCovers = tableElements
    .filter((e) => e.status === 'available')
    .reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);
  const vipCovers = tableElements
    .filter((e) => e.status === 'vip')
    .reduce((sum, e) => sum + getEffectiveCovers(e.covers, e.removedChairs), 0);

  // Multi-page calculation for Seating Manifest
  const manifestRowHeight = 6.2;
  const manifestHeaderH = 16;
  const manifestTableColH = 7;
  const manifestFooterH = 12; // includes bottom spacing & Floordone footer
  const manifestSignOffH = 14;

  const availHeightLastPage = pageHeight - margin * 2 - manifestHeaderH - manifestTableColH - manifestSignOffH - manifestFooterH;
  const availHeightMidPage = pageHeight - margin * 2 - manifestHeaderH - manifestTableColH - manifestFooterH;

  const rowsPerLastPage = Math.max(8, Math.floor(availHeightLastPage / manifestRowHeight));
  const rowsPerMidPage = Math.max(10, Math.floor(availHeightMidPage / manifestRowHeight));

  let totalManifestPages = 0;
  if (includeManifest && tableElements.length > 0) {
    if (tableElements.length <= rowsPerLastPage) {
      totalManifestPages = 1;
    } else {
      const remainingAfterLast = tableElements.length - rowsPerLastPage;
      totalManifestPages = 1 + Math.ceil(remainingAfterLast / rowsPerMidPage);
    }
  }

  const totalSheets = 1 + totalManifestPages;

  // Helper: Draws CAD Double Border & Corner Crosshairs
  const drawSheetBorderAndCrosshairs = () => {
    pdf.setDrawColor(15, 23, 42); // slate-900
    pdf.setLineWidth(0.6);
    pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    pdf.setDrawColor(203, 213, 225); // slate-300
    pdf.setLineWidth(0.2);
    pdf.rect(margin + 1.2, margin + 1.2, pageWidth - (margin + 1.2) * 2, pageHeight - (margin + 1.2) * 2);

    const crosshairLen = 2.5;
    const drawCross = (cx: number, cy: number) => {
      pdf.setDrawColor(100, 116, 139);
      pdf.setLineWidth(0.25);
      pdf.line(cx - crosshairLen, cy, cx + crosshairLen, cy);
      pdf.line(cx, cy - crosshairLen, cx, cy + crosshairLen);
    };
    drawCross(margin + 1.2, margin + 1.2);
    drawCross(pageWidth - margin - 1.2, margin + 1.2);
    drawCross(margin + 1.2, pageHeight - margin - 1.2);
    drawCross(pageWidth - margin - 1.2, pageHeight - margin - 1.2);
  };

  // ----------------------------------------------------
  // PAGE 1: ARCHITECTURAL FLOOR PLAN & BLUEPRINT
  // ----------------------------------------------------
  drawSheetBorderAndCrosshairs();

  // 1. Executive Top Header Banner
  const headerHeight = 16.5;
  const headerY = margin + 1.2;
  const headerWidth = pageWidth - (margin + 1.2) * 2;
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(margin + 1.2, headerY, headerWidth, headerHeight, 'F');

  // Floordone Vector Badge in Header
  drawFloordoneVectorLogo(pdf, margin + 3.8, headerY + 2.4, 11.5);

  // Header Title & Project Metadata
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(245, 158, 11); // amber-500
  pdf.text('FLOORDONE ARCHITECTURAL SYSTEM • SHEET A-101', margin + 18, headerY + 5.2);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(255, 255, 255);
  const maxPlanNameLen = isPortrait ? 28 : 46;
  const truncatedPlanName = floorPlan.name.length > maxPlanNameLen
    ? `${floorPlan.name.slice(0, maxPlanNameLen - 3)}...`
    : floorPlan.name;
  pdf.text(truncatedPlanName.toUpperCase(), margin + 18, headerY + 10.2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(203, 213, 225); // slate-300
  const roomArea = floorPlan.roomWidth * floorPlan.roomHeight;
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const subMeta = isPortrait
    ? `VENUE: ${floorPlan.venueType.toUpperCase()}  |  ${floorPlan.roomWidth}×${floorPlan.roomHeight} ${floorPlan.unit.toUpperCase()} (${roomArea.toLocaleString()} SQ ${floorPlan.unit.toUpperCase()})  |  1:20`
    : `VENUE: ${floorPlan.venueType.toUpperCase()}  |  DIMENSIONS: ${floorPlan.roomWidth} × ${floorPlan.roomHeight} ${floorPlan.unit.toUpperCase()} (${roomArea.toLocaleString()} SQ ${floorPlan.unit.toUpperCase()})  |  SCALE: 1:20`;
  pdf.text(subMeta, margin + 18, headerY + 14.2);

  // Right Status Pill: "APPROVED FOR SERVICE"
  const pillW = 42;
  const pillH = 5.8;
  const pillX = pageWidth - margin - 1.2 - pillW - 3;
  const pillY = headerY + 3.8;
  pdf.setFillColor(6, 78, 59); // emerald-900
  pdf.setDrawColor(5, 150, 105); // emerald-600
  pdf.setLineWidth(0.2);
  pdf.roundedRect(pillX, pillY, pillW, pillH, 1.2, 1.2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(52, 211, 153); // emerald-400
  pdf.text('● APPROVED FOR SERVICE', pillX + 3.2, pillY + 4.1);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(`${formattedDate} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pillX, pillY + 10.2);

  let currentY = headerY + headerHeight + 2.5;

  // 2. Stats & Capacity Summary Cards Bar
  if (includeStats) {
    const statsBarHeight = 10.5;
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin + 2, currentY, pageWidth - (margin + 2) * 2, statsBarHeight, 1.2, 1.2, 'FD');

    const statColCount = 5;
    const statColW = (pageWidth - (margin + 2) * 2) / statColCount;

    const statsData = [
      { label: isPortrait ? 'TABLES' : 'TOTAL TABLES', val: `${tableElements.length}`, color: [15, 23, 42] },
      { label: isPortrait ? 'COVERS' : 'TOTAL COVERS', val: `${totalCovers} seats`, color: [79, 70, 229] },
      { label: isPortrait ? 'AVAILABLE' : 'AVAILABLE SEATS', val: `${availableCovers} seats`, color: [16, 185, 129] },
      { label: isPortrait ? 'RESERVED' : 'RESERVED / OCC', val: `${reservedCovers} seats`, color: [217, 119, 6] },
      { label: isPortrait ? 'VIP DINING' : 'VIP COVERS', val: `${vipCovers} seats`, color: [147, 51, 234] }
    ];

    statsData.forEach((stat, i) => {
      const colX = margin + 2 + i * statColW;
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(stat.label, colX + 3.5, currentY + 4);

      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      pdf.text(stat.val, colX + 3.5, currentY + 8.5);

      if (i < statColCount - 1) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.2);
        pdf.line(colX + statColW, currentY + 1.8, colX + statColW, currentY + statsBarHeight - 1.8);
      }
    });

    currentY += statsBarHeight + 2.5;
  }

  // 3. Layout Calculations for Viewport, Legend, Title Block & Floordone Footer
  const footerHeight = 10;
  const footerY = pageHeight - margin - 1.2 - footerHeight;

  // Title Block Dimensions
  const titleBlockW = 76;
  const titleBlockH = 13.5;
  const titleBlockX = pageWidth - margin - 2 - titleBlockW;
  const titleBlockY = footerY - 1.8 - titleBlockH;

  // Total bottom reserved space so canvas never collides
  const bottomReservedSpace = (includeTitleBlock || includeLegend ? titleBlockH + 3.5 : 0) + footerHeight + 4;
  const availableCanvasW = pageWidth - (margin + 3) * 2;
  const availableCanvasH = pageHeight - currentY - bottomReservedSpace;

  const canvasRatio = canvas.width / canvas.height;
  let imgWidth = availableCanvasW;
  let imgHeight = availableCanvasW / canvasRatio;

  if (imgHeight > availableCanvasH) {
    imgHeight = availableCanvasH;
    imgWidth = imgHeight * canvasRatio;
  }

  const imgX = margin + 3 + (availableCanvasW - imgWidth) / 2;
  const imgY = currentY + (availableCanvasH - imgHeight) / 2;

  // Draw CAD Viewport Border
  pdf.setFillColor(255, 255, 255);
  pdf.rect(imgX - 0.4, imgY - 0.4, imgWidth + 0.8, imgHeight + 0.8, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.rect(imgX - 0.4, imgY - 0.4, imgWidth + 0.8, imgHeight + 0.8, 'D');

  // Embed the high-resolution raster image (300-450 DPI)
  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST');

  // Compass Rose (North Arrow) in top-left of plan viewport
  if (includeCompass) {
    const compassX = imgX + 6.5;
    const compassY = imgY + 6.5;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.2);
    pdf.circle(compassX, compassY, 3.8, 'FD');

    // North Pointer
    pdf.setFillColor(15, 23, 42);
    pdf.triangle(compassX, compassY - 3.2, compassX - 1.1, compassY + 0.9, compassX, compassY, 'F');
    pdf.setFillColor(203, 213, 225);
    pdf.triangle(compassX, compassY - 3.2, compassX + 1.1, compassY + 0.9, compassX, compassY, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(4.8);
    pdf.setTextColor(15, 23, 42);
    pdf.text('N', compassX - 0.8, compassY - 4.1);
  }

  // 4. Architectural Title Block & Stamp (Bottom Right)
  if (includeTitleBlock) {
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.3);
    pdf.rect(titleBlockX, titleBlockY, titleBlockW, titleBlockH, 'FD');

    // Internal dividers
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.2);
    pdf.line(titleBlockX, titleBlockY + 6.8, titleBlockX + titleBlockW, titleBlockY + 6.8);
    pdf.line(titleBlockX + 38, titleBlockY, titleBlockX + 38, titleBlockY + titleBlockH);

    // Cell 1: Project
    pdf.setFontSize(4.8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('PROJECT SPECIFICATION', titleBlockX + 2, titleBlockY + 2.7);
    pdf.setFontSize(6.2);
    pdf.setTextColor(15, 23, 42);
    const shortName = floorPlan.name.length > 20 ? `${floorPlan.name.slice(0, 18)}...` : floorPlan.name;
    pdf.text(shortName.toUpperCase(), titleBlockX + 2, titleBlockY + 5.5);

    // Cell 2: Drawing No / Rev
    pdf.setFontSize(4.8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('DRAWING / SHEET', titleBlockX + 40, titleBlockY + 2.7);
    pdf.setFontSize(6.2);
    pdf.setTextColor(79, 70, 229);
    pdf.text(`FL-101 • REV 2.0`, titleBlockX + 40, titleBlockY + 5.5);

    // Cell 3: Scale & Res
    pdf.setFontSize(4.8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('SCALE / PRECISION', titleBlockX + 2, titleBlockY + 9.5);
    pdf.setFontSize(5.8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`1:20 • ${dpiQuality.toUpperCase()} HD (300+ DPI)`, titleBlockX + 2, titleBlockY + 12.2);

    // Cell 4: Authorization
    pdf.setFontSize(4.8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('AUTHORIZATION SIGN-OFF', titleBlockX + 40, titleBlockY + 9.5);
    pdf.setFontSize(5.8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`MAÎTRE D' / GM APPROVED`, titleBlockX + 40, titleBlockY + 12.2);
  }

  // 5. Architectural Legend (Bottom Left, with automatic wrapping so it never collides with Title Block)
  if (includeLegend) {
    const legendX = margin + 3;
    const legendY = titleBlockY + 1;
    const maxLegendW = includeTitleBlock ? titleBlockX - legendX - 4 : pageWidth - margin * 2 - 6;

    pdf.setFontSize(5.2);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('ARCHITECTURAL LEGEND & STATUS KEY:', legendX, legendY);

    const legendItems = [
      { label: 'Available Table', color: [16, 185, 129] },
      { label: 'Reserved / Occupied', color: [217, 119, 6] },
      { label: 'VIP Dining Table', color: [147, 51, 234] },
      { label: 'Wall / Partition', color: [30, 41, 59] },
      { label: 'Patio Deck / Paver', color: [180, 83, 9] },
      { label: 'Botanical Plant', color: [22, 163, 74] }
    ];

    let legOffsetX = 0;
    let legOffsetY = 4.2;
    legendItems.forEach((item) => {
      const itemW = pdf.getTextWidth(item.label) + 6.5;
      if (legOffsetX + itemW > maxLegendW && legOffsetX > 0) {
        legOffsetX = 0;
        legOffsetY += 4.2;
      }

      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.circle(legendX + legOffsetX + 1.2, legendY + legOffsetY - 0.4, 1.1, 'F');

      pdf.setFontSize(5.2);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(51, 65, 85);
      pdf.text(item.label, legendX + legOffsetX + 3.2, legendY + legOffsetY);

      legOffsetX += itemW;
    });
  }

  // 6. Signature Floordone Branding at the Bottom of Page 1
  drawFloordoneFooter(pdf, 1, totalSheets, pageWidth, pageHeight, margin);

  // ----------------------------------------------------
  // PAGE 2+: SEATING MANIFEST & MAÎTRE D' RUN SHEET
  // ----------------------------------------------------
  if (includeManifest && tableElements.length > 0) {
    let currentManifestPage = 1;
    let processedTableIndex = 0;

    while (processedTableIndex < tableElements.length) {
      pdf.addPage(format, orientation);
      currentManifestPage++;

      drawSheetBorderAndCrosshairs();

      // Page Header Banner
      const p2HeaderY = margin + 1.2;
      pdf.setFillColor(15, 23, 42); // slate-900
      pdf.rect(margin + 1.2, p2HeaderY, headerWidth, 15.5, 'F');

      drawFloordoneVectorLogo(pdf, margin + 3.8, p2HeaderY + 2.2, 11);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(245, 158, 11); // amber-500
      pdf.text(`FLOORDONE ARCHITECTURAL SYSTEM • SHEET A-${101 + currentManifestPage - 1}`, margin + 18, p2HeaderY + 5.2);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${floorPlan.name.toUpperCase()} — SEATING MANIFEST & RUN SHEET`, margin + 18, p2HeaderY + 10);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(203, 213, 225);
      pdf.text(
        `SERVICE RUN SHEET FOR MAÎTRE D', HOST STAND & KITCHEN CAPTAIN  |  TOTAL COVERS: ${totalCovers}  |  DATE: ${formattedDate}`,
        margin + 18,
        p2HeaderY + 13.8
      );

      // Table configuration (Percentage-based columns for 100% responsiveness)
      const tableLeft = margin + 3;
      const tableRight = pageWidth - margin - 3;
      const tableTotalW = tableRight - tableLeft;
      let tableY = p2HeaderY + 18.5;

      const colDefs = [
        { name: 'TABLE #', weight: 0.12 },
        { name: 'SHAPE & SPECS', weight: 0.13 },
        { name: 'COVERS', weight: 0.11 },
        { name: 'SERVICE STATUS', weight: 0.16 },
        { name: 'GUEST / PARTY NAME', weight: 0.23 },
        { name: 'SPECIAL NOTES & ALLOCATIONS', weight: 0.25 }
      ];

      // Table Header Row
      pdf.setFillColor(30, 41, 59); // slate-800
      pdf.rect(tableLeft, tableY, tableTotalW, 6.8, 'F');

      pdf.setFontSize(6.2);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(248, 250, 252);

      let headerAccX = tableLeft;
      colDefs.forEach((col) => {
        const colW = tableTotalW * col.weight;
        pdf.text(col.name, headerAccX + 2.5, tableY + 4.6);
        headerAccX += colW;
      });

      tableY += 6.8;

      // Determine rows for this page
      const isLastManifestSheet = (tableElements.length - processedTableIndex) <= rowsPerLastPage;
      const maxRowsThisPage = isLastManifestSheet ? rowsPerLastPage : rowsPerMidPage;
      const endTableIndex = Math.min(tableElements.length, processedTableIndex + maxRowsThisPage);

      // Render table rows
      for (let i = processedTableIndex; i < endTableIndex; i++) {
        const tbl = tableElements[i];
        const isEven = i % 2 === 0;

        // Alternating row background
        if (isEven) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(tableLeft, tableY, tableTotalW, manifestRowHeight, 'F');
        }

        // Bottom border line
        pdf.setDrawColor(241, 245, 249);
        pdf.setLineWidth(0.2);
        pdf.line(tableLeft, tableY + manifestRowHeight, tableRight, tableY + manifestRowHeight);

        let cellX = tableLeft;

        // 1. Table Name
        const col0W = tableTotalW * colDefs[0].weight;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.8);
        pdf.setTextColor(15, 23, 42);
        pdf.text(tbl.name, cellX + 2.5, tableY + 4.2);
        cellX += col0W;

        // 2. Shape
        const col1W = tableTotalW * colDefs[1].weight;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.2);
        pdf.setTextColor(71, 85, 105);
        pdf.text(tbl.shape.toUpperCase(), cellX + 2.5, tableY + 4.2);
        cellX += col1W;

        // 3. Seats (Effective vs Total)
        const col2W = tableTotalW * colDefs[2].weight;
        const effectiveSeats = getEffectiveCovers(tbl.covers, tbl.removedChairs);
        const seatsText = effectiveSeats !== tbl.covers ? `${effectiveSeats} (${tbl.covers}) seats` : `${tbl.covers} seats`;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.8);
        pdf.setTextColor(15, 23, 42);
        pdf.text(seatsText, cellX + 2.5, tableY + 4.2);
        cellX += col2W;

        // 4. Status Pill
        const col3W = tableTotalW * colDefs[3].weight;
        let pillBg: [number, number, number] = [236, 253, 245]; // green
        let pillFg: [number, number, number] = [5, 150, 105];
        if (tbl.status === 'vip') {
          pillBg = [250, 245, 255];
          pillFg = [126, 34, 206];
        } else if (tbl.status === 'reserved' || tbl.status === 'occupied') {
          pillBg = [254, 243, 199];
          pillFg = [180, 83, 9];
        } else if (tbl.status === 'blocked') {
          pillBg = [241, 245, 249];
          pillFg = [100, 116, 139];
        }

        const pillWidth = Math.min(28, col3W - 4);
        pdf.setFillColor(pillBg[0], pillBg[1], pillBg[2]);
        pdf.roundedRect(cellX + 2, tableY + 1.2, pillWidth, 4.2, 0.8, 0.8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(5.2);
        pdf.setTextColor(pillFg[0], pillFg[1], pillFg[2]);
        pdf.text(tbl.status.toUpperCase(), cellX + 3.5, tableY + 3.9);
        cellX += col3W;

        // 5. Guest / Party Name
        const col4W = tableTotalW * colDefs[4].weight;
        pdf.setFont('helvetica', tbl.guestName ? 'bold' : 'normal');
        pdf.setFontSize(6.8);
        pdf.setTextColor(tbl.guestName ? 15 : 148, tbl.guestName ? 23 : 163, tbl.guestName ? 42 : 184);
        const guestStr = tbl.guestName || '—';
        const truncatedGuest = guestStr.length > 24 ? `${guestStr.slice(0, 22)}...` : guestStr;
        pdf.text(truncatedGuest, cellX + 2.5, tableY + 4.2);
        cellX += col4W;

        // 6. Special Notes & Allocations
        const col5W = tableTotalW * colDefs[5].weight;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.2);
        pdf.setTextColor(100, 116, 139);
        const noteStr = tbl.notes ? (tbl.notes.length > 36 ? `${tbl.notes.slice(0, 34)}...` : tbl.notes) : '—';
        pdf.text(noteStr, cellX + 2.5, tableY + 4.2);

        tableY += manifestRowHeight;
      }

      processedTableIndex = endTableIndex;

      // On the final manifest page, render the authorization Sign-Off block
      if (processedTableIndex >= tableElements.length) {
        const signOffY = footerY - 14;
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.line(tableLeft, signOffY, tableRight, signOffY);

        pdf.setFontSize(5.8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(71, 85, 105);
        const sigColW = (tableRight - tableLeft) / 3;
        pdf.text("MAÎTRE D' SIGNATURE: ____________________________", tableLeft + 2, signOffY + 5.2);
        pdf.text('GENERAL MANAGER: ____________________________', tableLeft + sigColW + 2, signOffY + 5.2);
        pdf.text('SERVICE BRIEFING COMPLETED:  [  ] YES    [  ] NO', tableLeft + sigColW * 2 + 2, signOffY + 5.2);
      }

      // Floordone Footer at the bottom of EVERY manifest sheet
      drawFloordoneFooter(pdf, currentManifestPage, totalSheets, pageWidth, pageHeight, margin);
    }
  }

  // Save the PDF with a clean sanitized filename
  const sanitizedFilename = `${floorPlan.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-floorplan.pdf`;
  pdf.save(sanitizedFilename);
}

/**
 * Exports high-resolution PNG image directly from floor plan vector canvas with Floordone branding.
 */
export async function exportFloorPlanToPng(
  containerElement: HTMLElement | SVGSVGElement | null,
  filename: string,
  floorPlan?: FloorPlan,
  scale: number = 3.5
): Promise<void> {
  const plan = floorPlan || ({
    roomWidth: 45,
    roomHeight: 35
  } as FloorPlan);

  const canvas = await renderFloorPlanToCanvas(containerElement, plan, scale);

  // Add subtle Floordone watermark badge in bottom-right corner of PNG
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const badgeW = 210;
    const badgeH = 34;
    const bx = canvas.width - badgeW - 20;
    const by = canvas.height - badgeH - 20;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('floor', bx + 16, by + 21);

    ctx.fillStyle = '#818cf8';
    ctx.fillText('done.', bx + 44, by + 21);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('• floordone.com', bx + 84, by + 21);
    ctx.restore();
  }

  const link = document.createElement('a');
  link.download = `${filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-hd.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

